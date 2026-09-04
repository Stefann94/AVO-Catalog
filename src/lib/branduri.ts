/**
 * Brandurile din catalog.
 *
 * Numărate din CSV-ul de import (Catalog Solar One 09.2026): 17 valori
 * distincte în atributul `Brand`, pe 148 din cele 172 de produse. Restul de 24
 * sunt structuri de montaj și accesorii generice, fără marcă proprie.
 *
 * Ordinea e după numărul de produse. Primele cinci acoperă 82% din catalog.
 *
 * `produse` nu se afișează încă nicăieri, dar decide ordinea din bandă și va fi
 * folosit de secțiunea de branduri, când o facem. La primul import care aduce
 * date reale, cifrele se recalculează din GraphQL.
 *
 * Fiecare intrare are o siglă în public/branduri/<slug>.png. Siglele sunt
 * normalizate ca siluete albe pe fond transparent — vezi comentariul din
 * BandaBranduri pentru motiv.
 */
export type Brand = {
  slug: string;
  nume: string;
  produse: number;
};

export const BRANDURI: Brand[] = [
  { slug: "deye", nume: "Deye", produse: 55 },
  { slug: "k2-systems", nume: "K2 Systems", produse: 28 },
  { slug: "aiko-solar", nume: "Aiko Solar", produse: 14 },
  { slug: "growatt", nume: "Growatt", produse: 14 },
  { slug: "canadian-solar", nume: "Canadian Solar", produse: 9 },
  { slug: "pytes", nume: "Pytes", produse: 5 },
  { slug: "felicity", nume: "Felicity Solar", produse: 5 },
  { slug: "jinko-solar", nume: "Jinko Solar", produse: 3 },
  { slug: "eastron", nume: "Eastron", produse: 3 },
  { slug: "dyness", nume: "Dyness", produse: 2 },
  { slug: "solis", nume: "Solis", produse: 2 },
  { slug: "top-cable", nume: "Top Cable", produse: 2 },
  { slug: "staubli", nume: "Stäubli", produse: 2 },
  { slug: "tongwei-solar", nume: "Tongwei Solar", produse: 1 },
  { slug: "ulica-solar", nume: "Ulica Solar", produse: 1 },
  { slug: "pcenersys", nume: "PCEnersys", produse: 1 },
  { slug: "hailei", nume: "Hailei", produse: 1 },
];

/**
 * Numele, redus la forma după care se caută.
 *
 * `NFD` desparte litera de semnul diacritic, iar intervalul șters e blocul de
 * semne combinate — așa „Stäubli" devine „staubli". Contează la propriu:
 * importatorul scrie brandul „Staubli", fără umlaut (tools/catalog-import/
 * overrides.js), iar lista de aici îl are cu. Fără normalizare, exact acel
 * brand ar rămâne fără siglă.
 */
function slugifica(nume: string): string {
  return nume
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Brandul din listă, după numele scris pe produs.
 *
 * ─── DE CE E NEVOIE DE CĂUTARE, NU DE O SIMPLĂ CHEIE ──────────────────────
 *
 * Numele de pe produs vine din atributul `Brand` din WooCommerce, scris de
 * importator din titlul secțiunii de catalog. Nu e garantat identic cu numele
 * din lista de aici, și nici n-ar trebui să fie: lista asta e a noastră,
 * atributul e al catalogului. Diferențele reale de acum:
 *
 *   „Staubli" pe produs ....... „Stäubli" în listă     → diacritic
 *   „Felicity" pe produs ...... „Felicity Solar" ....  → nume scurtat
 *
 * Cele trei încercări sunt în ordinea încrederii: nume identic, slug identic,
 * apoi unul prefix al celuilalt. Prefixul e ultimul fiindcă e singurul care
 * poate greși — dar numai între un nume scurt și versiunea lui lungă, ceea ce
 * e chiar cazul pe care îl rezolvă. Cerința ca despărțitorul să fie „-" ține
 * „solis" departe de un ipotetic „solis-x" nedorit: se compară segmente, nu
 * șiruri de litere.
 *
 * Întoarce `undefined` pentru cele 24 de produse fără marcă proprie (structuri
 * de montaj, accesorii generice) și pentru orice brand nou apărut în catalog
 * înainte să-i punem sigla. Cine folosește funcția trebuie să aibă o variantă
 * de rezervă — pe fișa de produs, numele scris.
 */
export function gasesteBrand(nume?: string | null): Brand | undefined {
  if (!nume) return undefined;
  const cheie = slugifica(nume);
  if (!cheie) return undefined;

  return (
    BRANDURI.find((b) => slugifica(b.nume) === cheie) ??
    BRANDURI.find((b) => b.slug === cheie) ??
    BRANDURI.find(
      (b) => b.slug.startsWith(`${cheie}-`) || cheie.startsWith(`${b.slug}-`)
    )
  );
}
