/**
 * Categoriile de nivel 1, cu slug-urile pe care le generează importul
 * (vezi tools/catalog-import). Sursa de adevăr rămâne WooCommerce; lista de
 * aici acoperă perioada până la import și dă un titlu corect paginii chiar
 * dacă GraphQL nu întoarce încă nimic.
 *
 * Slug-urile trebuie să rămână identice cu cele din GamaProduse și Footer.
 */
export type CategorieCunoscuta = {
  slug: string;
  nume: string;
  descriere: string;
};

export const CATEGORII_CUNOSCUTE: CategorieCunoscuta[] = [
  {
    slug: "panouri-fotovoltaice",
    nume: "Panouri Fotovoltaice",
    descriere: "Module N-Type TOPCon, monofaciale și bifaciale, 410 – 770 Wp.",
  },
  {
    slug: "invertoare",
    nume: "Invertoare",
    descriere: "Hibride, on-grid și off-grid, monofazate și trifazate, 3,6 – 125 kW.",
  },
  {
    slug: "stocare-energie",
    nume: "Stocare Energie",
    descriere: "Acumulatori LiFePO4 low și high voltage, 4 – 241,5 kWh.",
  },
  {
    slug: "sisteme-de-montaj",
    nume: "Sisteme de Montaj",
    descriere: "Structuri pentru acoperiș plat, țiglă și tablă trapezoidală, plus K2 Systems.",
  },
  {
    slug: "monitorizare-smart-devices",
    nume: "Monitorizare & Smart Devices",
    descriere: "Smart metere, dataloggere și dispozitive de monitorizare.",
  },
  {
    slug: "statii-de-incarcare-auto",
    nume: "Stații de Încărcare Auto",
    descriere: "Stații AC pentru încărcarea vehiculelor electrice.",
  },
  {
    slug: "accesorii",
    nume: "Accesorii",
    descriere: "Cabluri solare și conectori MC4.",
  },
  {
    slug: "echipamente-conversie-comutare",
    nume: "Echipamente Conversie & Comutare",
    descriere: "Regulatoare MPPT, sisteme PCS și comutatoare statice de transfer.",
  },
];

/**
 * Subcategoriile de nivel 2, exact cum apar în catalogul importat.
 *
 * 137 din cele 172 de produse stau într-una dintre ele; restul de 35 sunt
 * direct în categoria părinte (Panouri Fotovoltaice 28, Stații de Încărcare 4,
 * Echipamente Conversie & Comutare 3 — acestea trei nu au subcategorii).
 *
 * `produse` e numărul din catalogul Septembrie 2026 și e folosit ca să le
 * putem ordona după mărime cât timp WooCommerce încă nu răspunde cu `count`.
 * La primul import care aduce date reale, numărul de aici devine doar rezervă.
 *
 * Fără lista asta, orice link către o subcategorie ar da 404: pagina de
 * categorie cheamă `notFound()` când slug-ul nu e nici în WooCommerce, nici
 * aici, iar WooCommerce e gol.
 */
export type SubcategorieCunoscuta = {
  slug: string;
  nume: string;
  /** Slug-ul categoriei de nivel 1, pentru calea /catalog/<parinte>/<slug>. */
  parinte: string;
  produse: number;
};

export const SUBCATEGORII_CUNOSCUTE: SubcategorieCunoscuta[] = [
  { slug: "k2-systems", nume: "K2 Systems", parinte: "sisteme-de-montaj", produse: 28 },
  { slug: "acumulatori-low-voltage", nume: "Acumulatori Low-Voltage", parinte: "stocare-energie", produse: 22 },
  { slug: "hibride-trifazate", nume: "Hibride Trifazate", parinte: "invertoare", produse: 18 },
  { slug: "hibride-monofazate", nume: "Hibride Monofazate", parinte: "invertoare", produse: 11 },
  { slug: "sisteme-stocare-complete", nume: "Sisteme Stocare Complete", parinte: "stocare-energie", produse: 7 },
  { slug: "structuri-acoperis-metalic", nume: "Structuri Acoperiș Metalic", parinte: "sisteme-de-montaj", produse: 7 },
  { slug: "structuri-acoperis-plat", nume: "Structuri Acoperiș Plat", parinte: "sisteme-de-montaj", produse: 6 },
  { slug: "cleme-si-accesorii", nume: "Cleme și Accesorii", parinte: "sisteme-de-montaj", produse: 6 },
  { slug: "smart-meters", nume: "Smart Meters", parinte: "monitorizare-smart-devices", produse: 5 },
  { slug: "on-grid", nume: "On-Grid", parinte: "invertoare", produse: 4 },
  { slug: "acumulatori-high-voltage", nume: "Acumulatori High-Voltage", parinte: "stocare-energie", produse: 4 },
  { slug: "accesorii-stocare", nume: "Accesorii Stocare", parinte: "stocare-energie", produse: 4 },
  { slug: "dispozitive-smart", nume: "Dispozitive Smart", parinte: "monitorizare-smart-devices", produse: 3 },
  { slug: "sine-si-profile", nume: "Șine și Profile", parinte: "sisteme-de-montaj", produse: 3 },
  { slug: "micro-ess-balcon", nume: "Micro ESS / Balcon", parinte: "stocare-energie", produse: 2 },
  { slug: "off-grid", nume: "Off-Grid", parinte: "invertoare", produse: 2 },
  { slug: "cabluri-solare", nume: "Cabluri Solare", parinte: "accesorii", produse: 2 },
  { slug: "conectori", nume: "Conectori", parinte: "accesorii", produse: 2 },
  { slug: "structuri-tigla", nume: "Structuri Țiglă", parinte: "sisteme-de-montaj", produse: 1 },
];

/** Calea completă a unei subcategorii: /catalog/invertoare/hibride-trifazate. */
export const caleSubcategorie = (s: SubcategorieCunoscuta) =>
  `/catalog/${s.parinte}/${s.slug}`;

/**
 * Caută întâi printre categoriile de nivel 1, apoi printre subcategorii.
 *
 * Pagina de categorie folosește doar ultimul segment din URL, deci funcția
 * trebuie să recunoască ambele niveluri — altfel o subcategorie validă ar
 * cădea în 404.
 */
export const gasesteCategorie = (slug: string): CategorieCunoscuta | undefined => {
  const nivel1 = CATEGORII_CUNOSCUTE.find((c) => c.slug === slug);
  if (nivel1) return nivel1;

  const sub = SUBCATEGORII_CUNOSCUTE.find((s) => s.slug === slug);
  if (!sub) return undefined;

  // Subcategoriile n-au descriere proprie în catalog. Lăsăm gol, ca pagina să
  // nu afișeze un text inventat; când WooCommerce va avea una, aceea câștigă.
  return { slug: sub.slug, nume: sub.nume, descriere: "" };
};
