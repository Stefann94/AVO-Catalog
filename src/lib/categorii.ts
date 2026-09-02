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

export const gasesteCategorie = (slug: string) =>
  CATEGORII_CUNOSCUTE.find((c) => c.slug === slug);
