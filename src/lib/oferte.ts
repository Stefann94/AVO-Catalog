import { cache } from "react";
import { fetchGraphQL } from "./graphql-client";
import { GET_OFERTE_QUERY } from "./queries";

/**
 * Ofertele lunii.
 *
 * ─── CE SUNT, EXACT ───────────────────────────────────────────────────────
 *
 * Catalogul are o pagină dedicată pe copertă, înainte de prima secțiune de
 * produse. Importatorul o citește: tot ce apare înaintea primei secțiuni intră
 * în `antet`, iar `marcheazaOferte()` caută codul de model al fiecărui produs
 * în textul acela (tools/catalog-import/parse-catalog.js). Ce se potrivește
 * pleacă spre WooCommerce cu `Is featured? = 1`.
 *
 * Deci sursa nu e o alegere de-a noastră, e pagina pe care furnizorul o pune
 * pe copertă în fiecare lună.
 *
 * ─── CE NU SUNT ───────────────────────────────────────────────────────────
 *
 * NU sunt „lichidare stoc". Aceea e altceva: șase secțiuni întregi din catalog
 * poartă `lichidare: true` (tools/catalog-import/sections.js) și toate șase
 * sunt Growatt — adică un brand care iese, nu o promoție care se rotește. Când
 * stocul se termină, dispar definitiv. Se pot afișa aici, dar cu eticheta lor,
 * ca să nu promitem lunar ceva ce există o singură dată.
 *
 * NU sunt nici prețul la volum. A doua coloană de preț din catalog (4 paleți la
 * panouri, 12 bucăți la restul) e o structură permanentă, nu o ofertă. Apare pe
 * card fiindcă e informația care contează pentru un cumpărător B2B, dar
 * secțiunea nu există din cauza ei.
 *
 * ─── DE CE NU EXISTĂ PREȚ TĂIAT ───────────────────────────────────────────
 *
 * Catalogul nu conține un preț anterior. „Ofertele lunii" înseamnă că
 * furnizorul le-a pus pe copertă, nu că prețul a scăzut față de luna trecută.
 * Un preț tăiat ar fi o cifră inventată, iar prima dată când un client compară
 * cu catalogul PDF, se vede. Cardul arată prețul real și pragul de volum real;
 * atât.
 *
 * ─── FORMA DATELOR ────────────────────────────────────────────────────────
 *
 * Câmpurile sunt exact cele pe care le scrie importatorul în CSV, ca trecerea
 * pe GraphQL să fie o schimbare de sursă, nu o rescriere de componentă:
 *
 *   sku ............. coloana SKU
 *   nume ............ coloana Name
 *   brand ........... atributul Brand
 *   pret ............ Regular price
 *   pretVolum ....... Meta: _pret_volum
 *   prag ............ Meta: _prag_volum
 *   unitate ......... Meta: _unitate_pret  („buc" / „panou")
 *   disponibilitate . atributul Disponibilitate
 *
 * Tiparul e cel din lib/perioada.ts: o constantă scrisă în cod ține locul
 * datelor cât timp WooCommerce e gol, iar la primul import valoarea reală
 * câștigă.
 */

export type Oferta = {
  sku: string;
  nume: string;
  brand: string;
  /** Slug de categorie nivel 1, pentru linkul din card. Vezi lib/categorii.ts. */
  categorie: string;
  /**
   * Cifra care ține locul fotografiei. Catalogul nu are imagini de produs —
   * coloana `Images` nici nu există în CSV — iar pentru un instalator „615 Wp"
   * identifică produsul mai bine decât o poză cu un dreptunghi negru.
   *
   * Se extrage deja, la import: `Putere (Wp)` la panouri, `Putere (kW)` la
   * invertoare, `Capacitate exactă (kWh)` la acumulatori. Opțională, fiindcă
   * structurile de montaj n-au o cifră care să le definească; acolo panoul
   * cade pe numele brandului.
   */
  spec?: { valoare: string; unitate: string };
  pret: number;
  pretVolum?: number;
  prag?: string;
  unitate: string;
  disponibilitate: "În stoc" | "Lichidare stoc" | "La comandă";
};

