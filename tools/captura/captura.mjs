#!/usr/bin/env node
/**
 * Captură de ecran a paginii randate, fără nicio dependență instalată.
 *
 * ─── DE CE EXISTĂ ─────────────────────────────────────────────────────────
 *
 * Un defect vizual — un contur care se rupe, un gri prea deschis, o bandă care
 * nu se aliniază — nu se poate diagnostica citind cod. Trebuie văzut. Pentru
 * asta erau trei variante:
 *
 *   Playwright / Puppeteer ... corecte, dar fiecare descarcă propriul Chromium,
 *                              ~130 MB, pentru un browser deja instalat.
 *   `chrome --screenshot` ..... zero instalare, dar capturează DOAR cât ține
 *                              fereastra. Hero-ul acestui site are `100svh`:
 *                              cu fereastră înaltă, restul paginii iese din
 *                              cadru; cu fereastră mică, nu se vede decât
 *                              hero-ul. Inutilizabil aici. Verificat.
 *   protocolul DevTools ....... ce e mai jos.
 *
 * Node 22+ are `WebSocket` în limbaj, iar Chrome vorbește CDP pe WebSocket.
 * Deci driverul încape într-un fișier, fără `npm install`, și folosește
 * Chrome-ul care e deja pe mașină.
 *
 * ─── CE POATE ÎN PLUS FAȚĂ DE `--screenshot` ──────────────────────────────
 *
 *   setDeviceMetricsOverride ... fereastră de dimensiune realistă, deci
 *      `100svh` are valoarea pe care o are la un utilizator adevărat.
 *   captureBeyondViewport ...... pagina ÎNTREAGĂ într-o singură imagine,
 *      oricât de lungă, fără derulare și fără lipit bucăți.
 *   clip ....................... o zonă anume, la rezoluție nativă — ceea ce
 *      contează când te uiți la o linie de 1px.
 *   deviceScaleFactor .......... 2x, ca antialiasingul unui contur să se vadă,
 *      nu să se piardă în scalare.
 *
 * ─── FOLOSIRE ─────────────────────────────────────────────────────────────
 *
 *   node tools/captura/captura.js <url> <fisier.png> [optiuni]
 *
 *     --latime=1440     lățimea ferestrei
 *     --inaltime=900    înălțimea ferestrei
 *     --scala=2         factor de densitate
 *     --intreaga        pagina întreagă, nu doar fereastra
 *     --selector=...    decupează exact elementul care se potrivește
 *     --asteapta=1200   milisecunde în plus după navigare
 *
 * ─── UNDE SCRIE ───────────────────────────────────────────────────────────
 *
 * Fișierul e scris de NODE, nu de Chrome, și nu e un amănunt: procesul Chrome
 * pornit din sesiunea de agent n-a putut scrie în directorul temporar
 * („Access is denied"), dar Node scrie oriunde are voie procesul curent.
 * Imaginea vine prin CDP ca base64; Chrome nu atinge discul deloc.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Chrome-urile obișnuite de pe Windows, în ordinea în care merită încercate. */
const CANDIDATI = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  (process.env.LOCALAPPDATA || "") + "/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

function gasesteBrowser() {
  const gasit = CANDIDATI.find((c) => c && existsSync(c));
  if (!gasit) {
    throw new Error("Niciun Chrome sau Edge gasit. Adauga calea in CANDIDATI.");
  }
  return gasit;
}

/** Client CDP minimal: comenzi numerotate, raspunsul se potriveste dupa id. */
function conecteaza(url) {
  return new Promise((rezolva, respinge) => {
    const ws = new WebSocket(url);
    const inAsteptare = new Map();
    let id = 0;

    ws.addEventListener("message", (ev) => {
      const m = JSON.parse(ev.data);
      const p = inAsteptare.get(m.id);
      if (!p) return;
      inAsteptare.delete(m.id);
      if (m.error) p.respinge(new Error(m.error.message));
      else p.rezolva(m.result);
    });

    ws.addEventListener("error", () => respinge(new Error("WebSocket esuat")));
    ws.addEventListener("open", () =>
      rezolva({
        trimite: (method, params = {}) =>
          new Promise((rezolva2, respinge2) => {
            const cerere = ++id;
            inAsteptare.set(cerere, { rezolva: rezolva2, respinge: respinge2 });
            ws.send(JSON.stringify({ id: cerere, method, params }));
          }),
        inchide: () => ws.close(),
      }),
    );
  });
}

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms));

