import { cache } from "react";
import { fetchGraphQL } from "./graphql-client";
import { GET_OFERTE_QUERY, GET_TOATE_OFERTELE_QUERY } from "./queries";

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
   * Fotografia produsului, din biblioteca media WordPress.
   *
   * A LIPSIT DIN TIPUL ĂSTA, și lipsa era justificată: catalogul PDF n-are
   * imagini de produs, coloana `Images` nici nu există în CSV-ul de import, iar
   * secțiunea a fost desenată în jurul cifrei tocmai fiindcă poză nu exista.
   *
   * Acum există: 79 de fotografii au fost urcate în biblioteca media și legate
   * de produse. Premisa a căzut, deci cade și consecința ei — dar numai unde e
   * cazul, fiindcă 93 de produse tot n-au poză, iar `spec` rămâne exact la fel
   * de necesară pentru ele.
   */
  imagine?: { url: string; alt?: string };
  /**
   * Cifra care ține locul fotografiei, când nu există `imagine`.
   *
   * Pentru un instalator „615 Wp" identifică produsul cel puțin la fel de bine
   * ca o poză cu un dreptunghi negru, deci nu e o umplutură — e a doua cea mai
   * bună variantă, și rămâne așa.
   *
   * Se extrage la import: `Putere (Wp)` la panouri, `Putere (kW)` la
   * invertoare, `Capacitate exactă (kWh)` la acumulatori. Opțională, fiindcă
   * structurile de montaj n-au o cifră care să le definească; acolo panoul
   * cade pe codul de model.
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
  image?: { sourceUrl?: string | null; altText?: string | null } | null;
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
    // `altText` gol devine `undefined`, nu șir vid: în WooCommerce câmpul e
    // adesea necompletat, iar un `alt=""` explicit înseamnă „imagine
    // decorativă", ceea ce o fotografie de produs nu e. Componenta decide ce
    // scrie în locul lui. Aceeași regulă ca în lib/produs.ts.
    imagine: nod.image?.sourceUrl
      ? { url: nod.image.sourceUrl, alt: nod.image.altText?.trim() || undefined }
      : undefined,
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

/* ══════════════════════════════════════════════════════════════════════════
   CELE MAI BUNE OFERTE — selecție calculată, nu preluată
   ──────────────────────────────────────────────────────────────────────────
   Secțiunea „Ofertele lunii" arăta cele patru produse pe care furnizorul le
   pune pe coperta catalogului. Acum arată produsele cu cea mai bună reducere
   la pragul de volum, calculate din tot catalogul.

   REDUCEREA e diferența dintre prețul de listă și prețul de la prag, ca
   procent din cel de listă. Nu se poate cere din GraphQL: WooGraphQL nu știe
   să filtreze după o expresie între două câmpuri, deci se aduc toate produsele
   și se filtrează aici (vezi GET_TOATE_OFERTELE_QUERY).

   ─── DE CE TREI PRAGURI, NU DOUĂ ─────────────────────────────────────────

   Un prag PUR PROCENTUAL dă o bandă de șuruburi, și asta nu e o presupunere
   — e măsurat pe cele 88 de produse din catalogul curent care au preț de
   volum:

       mediana reducerii ....  1,75%
       percentila 75 ........  3,80%
       percentila 90 ........ 10,54%
       maximul .............. 25,49%

   Iar vârful clasamentului procentual e ocupat EXCLUSIV de accesorii ieftine:

       25,49%  Paravant L2350 ......... 21,50 → 16,02 EUR   (economie 5,48)
       12,33%  Clemă de mijloc ......... 1,46 →  1,28 EUR   (economie 0,18)
       12,33%  Clemă de capăt .......... 1,46 →  1,28 EUR   (economie 0,18)
       11,96%  Cârlig montaj țiglă ..... 7,94 →  6,99 EUR   (economie 0,95)

   „Cea mai bună ofertă a lunii: clemă de capăt, economisești 18 cenți." Cel
   mai mare procent stă pe cel mai mic preț, fiindcă la produse de un euro
   rotunjirea la două zecimale E deja un procent.

   Ofertele care contează comercial arată invers — procent mic, economie mare:

        7,32%  SUN-16K-SG01LP1 ...... 1680 → 1557 EUR   (economie 123)
        3,80%  Deye SE-F16 C ........ 1580 → 1520 EUR   (economie  60)
        2,27%  SUN-30K-SG02HP3 ...... 2250 → 2199 EUR   (economie  51)

   De-aia ECONOMIA ABSOLUTĂ e a treia condiție. Ea e cea care transformă
   „procent" în „ofertă".

   ─── DE CE ARE ȘI PLAFON ─────────────────────────────────────────────────

   Nu ca să taie oferte bune, ci ca să prindă date greșite. O reducere de volum
   de 40% la un distribuitor de echipamente nu e o promoție, e o coloană citită
   strâmb la import. Plafonul e o plasă, nu o politică: pe catalogul curent nu
   elimină niciun produs care ar fi trecut oricum de pragul de economie.

   ─── CE SE ÎNTÂMPLĂ CÂND SE SCHIMBĂ CATALOGUL ────────────────────────────

   Cifrele de mai sus sunt ale ediției Septembrie 2026. Ele nu sunt scrise în
   cod ca adevăruri permanente, ci ca justificare a celor trei constante. La o
   ediție în care structura reducerilor se schimbă mult, constantele se
   recalculează rulând aceeași măsurătoare pe noul CSV — nu se ghicesc din nou.
   ══════════════════════════════════════════════════════════════════════════ */

/** Sub asta reducerea e zgomot de rotunjire: mediana catalogului e 1,75%. */
export const PROCENT_MIN = 2;

