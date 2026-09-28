/**
 * Reguli de clasificare și de extragere a valorilor tehnice.
 *
 * Principiul: tot ce iese de aici trebuie să poată fi arătat cu degetul în
 * datele sursă — în nume, în cod sau în tabelul de specificații. Ce nu se
 * găsește rămâne null și apare în raport; nu se completează „probabil".
 */

export const decodeaza = (s = "") =>
  String(s)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

export const text = (html = "") =>
  decodeaza(decodeaza(html).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

export const fara_diacritice = (s) => s.normalize("NFD").replace(/\p{M}/gu, "");

export function slugifica(s, max = 90) {
  const slug = fara_diacritice(s)
    .toLowerCase()
    .replace(/[.,]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (slug.length <= max) return slug;
  return slug.slice(0, max).replace(/-[^-]*$/, "");
}

const numar = (s) => (s == null ? null : Number(String(s).replace(",", ".")));
const rotunjit = (n, z = 2) => Math.round(n * 10 ** z) / 10 ** z;

/* ─── Branduri ─────────────────────────────────────────────────────────── */

/** Forma afișată a fiecărui brand; cheia e forma din date, fără majuscule. */
const BRANDURI = [
  ["deye", "Deye"], ["huawei", "Huawei"], ["growatt", "Growatt"], ["solis", "Solis"], ["pytes", "Pytes"],
  ["felicity", "Felicity Solar"], ["canadian", "Canadian Solar"], ["aiko", "Aiko"], ["jinko", "Jinko Solar"],
  ["longi", "Longi"], ["tongwei", "Tongwei"], ["ulica", "Ulica Solar"], ["trina", "Trina Solar"],
  ["k2", "K2 Systems"], ["dyness", "Dyness"], ["atmoce", "Atmoce"], ["enershare", "Enershare"],
  ["pcenersys", "PCENERSYS"], ["hailei", "Hailei"], ["fronius", "Fronius"], ["victron", "Victron Energy"],
  ["tigo", "Tigo"], ["eastron", "Eastron"], ["astreea", "Astreea"], ["teison", "Teison"], ["sofar", "Sofar"],
  ["sungrow", "Sungrow"], ["solaredge", "SolarEdge"], ["saj", "SAJ"], ["livoltek", "Livoltek"],
  ["pylontech", "Pylontech"], ["staubli", "Stäubli"], ["amphenol", "Amphenol"], ["topsolar", "TopSolar"],
  ["schrack", "Schrack"], ["chint", "CHINT"], ["jinkosolar", "Jinko Solar"], ["suntera", "Suntera"],
];

export function brand(nume, producator) {
  const surse = [producator, nume].filter(Boolean).map((s) => fara_diacritice(s).toLowerCase());
  for (const s of surse) {
    for (const [cheie, afisat] of BRANDURI) {
      if (new RegExp(`(^|[^a-z])${cheie}([^a-z]|$)`).test(s)) return afisat;
    }
  }
  return null;
}

/* ─── Codul producătorului (MPN) ──────────────────────────────────────── */

const norm = (s) => fara_diacritice(String(s)).toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * `model` din OpenCart e uneori codul real al producătorului, alteori o etichetă
 * internă („Model", „clema_mijloc_CE-1", „Suport-Tabla-Falurita"). Îl acceptăm ca
 * MPN doar dacă apare în numele produsului, e un cod de articol numeric (K2) sau
 * arată a cod: majuscule și cifre, fără liniuță jos și fără cuvinte întregi.
 */
export function codProducator(model, nume) {
  const m = String(model ?? "").replace(/\s+/g, " ").trim();
  if (!m || /^model$/i.test(m) || m.length < 3) return null;
  if (norm(m).length >= 4 && norm(nume).includes(norm(m))) return m;
  if (/^\d{6,8}$/.test(m)) return m;
  if (/_/.test(m)) return null;
  if (/[A-Z]/.test(m) && /\d/.test(m) && !/[a-z]{4,}/.test(m)) return m;
  return null;
}

/* ─── Specificații ────────────────────────────────────────────────────── */

/** Rândurile de antet și cele de documente nu sunt specificații. */
const ANTET = /^(specifica[tț]ie|parametru|caracteristic[aă]|element|valoare|detaliu)$/i;
const FISIER = /^(fi[sș]ier|fi[sș]a tehnic[aă]|manual|certificat|document)/i;

/**
 * Cheile normalizate folosite în filtre, în schema Product și în rezumatul
 * fișei. Restul rândurilor se păstrează cu eticheta originală.
 */
const CHEI = [
  ["putere_pv_max", /putere (maxim[aă] )?(de )?intrare pv|putere pv maxim|putere maxim[aă] pv|putere maxim[aă] intrare pv/i],
  ["putere_ac", /putere (nominal[aă]|ac nominal[aă]|nominal[aă] (de )?ie[sș]ire|nominal[aă] ac)|putere nominal[aă] ie[sș]ire ac/i],
  ["eficienta_max", /^(eficien[tț][aă]|randament) maxim/i],
  ["eficienta_euro", /eficien[tț][aă] european/i],
  ["mppt", /num[aă]r (de )?(trackere )?mppt|mppt.*string/i],
  ["tensiune_baterie", /interval tensiune baterie|tensiune (nominal[aă] )?baterie|tensiune dc nominal/i],
  ["capacitate", /capacitate|energie nominal[aă]|energie utilizabil/i],
  ["cicluri", /cicluri|durat[aă] de via[tț][aă]/i],
  ["chimie", /chimie|tip baterie|tip celul[aă] baterie/i],
  ["putere_maxima_panou", /putere maxim[aă] \(?pmax|^pmax|putere nominal[aă] \(pmax/i],
  ["eficienta_modul", /eficien[tț][aă] (modul|panou)/i],
  ["tip_celule", /tip celul|tehnologie celul/i],
  ["grad_protectie", /grad (de )?protec[tț]ie/i],
  ["greutate", /^greutate/i],
  ["dimensiuni", /^dimensiuni/i],
  ["garantie", /^garan[tț]ie/i],
  ["comunicare", /^comunica/i],
  ["temperatura_operare", /temperatur[aă] (de )?(operare|func[tț]ionare)|interval temperatur/i],
];

export function specificatii(descriereHtml) {
  const html = decodeaza(descriereHtml);
  const randuri = [];
  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const celule = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => text(c[1]));
    if (celule.length !== 2) continue;
    const [eticheta, valoare] = celule;
    if (!eticheta || !valoare || ANTET.test(eticheta) || FISIER.test(eticheta)) continue;
    if (/desc[aă]rc[aă] aici|^link$/i.test(valoare)) continue;
    if (eticheta.length > 80 || valoare.length > 200) continue;
    const cheie = CHEI.find(([, re]) => re.test(eticheta))?.[0] ?? null;
    randuri.push({ cheie, eticheta: eticheta[0].toUpperCase() + eticheta.slice(1), valoare });
  }
  // Același rând apare uneori de două ori (tabel repetat în descriere).
  const vazute = new Set();
  return randuri.filter((r) => {
    const k = `${r.eticheta.toLowerCase()}|${r.valoare.toLowerCase()}`;
    if (vazute.has(k)) return false;
    vazute.add(k);
    return true;
  });
}

export const specifica = (spec, cheie) => spec.find((r) => r.cheie === cheie)?.valoare ?? null;

/* ─── Clasificare ─────────────────────────────────────────────────────── */

const are = (re, s) => re.test(s);

/**
 * Categoria nouă, din nume (sigur) și, la nevoie, din categoria OpenCart de
 * nivel 1 (mai puțin sigur: acolo produsele sunt puse în mai multe locuri).
 * Întoarce calea, ex. "invertoare/hibride-trifazate", sau null.
 */
export function clasifica(nume, topOpenCart) {
  const n = fara_diacritice(nume).toLowerCase();

  if (are(/carport/, n)) return "carport";
  if (are(/statie (de )?incarcare|incarcator auto|evse|scharger|smartcharger/, n)) return "statii-incarcare";
  // Înaintea monitorizării: numele tablourilor conțin „cutie pentru contor".
  if (are(/^tablou electric|optimizator|protec[tţ]ie de sistem/, n)) return "protectii-tablouri";
  if (are(/balcon/, n) && !are(/^sistem de montaj/, n)) return "sisteme-fotovoltaice/balcon";
  if (are(/^sistem fotovoltaic/, n)) return are(/montaj inclus|cu montaj/, n) ? "sisteme-fotovoltaice/cu-montaj" : "sisteme-fotovoltaice/fara-montaj";
  if (are(/^kit invertor .*panou/, n)) return "sisteme-fotovoltaice/fara-montaj";
  if (are(/^(pachet|kit) .*invertor.*(acumulator|stocare)|^pachet pytes .*\+ .*invertor|^kit growatt .*invertor.*acumulator/, n)) return "sisteme-fotovoltaice/invertor-si-baterie";
  // Un invertor vândut „+ dongle Wi-Fi" rămâne invertor.
  if (!are(/^invertor/, n) && are(/smart ?meter|contor|dongle|smart ?logger|shine wifi|smart-tx|cloud connect/, n)) return "monitorizare";

  if (are(/industrial|c&i|bess|mwh|\bpcs\b|utility|ws-(g|l|pcs|ts|gs)|ms-(gs|dc|mppt)|mc-l|ge-f|bos-b|bos-a hv \d|luna2000-241|suntera|parcuri|sts500|dcc180|mppt-l01|modul mppt/, n))
    return "acumulatori/stocare-industriala";
  if (are(/control box|unitate de control|modul gestiune|backup box|^huawei smartguard|kit cabluri invertor-baterie|cablu (conectica|comunicare) invertor-baterie|bracket|suporti|pachet baza si cabluri|gb-l\+base/, n))
    return "acumulatori/accesorii-stocare";
  if (are(/acumulator|baterie|luna2000|^sistem( de)? stocare|^pachet stocare|powerbox|powerbrick/, n)) {
    if (are(/high[- ]?voltage|\bhv\b|bos-g|bos-a|gb-lm|luna2000|hvb/, n)) return "acumulatori/high-voltage";
    return "acumulatori/low-voltage";
  }

  if (are(/invertor|inverter/, n)) {
    if (are(/off[- ]?grid/, n)) return "invertoare/off-grid";
    if (are(/hibrid/, n)) {
      if (are(/trifazat|three/, n)) return "invertoare/hibride-trifazate";
      if (are(/monofazat/, n)) return "invertoare/hibride-monofazate";
      return null;
    }
    return "invertoare/on-grid";
  }
  if (are(/^(convertor|modul)/, n)) return "acumulatori/stocare-industriala";
  if (are(/^panou (fotovoltaic|solar)/, n)) return "panouri-fotovoltaice";

  switch (topOpenCart) {
    case 287: return clasificaMontaj(n);
    case 285: return "cabluri-conectori";
    case 292: return are(/tub copex/, n) ? "cabluri-conectori" : "protectii-tablouri";
    case 302: return "monitorizare";
    case 303: return "carport";
    case 289: return "statii-incarcare";
    case 284: return "panouri-fotovoltaice";
    default: return null;
  }
}

function clasificaMontaj(n) {
  if (are(/^sistem de montaj|^kit (montaj|carport)|sistem de montaj/, n)) return "sisteme-de-montaj/kituri-structuri";
  if (are(/hangerboard/, n)) return "sisteme-de-montaj/carlige-suporti";
  if (are(/^(surub|piulit)/, n)) return "sisteme-de-montaj/suruburi-piulite";
  if (are(/clem|conector|blocator|capac|inaltator/, n)) return "sisteme-de-montaj/cleme-conectori";
  if (are(/carlig|suport|placa de montaj|adaptor|dome 6/, n)) return "sisteme-de-montaj/carlige-suporti";
  if (are(/sina|rail|profil/, n)) return "sisteme-de-montaj/sine-profile";
  if (are(/surub|piulit|nut|colier/, n)) return "sisteme-de-montaj/suruburi-piulite";
  return "sisteme-de-montaj/accesorii-montaj";
}

/* ─── Valori de filtrare ──────────────────────────────────────────────── */

/**
 * Puterea în kW a unui invertor sau a unui sistem: întâi din nume („10kW",
 * „10 KW"), apoi din tiparele de cod cunoscute (SUN-10K, SUN2000-10KTL,
 * S6-EH3P12K, SPF6000, SPH 10000TL3). Niciodată din „kWh".
 */
export function putereKw(nume, model) {
  const n = String(nume);
  const dinNume = n.match(/(\d+(?:[.,]\d+)?)\s*k\s*w(?!\s*h)(?!p)/i);
  if (dinNume) return numar(dinNume[1]);
  const m = `${model ?? ""} ${n}`;
  const tipare = [
    /SUN-(\d+(?:\.\d+)?)K/i, /\bSE(\d+(?:\.\d+)?)K/i, /SUN2000-(\d+)KTL/i, /EH[13]P(\d+)K/i, /\b(\d+)KTL/i, /JS3PL(\d+)K/i,
  ];
  for (const re of tipare) {
    const x = m.match(re);
    if (x) return numar(x[1]);
  }
  const w = m.match(/\b(?:SPF|SPH ?)(\d{4,5})/i);
  if (w) return numar(w[1]) / 1000;
  return null;
}

export function capacitateKwh(nume, spec) {
  const x = String(nume).match(/(\d+(?:[.,]\d+)?)\s*kwh/i);
  if (x) return numar(x[1]);
  const s = specifica(spec, "capacitate");
  const y = s && s.match(/(\d+(?:[.,]\d+)?)\s*kwh/i);
  return y ? numar(y[1]) : null;
}

export function putereW(nume, model) {
  const x = String(nume).match(/\b(\d{3})\s*w\b/i) ?? String(model ?? "").match(/-(\d{3})(?:W|\b)/i)
    ?? String(model ?? "").match(/A-?(\d{3})-/i);
  const v = x ? Number(x[1]) : null;
  return v && v >= 100 && v <= 800 ? v : null;
}

export function faza(nume, model) {
  const n = fara_diacritice(`${nume} ${model ?? ""}`).toLowerCase();
  if (/trifazat|three phase|lp3|hp3|tl3|eh3p|js3pl|sun2000-\d+ktl-m|-t0|\bt0\b/.test(n)) return "trifazat";
  if (/monofazat|lp1|-l1|eh1p|\bspf|tl-hu|tl bl|-s0 –|-s0\b/.test(n)) return "monofazat";
  return null;
}

export function tensiuneBaterie(caleCategorie, nume, model, spec = []) {
  const n = fara_diacritice(`${nume} ${model ?? ""}`).toLowerCase();
  if (caleCategorie === "acumulatori/high-voltage") return "high-voltage";
  if (caleCategorie === "acumulatori/low-voltage") return "low-voltage";
  if (caleCategorie === "invertoare/hibride-trifazate" || caleCategorie === "invertoare/hibride-monofazate") {
    if (/high voltage|hp3|-h\b|eh3p\d+k-h|nv-yd-h/.test(n)) return "high-voltage";
    if (/low voltage|lp3|lp1|-l\b|-l-plus|nv-yd-l|spf|bl-up|js3pl/.test(n)) return "low-voltage";
    // Din fișa tehnică: intervalul de tensiune al bateriei. Până la 60 V e low
    // voltage (48–51,2 V nominal), de la 100 V în sus e high voltage.
    const t = specifica(spec, "tensiune_baterie");
    // „48 V / HV – depinde de sistem" nu e o valoare, e o ezitare: nu se citește.
    const v = t && !/depinde|\bhv\b|\bex\./i.test(t) ?[...t.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((x) => numar(x[1])).filter((x) => x >= 10) : [];
    if (v.length && Math.max(...v) <= 60) return "low-voltage";
    if (v.length && Math.min(...v) >= 100) return "high-voltage";
  }
  return null;
}

export function tehnologiePanou(nume, spec) {
  const s = `${nume} ${spec.map((r) => r.valoare).join(" ")}`;
  const t = [];
  if (/\bABC\b/i.test(s)) t.push("ABC");
  else if (/TOPCon/i.test(s)) t.push("TOPCon");
  else if (/HJT|heterojunc/i.test(s)) t.push("HJT");
  if (/n-?type/i.test(s)) t.unshift("N-type");
  if (/bifacial/i.test(s) && !/monofacial/i.test(nume)) t.push("bifacial");
  if (/full black|all black|black frame/i.test(s)) t.push("full black");
  return t.length ? t.join(", ") : null;
}

export { numar, rotunjit };