/**
 * Ofertele lunii Septembrie 2026 — DATE REALE.
 *
 * Extrase din `solar-one-woocommerce.csv`, produs de importator din „Catalog
 * lunar Solar One". Sunt exact cele patru rânduri cu `Is featured? = 1`, adică
 * produsele pe care furnizorul le-a pus pe coperta catalogului. Prețurile,
 * pragurile și denumirile sunt copiate ca atare, nimic rotunjit.
 *
 * Constanta e rezervă, nu sursă de adevăr: la primul import în WooCommerce,
 * aceleași produse vin prin `products(where: { featured: true })` și valoarea
 * de acolo câștigă. Tiparul e cel din lib/perioada.ts.
 *
 * Lista se reface la fiecare catalog nou:
 *
 *   node tools/catalog-import/parse-catalog.js "<cale PDF>" <director-ieșire>
 *
 * Raportul generat are secțiunea „Ofertele lunii (marcate Featured)".
 *
 * ─── DE CE DOUĂ DIN PATRU N-AU `spec` ─────────────────────────────────────
 *
 * SE-F16 și HOPE 16.0LM-A1 sunt, amândouă, acumulatori de 16 kWh — se vede din
 * codul de model. Dar catalogul nu scrie capacitatea nicăieri în denumire, iar
 * importatorul o extrage doar din tokenul „kWh" (`atribute()` în
 * parse-catalog.js). Deci cifra nu există în date.
 *
 * NU o completăm de mână aici. Ar însemna o valoare pe care catalogul n-o
 * afirmă, într-un fișier care se regenerează lunar — la următorul import ar
 * dispărea, iar cardul ar arăta altfel fără ca nimeni să fi schimbat ceva.
 * Locul reparației e importatorul, care poate citi capacitatea din familia de
 * model (SE-F16 → 16, HOPE 16.0LM → 16). Până atunci, cardul cade pe codul de
 * model, care e oricum identificatorul după care se comandă.
 */