/** Peste asta, pe un catalog B2B, e mai probabil o eroare de import decât o ofertă. */
export const PROCENT_MAX = 15;

/** Ce desparte o ofertă de o rotunjire. Vezi tabelele de mai sus. */
export const ECONOMIE_MINIMA = 20;

/** Plafon de siguranță: o bandă cu zeci de carduri devine o listă, nu o selecție. */
const CATE_CEL_MULT = 24;

/**
 * Reducerea la prag, în procente. `null` când produsul n-are preț de volum —
 * jumătate din catalog e în situația asta, deci nu e un caz de excepție.
 */
export function reducere(o: Oferta): number | null {
  if (typeof o.pretVolum !== "number" || o.pretVolum <= 0) return null;
  if (o.pretVolum >= o.pret) return null;
  return ((o.pret - o.pretVolum) / o.pret) * 100;
}

/** Economia în euro, pe unitate, la pragul de volum. */
export function economie(o: Oferta): number {
  return typeof o.pretVolum === "number" ? o.pret - o.pretVolum : 0;
}

/**
 * Trece cele trei praguri. Scrisă separat de încărcător ca să poată fi
 * aplicată și listei de rezervă, cu exact aceeași regulă.
 */
function eOfertaBuna(o: Oferta): boolean {
  const r = reducere(o);
  if (r === null) return false;
  return r >= PROCENT_MIN && r <= PROCENT_MAX && economie(o) >= ECONOMIE_MINIMA;
}

/**
 * Cele mai bune oferte din catalog, ordonate după cât economisești.
 *
 * ORDINEA E DUPĂ ECONOMIE, NU DUPĂ PROCENT, din același motiv pentru care
 * economia e un prag: în bandă, primul produs — cel văzut fără să derulezi —
 * trebuie să fie cel mai convingător, iar 123 EUR convinge mai mult decât
 * 7,32%.
 *
 * Rezerva nu e lista `OFERTE` întreagă, ci `OFERTE` trecută prin ACELEAȘI
 * praguri. Altfel, într-o zi în care WordPress nu răspunde, secțiunea ar arăta
 * produse care n-au nicio treabă cu regula scrisă în titlul ei.
 */
export const incarcaCeleMaiBuneOferte = cache(async (): Promise<Oferta[]> => {
  const date = await fetchGraphQL(GET_TOATE_OFERTELE_QUERY, {}, {
    optional: true,
    tags: ["produse"],
  });

  const noduri: NodProdus[] = date?.products?.nodes ?? [];
  const dinWoo = noduri.map(mapeaza).filter((o): o is Oferta => o !== null);

  const sursa = dinWoo.length > 0 ? dinWoo : OFERTE;

  return sursa
    .filter(eOfertaBuna)
    .sort((a, b) => economie(b) - economie(a))
    .slice(0, CATE_CEL_MULT);
});

/* ══════════════════════════════════════════════════════════════════════════
   LICHIDARE DE STOC
   ──────────────────────────────────────────────────────────────────────────
   Bara din stânga arată de mult „Lichidare stoc — 15", scris îngroșat, cu
   pastilă închisă. Era singura cifră din tot panoul care CHEMA la clic și nu
   ducea nicăieri: comentariul din BaraFiltre.tsx recunoștea de ce — „/catalog
   nu știe azi să filtreze după disponibilitate, iar un link către o pagină care
   ignoră filtrul e mai rău decât niciun link".

   Acum știe. Restul comentariului rămâne valabil ca istorie, dar condiția lui
   s-a schimbat: există o pagină care chiar arată cele 15.

   DE CE STĂ ÎN FIȘIERUL ĂSTA, deși nu e o „ofertă a lunii". Fiindcă e aceeași
   formă de date — `Oferta`, adică produs cu preț, preț de volum, prag și stare
   — și se citește cu același `mapeaza()`. Mutată în alt fișier, ar fi cerut fie
   exportarea lui `mapeaza` și a tipului de nod, fie o a doua funcție de mapare
   care s-ar fi desincronizat de prima la primul câmp adăugat.

   Numele fișierului descrie ce conține: produse cu datele de preț din catalog.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Produsele scoase la lichidare, ordonate după cât de mult se economisește.
 *
 * Filtrarea se face AICI, nu în GraphQL. WooGraphQL poate filtra după termeni
 * de taxonomie, dar starea vine dintr-un atribut global (`pa_disponibilitate`),
 * iar interogarea aceea are o sintaxă diferită de restul și s-ar fi rupt tăcut
 * dacă atributul lipsește pe un WordPress proaspăt. Cu 172 de produse în
 * catalog, aducerea întregii liste și filtrarea în cod costă o cerere pe care
 * o facem oricum pentru „Ofertele lunii" — iar `cache` din React o reunește.
 *
 * Ordinea: întâi cele cu preț de volum, după economie descrescătoare; apoi
 * restul, după preț. Un produs de lichidare fără a doua coloană de preț nu e
 * mai puțin real, doar nu are cu ce fi comparat.
 */
export const incarcaLichidareStoc = cache(async (): Promise<Oferta[]> => {
  const date = await fetchGraphQL(GET_TOATE_OFERTELE_QUERY, {}, {
    optional: true,
    tags: ["produse"],
  });

  const noduri: NodProdus[] = date?.products?.nodes ?? [];
  const dinWoo = noduri.map(mapeaza).filter((o): o is Oferta => o !== null);
  const sursa = dinWoo.length > 0 ? dinWoo : OFERTE;

  return sursa
    .filter((o) => o.disponibilitate === "Lichidare stoc")
    .sort((a, b) => economie(b) - economie(a) || b.pret - a.pret);
});