/** Chrome are nevoie de o clipa pana deschide portul; incercam pana raspunde. */
async function asteaptaPortul(port, incercari = 80) {
  for (let i = 0; i < incercari; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`);
      const tinte = await r.json();
      const pagina = tinte.find((t) => t.type === "page");
      if (pagina && pagina.webSocketDebuggerUrl) return pagina.webSocketDebuggerUrl;
    } catch {
      /* inca nu asculta */
    }
    await asteapta(250);
  }
  throw new Error("Chrome n-a deschis portul de depanare.");
}

function optiune(nume, implicit) {
  const gasit = process.argv.find((a) => a.startsWith(`--${nume}=`));
  return gasit ? gasit.split("=").slice(1).join("=") : implicit;
}

const url = process.argv[2];
const iesire = process.argv[3];
if (!url || !iesire) {
  console.error("Folosire: node tools/captura/captura.js <url> <fisier.png> [optiuni]");
  process.exit(1);
}

const latime = Number(optiune("latime", 1440));
const inaltime = Number(optiune("inaltime", 900));
const scala = Number(optiune("scala", 2));
const selector = optiune("selector", "");
const intreaga = process.argv.includes("--intreaga");
const rabdare = Number(optiune("asteapta", 1200));

const port = 9222 + Math.floor(Math.random() * 700);
const proces = spawn(
  gasesteBrowser(),
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    `--remote-debugging-port=${port}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

try {
  const cdp = await conecteaza(await asteaptaPortul(port));

  await cdp.trimite("Page.enable");
  await cdp.trimite("Emulation.setDeviceMetricsOverride", {
    width: latime,
    height: inaltime,
    deviceScaleFactor: scala,
    mobile: false,
  });

  await cdp.trimite("Page.navigate", { url });

  /* O asteptare fixa dupa navigare, nu ascultare pe `Page.loadEventFired`:
     pagina are fotografii care vin de pe alt domeniu, iar evenimentul de load
     s-ar declansa oricum inaintea lor. Se mareste cu `--asteapta` cand e cazul. */
  await asteapta(rabdare);

  /* `--hover=<selector>` mută cursorul în centrul elementului, prin protocol,
     și așteaptă un cadru. Fără asta, o stare `:hover` nu se poate fotografia
     deloc: CSS-ul nu se poate forța din afară, iar clasa nu există în DOM. */
  const tintaHover = optiune("hover", "");
  if (tintaHover) {
    const { result } = await cdp.trimite("Runtime.evaluate", {
      expression:
        "(() => { const el = document.querySelector(" +
        JSON.stringify(tintaHover) +
        "); if (!el) return null; el.scrollIntoView({ block: 'center' });" +
        " const r = el.getBoundingClientRect();" +
        " return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 }); })()",
      returnByValue: true,
    });
    if (!result.value) throw new Error("Selectorul de hover nu s-a potrivit: " + tintaHover);
    const punct = JSON.parse(result.value);
    await cdp.trimite("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: punct.x,
      y: punct.y,
    });
    await asteapta(400);
  }

  let clip;
  if (selector) {
    const { result } = await cdp.trimite("Runtime.evaluate", {
      expression:
        "(() => { const el = document.querySelector(" +
        JSON.stringify(selector) +
        "); if (!el) return null; const r = el.getBoundingClientRect();" +
        " return JSON.stringify({ x: r.x + window.scrollX, y: r.y + window.scrollY," +
        " width: r.width, height: r.height, scale: 1 }); })()",
      returnByValue: true,
    });
    if (!result.value) throw new Error("Selectorul nu s-a potrivit: " + selector);
    clip = JSON.parse(result.value);
  }

  const { data } = await cdp.trimite("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: intreaga || Boolean(clip),
    ...(clip ? { clip } : {}),
  });

  const cale = resolve(iesire);
  mkdirSync(dirname(cale), { recursive: true });
  writeFileSync(cale, Buffer.from(data, "base64"));
  console.log("Scris: " + cale);

  cdp.inchide();
} finally {
  proces.kill();
}