export const OFERTE: Oferta[] = [
  {
    sku: "CS6.2-48TD-460",
    nume: "Canadian Solar CS6.2-48TD-460, N-Type TOPCon",
    brand: "Canadian Solar",
    categorie: "panouri-fotovoltaice",
    spec: { valoare: "460", unitate: "Wp" },
    pret: 65,
    pretVolum: 64,
    prag: "4 paleți",
    unitate: "panou",
    disponibilitate: "În stoc",
  },
  {
    sku: "SE-F16",
    nume: "Deye SE-F16 C",
    brand: "Deye",
    categorie: "stocare-energie",
    pret: 1580,
    pretVolum: 1520,
    prag: "12 buc",
    unitate: "buc",
    disponibilitate: "În stoc",
  },
  {
    sku: "FLB48314TG1-H",
    nume: "FELICITY FLB48314TG1-H — 16 kWh, cu încălzire, IP65",
    brand: "Felicity",
    categorie: "stocare-energie",
    spec: { valoare: "16", unitate: "kWh" },
    pret: 1475,
    pretVolum: 1450,
    prag: "12 buc",
    unitate: "buc",
    disponibilitate: "În stoc",
  },
  {
    sku: "HOPE-16-0LM-A1",
    nume: "HOPE 16.0LM-A1",
    brand: "Growatt",
    categorie: "stocare-energie",
    pret: 1450,
    unitate: "buc",
    disponibilitate: "Lichidare stoc",
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   Citirea din WooCommerce
   ══════════════════════════════════════════════════════════════════════════ */

/** Forma nodului întors de GET_OFERTE_QUERY. Tot opțional: GraphQL poate omite. */
type NodProdus = {
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  price?: string | null;
  productCategories?: {
    nodes?: { slug?: string | null; parent?: { node?: { slug?: string | null } | null } | null }[] | null;
  } | null;
  attributes?: {
    nodes?: { name?: string | null; terms?: { nodes?: { name?: string | null }[] | null } | null }[] | null;
  } | null;
  dateCatalog?: {
    pretVolum?: number | null;
    pragVolum?: string | null;
    unitatePret?: string | null;
    capacitateKwh?: number | null;
  } | null;
};

/** Eticheta unui atribut global, ex. atribut(nod, "pa_brand") → "Canadian Solar". */
function atribut(nod: NodProdus, nume: string): string | null {
  const a = nod.attributes?.nodes?.find((x) => x?.name === nume);
  const t = a?.terms?.nodes?.[0]?.name?.trim();
  return t ? t : null;
}

/**
 * Cifrele se scriu românește: 3.6 → „3,6".
 *
 * Valorile vin din două locuri cu formate diferite — atributele dau text
 * („460", „3.6"), iar `capacitateKwh` dă număr. Trecem prin `Number` doar ce e
 * numeric; ce nu e rămâne neatins, ca o valoare neașteptată din catalog să
 * ajungă pe ecran ca atare, nu ca „NaN".
 */
function cifra(valoare: string | number): string {
  const n = typeof valoare === "number" ? valoare : Number(valoare.replace(",", "."));
  return Number.isFinite(n) ? n.toLocaleString("ro-RO") : String(valoare);
}

/**
 * Cifra de titlu a cardului, în ordinea în care catalogul o oferă.
 *
 * Ordinea nu e arbitrară: un panou are Wp, un invertor kW, un acumulator kWh,
 * iar un produs are practic doar una dintre ele. Prima găsită câștigă.
 *
 * `capacitateKwh` vine din meta, nu din atributul `pa_capacitate-kwh`: acela e
 * un interval („15 - 30 kWh"), bun pentru filtrare, inutil ca cifră de titlu.
 * Meta ține valoarea exactă — 16.
 */
function specDin(nod: NodProdus): Oferta["spec"] | undefined {
  const wp = atribut(nod, "pa_putere-wp");
  if (wp) return { valoare: cifra(wp), unitate: "Wp" };

  const kw = atribut(nod, "pa_putere-kw");
  if (kw) return { valoare: cifra(kw), unitate: "kW" };

  const kwh = nod.dateCatalog?.capacitateKwh;
  if (typeof kwh === "number" && Number.isFinite(kwh)) {
    return { valoare: cifra(kwh), unitate: "kWh" };
  }
  return undefined;
}

/**
 * Categoria de nivel 1, pentru linkul cardului.
 *
 * Importul pune produsul DOAR în subcategorie — un acumulator e în
 * „acumulatori-low-voltage", nu și în „stocare-energie". Dar /catalog/<slug>
 * cere nivelul 1, altfel linkul ar duce către o pagină de subcategorie când
 * cardul promite categoria. Ierarhia are două niveluri, deci „părintele, altfel
 * el însuși" acoperă tot.
 */
function categorieDin(nod: NodProdus): string | null {
  const c = nod.productCategories?.nodes?.[0];
  return c?.parent?.node?.slug?.trim() || c?.slug?.trim() || null;
}

const DISPONIBILITATI = ["În stoc", "Lichidare stoc", "La comandă"] as const;

function mapeaza(nod: NodProdus): Oferta | null {
  const nume = nod.name?.trim();
  const sku = nod.sku?.trim();
  const pret = Number(nod.price);
  const categorie = categorieDin(nod);

  // Fără denumire, SKU, preț sau categorie, cardul n-are ce arăta și linkul
  // n-are unde duce. Produsul e sărit, restul secțiunii rămâne întreagă.
  if (!nume || !sku || !categorie || !Number.isFinite(pret) || pret <= 0) return null;

  const stare = atribut(nod, "pa_disponibilitate");
  const disponibilitate =
    DISPONIBILITATI.find((d) => d === stare) ?? "În stoc";

  const dc = nod.dateCatalog;
  const pretVolum =
    typeof dc?.pretVolum === "number" && Number.isFinite(dc.pretVolum) ? dc.pretVolum : undefined;
  const prag = dc?.pragVolum?.trim() || undefined;

  return {
    sku,
    nume,
    brand: atribut(nod, "pa_brand") ?? "",
    categorie,
    spec: specDin(nod),
    pret,
    // Cele două merg împreună: un preț fără prag n-ar putea fi scris pe card
    // („1.450 € de la …" ce?), iar un prag fără preț n-ar spune nimic.
    ...(pretVolum && prag ? { pretVolum, prag } : {}),
    unitate: dc?.unitatePret?.trim() || "buc",
    disponibilitate,
  };
}

/**
 * Ofertele lunii, din WooCommerce, cu lista scrisă în cod ca rezervă.
 *
 * `optional: true` fiindcă `dateCatalog` vine din extensia noastră: pe un
 * WordPress fără ea, interogarea pică pe tot, nu doar pe câmpul lipsă. Atunci
 * `fetchGraphQL` întoarce null, iar secțiunea afișează lista din cod în loc să
 * dispară.
 *
 * Rezerva se folosește și când WooCommerce răspunde cu zero produse marcate —
 * o lună în care nimeni n-a apucat să bifeze „Featured" nu trebuie să golească
 * secțiunea. Ca să se golească intenționat, se șterge lista din cod.
 *
 * `cache` din React, ca la perioadă: interogarea e POST, iar Next memoizează
 * automat doar GET-urile.
 */
export const incarcaOferte = cache(async (): Promise<Oferta[]> => {
  const date = await fetchGraphQL(GET_OFERTE_QUERY, {}, {
    optional: true,
    tags: ["produse"],
  });

  const noduri: NodProdus[] = date?.products?.nodes ?? [];
  const dinWoo = noduri.map(mapeaza).filter((o): o is Oferta => o !== null);

  return dinWoo.length > 0 ? dinWoo : OFERTE;
});
