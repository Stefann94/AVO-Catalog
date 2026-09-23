#!/usr/bin/env node
/**
 * DE CE ÎNTÂRZIE PAGINA — diagnostic, nu scor.
 *
 *   node tools/masurare/diagnostic.mjs <url> [<url> ...]
 *
 * ─── DE CE EXISTĂ, PE LÂNGĂ masoara.mjs ───────────────────────────────────
 *
 * `masoara.mjs` spune CÂT: LCP 3,59 s, Performance 87. Atât. Cu cifra aia în
 * mână, singura continuare e ghicitul — o fi fontul? or fi imaginile? o fi
 * serverul? Fiecare bănuială costă o modificare, o construcție și o nouă
 * măsurătoare ca să afli că n-a fost aia.
 *
 * Fișierul ăsta spune DE CE. Scoate cele patru bucăți din care se compune
 * LCP-ul și arată care dintre ele e mare:
 *
 *     Time to first byte ........ cât gândește serverul
 *     Resource load delay ....... cât trece până browserul cere imaginea
 *     Resource load duration .... cât durează descărcarea ei
 *     Element render delay ...... cât stă imaginea descărcată, nedesenată
 *
 * Ultima e cea care demască: dacă imaginea a sosit și tot nu se vede, firul
 * principal e ocupat cu altceva — și atunci „Lucru pe firul principal" de mai
 * jos spune cu ce anume.
 *
 * Exemplu real, fișa de produs, 23.09.2026: server 178 ms, descărcare 100 ms,
 * dar 1080 ms de așteptare până la desenare, cu 1014 ms de calcul de stiluri
 * și 772 ms de execuție JavaScript. Fără descompunerea asta, cifra 3,59 s ar
 * fi trimis pe drumul greșit — spre server și spre imagini, adică exact spre
 * cele două lucruri care erau în regulă.
 *
 * ─── DESPRE NUMELE AUDITURILOR ────────────────────────────────────────────
 *
 * Descompunerea stă în `lcp-breakdown-insight`, nu în
 * `largest-contentful-paint-element`, cum era în Lighthouse 11. Auditurile
 * „insight" sunt noi în Lighthouse 12–13 și le-au înlocuit pe cele vechi;
 * numele vechi încă există, dar întoarce doar elementul, fără faze. Dacă
 * fișierul nu mai scoate nimic după o actualizare de Lighthouse, aici e de
 * căutat: `Object.keys(lhr.audits)` arată ce nume există acum.
 */

import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URLURI = process.argv.slice(2);
if (URLURI.length === 0) {
  console.error("folosire: node tools/masurare/diagnostic.mjs <url> [<url> ...]");
  process.exit(1);
}

const ms = (n) => (n == null ? "—" : `${Math.round(n)} ms`);
const scurt = (u) => String(u).replace(/^https?:\/\/[^/]+/, "") || "/";

const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  /* Profil propriu, creat de noi: Chrome pornit din sesiunea de agent nu poate
     crea singur directorul și cade cu ENOENT. */
  userDataDir: mkdtempSync(join(tmpdir(), "lh-diag-")),
});

try {
  for (const url of URLURI) {
    const { lhr } = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      /* Aceleași condiții ca în masoara.mjs: mobil, rețea și procesor
         încetinite. O măsurătoare pe desktop nerestricționat n-ar arăta
         niciodată problema — firul principal ar termina prea repede. */
      formFactor: "mobile",
      screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
      throttlingMethod: "simulate",
    });

    const a = lhr.audits;
    console.log(`\n${"═".repeat(76)}`);
    console.log(scurt(url));
    console.log("═".repeat(76));
    console.log(
      `FCP ${ms(a["first-contentful-paint"]?.numericValue)}` +
        `   LCP ${ms(a["largest-contentful-paint"]?.numericValue)}` +
        `   TBT ${ms(a["total-blocking-time"]?.numericValue)}` +
        `   CLS ${a["cumulative-layout-shift"]?.numericValue?.toFixed(3) ?? "—"}`,
    );

    /* ── Din ce se compune LCP-ul ─────────────────────────────────────── */
    const bucati = a["lcp-breakdown-insight"]?.details?.items ?? [];
    const tabel = bucati.find((x) => x.type === "table");
    const nod = bucati.find((x) => x.type === "node");
    if (tabel) {
      const total = tabel.items.reduce((s, f) => s + (f.duration ?? 0), 0);
      console.log("\n── Din ce se compune LCP-ul");
      for (const f of tabel.items) {
        const procent = total ? Math.round((f.duration / total) * 100) : 0;
        console.log(`   ${String(f.label).padEnd(24)} ${ms(f.duration).padStart(8)}   ${String(procent).padStart(3)}%`);
      }
    }
    if (nod) console.log(`\n── Elementul cel mai mare: ${nod.nodeLabel ?? "?"}\n   ${nod.selector ?? ""}`);

    /* ── Cu ce e ocupat firul principal ───────────────────────────────── */
    const fir = a["mainthread-work-breakdown"]?.details?.items ?? [];
    if (fir.length) {
      console.log(`\n── Lucru pe firul principal (${a["mainthread-work-breakdown"].displayValue ?? ""})`);
      for (const it of fir) console.log(`   ${String(it.groupLabel).padEnd(32)} ${ms(it.duration).padStart(8)}`);
    }

    /* ── Ce anume blochează, cu numele fișierului ─────────────────────── */
    for (const [cheie, titlu] of [
      ["render-blocking-insight", "Resurse care blochează desenarea"],
      ["network-dependency-tree-insight", "Lanțul de cereri"],
      ["unused-javascript", "JavaScript nefolosit"],
      ["font-display", "Fonturi care ascund textul"],
    ]) {
      const x = a[cheie];
      if (!x || x.score === 1 || !x.details) continue;
      const randuri = x.details.items ?? [];
      if (!randuri.length) continue;
      console.log(`\n── ${titlu}${x.displayValue ? ` (${x.displayValue})` : ""}`);
      for (const it of randuri.slice(0, 6)) {
        if (!it.url) continue;
        const cost = it.wastedMs != null ? ms(it.wastedMs) : it.totalBytes != null ? `${Math.round(it.totalBytes / 1024)} KB` : "";
        console.log(`   ${scurt(it.url).slice(0, 58).padEnd(60)} ${cost}`);
      }
    }
  }
} finally {
  await chrome.kill();
}
