/**
 * Textele proprii ale copiei: titlu (H1), titlu SEO, meta descriere, descriere.
 *
 * Nicio propoziție nu vine din descrierile solarone.ro. Fiecare frază e
 * compusă din valori din date (nume, cod, specificații, preț, stoc) și se
 * scrie doar dacă valoarea există. Ce nu e în date nu apare: fără termene de
 * livrare, fără garanții nedeclarate, fără recenzii.
 */

import { specifica, fara_diacritice } from "./reguli.mjs";

const lei = (n) => n.toLocaleString("ro-RO", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const kw = (n) => `${String(n).replace(".", ",")} kW`;
const kwh = (n) => `${String(n).replace(".", ",")} kWh`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TIP_INVERTOR = {
  "invertoare/hibride-monofazate": "Invertor hibrid monofazat",
  "invertoare/hibride-trifazate": "Invertor hibrid trifazat",
  "invertoare/off-grid": "Invertor off-grid",
  "invertoare/on-grid": "Invertor on-grid",
};

/** Numele „curat" al unui produs pentru care nu avem șablon: cel din sursă, normalizat. */
export function numeCurat(nume) {
  return nume
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,(?=\S)/g, ", ")
    .replace(/\bKw\b|\bKW\b(?!h)/g, "kW")
    .replace(/\bKwh\b|\bKWH\b|\bKWh\b/g, "kWh")
    .replace(/LifePo4|LiFePo4|LifePO4/g, "LiFePO4")
    .replace(/\bHIbrid\b/g, "Hibrid")
    .trim()
    .replace(/[,\s–-]+$/, "");
}

/**
 * Titlul produsului (H1): tip + brand + cod complet + valoarea principală. Codul
 * complet în H1 e ce potrivește căutările „SUN-10K-SG05LP3-EU-SM2 preț".
 */
export function titlu(p) {
  const { cale, brand, mpn, a } = p;
  const marca = brand ? `${brand} ` : "";

  if (TIP_INVERTOR[cale] && mpn && a.putere_kw) {
    let t = `${TIP_INVERTOR[cale]}`;
    if (cale !== "invertoare/hibride-monofazate" && cale !== "invertoare/hibride-trifazate" && a.faza) t += ` ${a.faza}`;
    t += ` ${marca}${mpn}, ${kw(a.putere_kw)}`;
    if (cale === "invertoare/hibride-trifazate" && a.tensiune_baterie) t += `, ${a.tensiune_baterie.replace("-", " ")}`;
    return t;
  }
  if ((cale === "acumulatori/low-voltage" || cale === "acumulatori/high-voltage") && mpn && a.capacitate_kwh && !/^(kit|pachet|sistem)/i.test(p.numeSursa)) {
    const chimie = /lifepo4/i.test(p.numeSursa + p.textSpec) ? "LiFePO4 " : "";
    return `Acumulator ${chimie}${marca}${mpn}, ${kwh(a.capacitate_kwh)}, ${a.tensiune_baterie.replace("-", " ")}`;
  }
  if (cale === "panouri-fotovoltaice" && mpn && a.putere_w) {
    return `Panou fotovoltaic ${marca}${mpn}, ${a.putere_w} W${a.tehnologie ? `, ${a.tehnologie}` : ""}`;
  }
  return numeCurat(p.numeSursa);
}

/**
 * Titlul din <title>: codul în față, fiindcă Google taie titlurile lungi și
 * căutările de cod exact trebuie să-l găsească în primele cuvinte. Numele
 * site-ului îl adaugă Next.js.
 */
export function titluSeo(p, h1) {
  const { cale, brand, mpn, a } = p;
  if (!mpn || !brand) return h1;
  if (TIP_INVERTOR[cale] && a.putere_kw) return `${brand} ${mpn} – ${TIP_INVERTOR[cale].toLowerCase()} ${kw(a.putere_kw)}`;
  if (cale.startsWith("acumulatori/") && a.capacitate_kwh) return `${brand} ${mpn} – acumulator ${kwh(a.capacitate_kwh)}`;
  if (cale === "panouri-fotovoltaice" && a.putere_w) return `${brand} ${mpn} – panou fotovoltaic ${a.putere_w} W`;
  return h1;
}

