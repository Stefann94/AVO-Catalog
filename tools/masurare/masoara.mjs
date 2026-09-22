#!/usr/bin/env node
/**
 * Măsurare de viteză și SEO tehnic, cu aceeași metodă pentru solarone.ro și
 * pentru copia de test. Comparația dintre cele două are sens doar dacă ambele
 * se măsoară identic — de aceea metoda stă într-un singur fișier.
 *
 *   node masoara.mjs <pagini.json> <prefix-iesire> [--rulari=3] [--curl=5]
 *
 *   pagini.json    [{ "eticheta": "...", "tip": "produs|categorie|acasa|brand", "url": "..." }]
 *   prefix-iesire  ex. ../../docs/baseline/solarone-2026-09-22  →  .json + .md
 *
 * ─── METODA ───────────────────────────────────────────────────────────────
 *
 * 1. Lighthouse 13, profilul implicit de MOBIL: Moto G Power emulat, rețea
 *    „Slow 4G" simulată (RTT 150 ms, 1,6 Mbps), procesor încetinit de 4 ori.
 *    `--rulari` rulări pe pagină; se raportează rularea MEDIANĂ după LCP.
 *    De aici: Performance, SEO, LCP, CLS, TBT, FCP, JS transferat, total.
 *
 * 2. TTFB separat, prin curl, de `--curl` ori pe pagină, mediana: timpul de la
 *    trimiterea cererii până la primul octet (time_starttransfer minus
 *    time_pretransfer), adică strict cât gândește serverul, fără DNS și TLS.
 *    Lighthouse raportează și el „server-response-time", dar dintr-o singură
 *    cerere; curl de mai multe ori e mai stabil.
 *
 * 3. HTML-ul descărcat o dată (decodat) și analizat: mărime, CSS inline,
 *    titlu, meta descriere, canonical, meta robots, număr de H1, tipurile
 *    JSON-LD și câmpurile din schema Product (availability, gtin, mpn, brand,
 *    priceValidUntil).
 *
 * Toate cererile sunt GET de citire, câteva zeci pe pagină cu tot cu resurse.
 * Nu se trimite nimic și nu se modifică nimic pe site-ul măsurat.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const run = promisify(execFile);
const UA =
  "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

const [fisierPagini, prefix, ...rest] = process.argv.slice(2);
if (!fisierPagini || !prefix) {
  console.error("folosire: node masoara.mjs <pagini.json> <prefix-iesire> [--rulari=3] [--curl=5]");
  process.exit(1);
}
const opt = Object.fromEntries(rest.map((a) => a.replace(/^--/, "").split("=")));
const RULARI = Number(opt.rulari ?? 3);
const CURL = Number(opt.curl ?? 5);

const mediana = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

async function ttfb(url) {
  const valori = [];
  let transferat = 0;
  for (let i = 0; i < CURL; i++) {
    const { stdout } = await run("curl", [
      "-s", "-L", "--compressed", "-A", UA, "-o", process.platform === "win32" ? "NUL" : "/dev/null",
      "-w", "%{time_pretransfer} %{time_starttransfer} %{size_download} %{http_code}", url,
    ]);
    const [pre, start, marime] = stdout.trim().split(" ").map(Number);
    valori.push((start - pre) * 1000);
    transferat = marime;
  }
  return { ttfbMs: Math.round(mediana(valori)), ttfbToateMs: valori.map(Math.round), htmlTransferatBytes: transferat };
}

function analizeazaHtml(html) {
  const potrivire = (re) => html.match(re)?.[1]?.trim() ?? null;
  const cssInline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].reduce((s, m) => s + Buffer.byteLength(m[1]), 0);
  const scripturiInline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].reduce((s, m) => s + Buffer.byteLength(m[1]), 0);

  const blocuriLd = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const tipuri = new Set();
  const produse = [];
  const colecteaza = (nod) => {
    if (!nod || typeof nod !== "object") return;
    if (Array.isArray(nod)) return nod.forEach(colecteaza);
    const t = nod["@type"];
    for (const x of [t].flat().filter(Boolean)) tipuri.add(x);
    if ([t].flat().includes("Product")) produse.push(nod);
    for (const v of Object.values(nod)) if (typeof v === "object") colecteaza(v);
  };
  let ldInvalid = 0;
  for (const b of blocuriLd) {
    try { colecteaza(JSON.parse(b[1])); } catch { ldInvalid++; }
  }
  const p = produse[0];
  const oferta = p ? [p.offers].flat()[0] : null;

  return {
    htmlBytes: Buffer.byteLength(html),
    cssInlineBytes: cssInline,
    jsInlineBytes: scripturiInline,
    titlu: potrivire(/<title[^>]*>([\s\S]*?)<\/title>/i),
    metaDescriere: potrivire(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
    canonical: potrivire(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    metaRobots: potrivire(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i),
    h1: (html.match(/<h1[\s>]/gi) ?? []).length,
    jsonLdTipuri: [...tipuri],
    jsonLdInvalid: ldInvalid,
    schemaProduct: p
      ? {
          availability: Boolean(oferta?.availability),
          price: oferta?.price ?? null,
          priceCurrency: oferta?.priceCurrency ?? null,
          priceValidUntil: Boolean(oferta?.priceValidUntil),
          gtin: Boolean(p.gtin || p.gtin13 || p.gtin8 || p.gtin12 || p.gtin14),
          mpn: Boolean(p.mpn),
          sku: Boolean(p.sku),
          brand: Boolean(p.brand),
        }
      : null,
  };
}

function extrageLighthouse(lhr) {
  const a = lhr.audits;
  const rezumat = a["resource-summary"]?.details?.items ?? [];
  const bytes = (tip) => rezumat.find((i) => i.resourceType === tip)?.transferSize ?? 0;
  return {
    performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
    lcpMs: Math.round(a["largest-contentful-paint"]?.numericValue ?? 0),
    fcpMs: Math.round(a["first-contentful-paint"]?.numericValue ?? 0),
    cls: Number((a["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)),
    tbtMs: Math.round(a["total-blocking-time"]?.numericValue ?? 0),
    siMs: Math.round(a["speed-index"]?.numericValue ?? 0),
    ttfbLighthouseMs: Math.round(a["server-response-time"]?.numericValue ?? 0),
    jsTransferatBytes: bytes("script"),
    cssTransferatBytes: bytes("stylesheet"),
    imaginiTransferatBytes: bytes("image"),
    totalTransferatBytes: bytes("total"),
    cereri: rezumat.find((i) => i.resourceType === "total")?.requestCount ?? 0,
    seoEsuate: Object.values(lhr.categories.seo?.auditRefs ?? [])
      .map((r) => a[r.id])
      .filter((x) => x && x.score === 0)
      .map((x) => x.id),
  };
}

const pagini = JSON.parse(await readFile(fisierPagini, "utf8"));
// chrome-launcher își scrie jurnalul în userDataDir, dar nu creează directorul.
const profilChrome = resolve(tmpdir(), "avo-masurare-chrome");
await mkdir(profilChrome, { recursive: true });
const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless=new", "--no-first-run", "--disable-extensions"],
  userDataDir: profilChrome,
});

const rezultate = [];
try {
  for (const pagina of pagini) {
    process.stdout.write(`${pagina.eticheta} … `);
    const raspuns = await fetch(pagina.url, { headers: { "user-agent": UA, "accept-encoding": "gzip, br" }, redirect: "follow" });
    const html = await raspuns.text();
    const analiza = analizeazaHtml(html);
    const timp = await ttfb(pagina.url);

    const rulari = [];
    for (let i = 0; i < RULARI; i++) {
      const r = await lighthouse(pagina.url, { port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance", "seo"] });
      rulari.push(extrageLighthouse(r.lhr));
    }
    const lcpMedian = mediana(rulari.map((r) => r.lcpMs));
    const lh = rulari.find((r) => r.lcpMs === lcpMedian) ?? rulari[0];

    rezultate.push({ ...pagina, urlFinal: raspuns.url, status: raspuns.status, ...timp, ...analiza, lighthouse: lh, lighthouseRulari: rulari });
    console.log(`LCP ${lh.lcpMs} ms, TTFB ${timp.ttfbMs} ms, HTML ${Math.round(analiza.htmlBytes / 1024)} KB`);
  }
} finally {
  await chrome.kill();
}

const kb = (b) => (b / 1024).toFixed(0);
const s = (ms) => (ms / 1000).toFixed(2).replace(".", ",");
const data = new Date().toISOString().slice(0, 10);
const md = [
  `# Măsurare ${data}`,
  "",
  `Metoda: tools/masurare/masoara.mjs — Lighthouse ${"13"} mobil (Slow 4G simulat, CPU ×4), mediana din ${RULARI} rulări după LCP; TTFB prin curl, mediana din ${CURL} cereri.`,
  "",
  "## Viteză",
  "",
  "| Pagină | TTFB | LCP | FCP | CLS | TBT | Perf | SEO | HTML | CSS inline | JS | Total |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|",
  ...rezultate.map((r) =>
    `| ${r.eticheta} | ${r.ttfbMs} ms | ${s(r.lighthouse.lcpMs)} s | ${s(r.lighthouse.fcpMs)} s | ${String(r.lighthouse.cls).replace(".", ",")} | ${r.lighthouse.tbtMs} ms | ${r.lighthouse.performance} | ${r.lighthouse.seo} | ${kb(r.htmlBytes)} KB | ${kb(r.cssInlineBytes)} KB | ${kb(r.lighthouse.jsTransferatBytes)} KB | ${kb(r.lighthouse.totalTransferatBytes)} KB |`),
  "",
  `Mediane pe cele ${rezultate.length} pagini: TTFB ${Math.round(mediana(rezultate.map((r) => r.ttfbMs)))} ms · LCP ${s(mediana(rezultate.map((r) => r.lighthouse.lcpMs)))} s · HTML ${kb(mediana(rezultate.map((r) => r.htmlBytes)))} KB · JS ${kb(mediana(rezultate.map((r) => r.lighthouse.jsTransferatBytes)))} KB · Performance ${Math.round(mediana(rezultate.map((r) => r.lighthouse.performance)))} · SEO ${mediana(rezultate.map((r) => r.lighthouse.seo))}`,
  "",
  "HTML și CSS inline = octeți decodați ai documentului; JS și Total = octeți transferați (comprimați), din Lighthouse.",
  "",
  "## SEO tehnic",
  "",
  "| Pagină | Canonical | Robots | H1 | JSON-LD | Product: availability / gtin / mpn / brand / priceValidUntil |",
  "|---|---|---|---|---|---|",
  ...rezultate.map((r) => {
    const p = r.schemaProduct;
    const da = (x) => (x ? "da" : "nu");
    const canon = r.canonical ? (r.canonical === r.urlFinal ? "= URL" : r.canonical) : "lipsă";
    return `| ${r.eticheta} | ${canon} | ${r.metaRobots ?? "—"} | ${r.h1} | ${r.jsonLdTipuri.join(", ") || "—"} | ${p ? [p.availability, p.gtin, p.mpn, p.brand, p.priceValidUntil].map(da).join(" / ") : "—"} |`;
  }),
  "",
].join("\n");

await mkdir(dirname(resolve(prefix)), { recursive: true });
await writeFile(`${prefix}.json`, JSON.stringify({ data, metoda: { rulari: RULARI, curl: CURL, lighthouse: "13.5.0", profil: "mobil, Slow 4G simulat" }, rezultate }, null, 2));
await writeFile(`${prefix}.md`, md);
console.log(`\nscris: ${prefix}.json, ${prefix}.md`);