function disponibilitate(p) {
  if (p.stoc === "instock") return "în stoc";
  if (p.stoc === "onbackorder") return "disponibil la comandă";
  return "stoc epuizat momentan";
}

export function descriereSeo(p, h1) {
  const bucati = [h1 + "."];
  if (p.pret) bucati.push(`Preț ${lei(p.pretRedus ?? p.pret)} lei cu TVA, ${disponibilitate(p)}.`);
  const detalii = rezumat(p).slice(0, 3).map(([e, v]) => `${e[0].toLowerCase() + e.slice(1)} ${v}`);
  if (detalii.length) bucati.push(`${detalii.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()));
  let d = bucati.join(" ");
  if (d.length > 158) d = d.slice(0, 155).replace(/[\s,;.]+\S*$/, "") + "…";
  return d;
}

/** Cele mai relevante rânduri ale fișei, pe tip de produs, ca [etichetă, valoare]. */
export function rezumat(p) {
  const s = (c) => specifica(p.spec, c);
  const cand = p.cale.startsWith("invertoare/")
    ? [["Putere PV maximă", s("putere_pv_max")], ["Trackere MPPT", s("mppt")], ["Eficiență maximă", s("eficienta_max")], ["Tensiune baterie", s("tensiune_baterie")], ["Grad de protecție", s("grad_protectie")], ["Greutate", s("greutate")]]
    : p.cale.startsWith("acumulatori/")
      ? [["Capacitate", s("capacitate")], ["Tensiune", s("tensiune_baterie")], ["Chimie", s("chimie")], ["Cicluri", s("cicluri")], ["Grad de protecție", s("grad_protectie")], ["Greutate", s("greutate")]]
      : p.cale === "panouri-fotovoltaice"
        ? [["Putere maximă", s("putere_maxima_panou")], ["Eficiență modul", s("eficienta_modul")], ["Tip celule", s("tip_celule")], ["Dimensiuni", s("dimensiuni")], ["Greutate", s("greutate")]]
        : [["Dimensiuni", s("dimensiuni")], ["Greutate", s("greutate")], ["Grad de protecție", s("grad_protectie")]];
  return cand.filter(([, v]) => v);
}

/** Variantele de scriere ale codului, cum le tastează lumea în Google. */
export function varianteCod(mpn) {
  if (!mpn) return [];
  const v = new Set([mpn]);
  v.add(mpn.replace(/-/g, " "));
  v.add(mpn.replace(/[-\s]/g, ""));
  // Codul de bază fără sufixul de piață: SUN-10K-SG05LP3-EU-SM2 → SUN-10K-SG05LP3
  const baza = mpn.match(/^(SUN-\d+(?:\.\d+)?K-[A-Z0-9]+)/i)?.[1];
  if (baza && baza !== mpn) v.add(baza);
  v.delete(mpn);
  return [...v].filter((x) => x.length >= 4);
}

/**
 * Descrierea produsului, HTML simplu (paragrafe și o listă). Tabelul complet de
 * specificații îl desenează site-ul din câmpul separat, nu din descriere.
 */
export function descriere(p, h1, frati) {
  const { cale, brand, mpn, a } = p;
  const par = [];

  // 1. Ce este — doar din tip, brand, cod și valorile deduse.
  if (TIP_INVERTOR[cale] && a.putere_kw) {
    let x = `${esc(h1.split(",")[0])} are o putere nominală de ${kw(a.putere_kw)}`;
    if (a.faza) x += ` și se conectează la o rețea ${a.faza === "trifazat" ? "trifazată" : "monofazată"}`;
    x += ".";
    if (a.tensiune_baterie === "low-voltage") x += " Lucrează cu baterii low voltage, de 48–51,2 V.";
    if (a.tensiune_baterie === "high-voltage") x += " Lucrează cu baterii high voltage.";
    par.push(x);
  } else if (cale.startsWith("acumulatori/") && a.capacitate_kwh) {
    let x = `${esc(h1.split(",")[0])} stochează ${kwh(a.capacitate_kwh)}`;
    if (a.tensiune_baterie) x += ` și face parte din categoria bateriilor ${a.tensiune_baterie.replace("-", " ")}`;
    par.push(x + ".");
  } else if (cale === "panouri-fotovoltaice" && a.putere_w) {
    let x = `${esc(h1.split(",")[0])} are o putere de ${a.putere_w} W`;
    if (a.tehnologie) x += `, cu celule ${esc(a.tehnologie)}`;
    par.push(x + ".");
  }

  // 2. Locul în gamă, calculat din produsele aceleiași categorii și aceluiași brand.
  if (frati.length >= 2 && brand) {
    const valoare = TIP_INVERTOR[cale] ? "putere_kw" : cale.startsWith("acumulatori/") ? "capacitate_kwh" : cale === "panouri-fotovoltaice" ? "putere_w" : null;
    const unit = valoare === "putere_kw" ? kw : valoare === "capacitate_kwh" ? kwh : (n) => `${n} W`;
    const vals = valoare ? frati.map((f) => f.a[valoare]).filter((v) => v != null) : [];
    if (valoare && a[valoare] != null && vals.length >= 2) {
      const min = Math.min(...vals), max = Math.max(...vals);
      if (min !== max) {
        const loc = a[valoare] === min ? "cel mai mic model" : a[valoare] === max ? "cel mai mare model" : "un model intermediar";
        par.push(`În oferta ${esc(brand)} din această categorie sunt ${frati.length} modele, de la ${unit(min)} la ${unit(max)}; acesta e ${loc}.`);
      }
    }
  }

  // 3. Rezumatul tehnic, doar rândurile care există.
  const r = rezumat(p);
  let lista = "";
  if (r.length) lista = `<ul>${r.map(([e, v]) => `<li><strong>${esc(e)}:</strong> ${esc(v)}</li>`).join("")}</ul>`;

  // 4. Codul și variantele lui, o singură dată, pentru căutările de cod exact.
  if (mpn) {
    const v = varianteCod(mpn);
    par.push(`Codul producătorului este <strong>${esc(mpn)}</strong>${v.length ? `, căutat și ca ${v.map(esc).join(" sau ")}` : ""}.`);
  }

  // 5. Garanția, doar dacă e rând în fișa tehnică.
  const g = specifica(p.spec, "garantie");
  if (g) par.push(`Garanția declarată în fișa tehnică: ${esc(g)}.`);

  if (!par.length && !lista) return "";
  return par.map((x) => `<p>${x}</p>`).join("\n") + (lista ? `\n${lista}` : "");
}

export function slugProdus(p, h1) {
  const tip = TIP_INVERTOR[p.cale]?.toLowerCase()
    ?? (p.cale.startsWith("acumulatori/") && /^Acumulator/.test(h1) ? "acumulator" : null)
    ?? (p.cale === "panouri-fotovoltaice" && /^Panou/.test(h1) ? "panou fotovoltaic" : null);
  if (tip && p.mpn) return `${tip} ${p.brand ?? ""} ${p.mpn}`;
  return fara_diacritice(h1);
}

export function introCategorie(cat, produse) {
  if (!produse.length) return null;
  const branduri = [...new Set(produse.map((p) => p.brand).filter(Boolean))];
  const preturi = produse.map((p) => p.pretRedus ?? p.pret).filter(Boolean);
  const nr = produse.length;
  let x = `${nr} ${nr === 1 ? "produs" : "produse"}`;
  if (branduri.length) x += ` de la ${branduri.length <= 4 ? branduri.join(", ") : `${branduri.slice(0, 4).join(", ")} și alte ${branduri.length - 4} mărci`}`;
  const valoare = cat.cale.startsWith("invertoare") ? ["putere_kw", kw] : cat.cale.startsWith("acumulatori/l") || cat.cale.startsWith("acumulatori/h") ? ["capacitate_kwh", kwh] : cat.cale === "panouri-fotovoltaice" ? ["putere_w", (n) => `${n} W`] : null;
  if (valoare) {
    const v = produse.map((p) => p.a[valoare[0]]).filter((n) => n != null);
    if (v.length >= 2 && Math.min(...v) !== Math.max(...v)) x += `, între ${valoare[1](Math.min(...v))} și ${valoare[1](Math.max(...v))}`;
  }
  if (preturi.length) x += `. Prețuri de la ${lei(Math.min(...preturi))} lei cu TVA`;
  return x + ".";
}

export { lei };
