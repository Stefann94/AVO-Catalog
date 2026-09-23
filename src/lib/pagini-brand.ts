import { cache } from "react";
import { incarcaToateProdusele } from "./produs";
import { BRANDURI, gasesteBrand } from "./branduri";
import { CATEGORII_CUNOSCUTE, SUBCATEGORII_CUNOSCUTE } from "./categorii";

/**
 * Paginile „categorie + brand": /catalog/invertoare/brand-deye
 *
 * ─── DE CE EXISTĂ, DEȘI ÎNAINTE ERA UN FILTRU ─────────────────────────────
 *
 * Filtrul era `?brand=deye`, adică un parametru citit pe server la fiecare
 * cerere. Asta avea două costuri.
 *
 * Unul de viteză: o pagină care citește parametri din adresă nu poate fi
 * pregătită dinainte, deci se construia la fiecare vizită. Măsurat, paginile
 * de categorie răspundeau în 267 ms, față de ~130 ms cele pregătite. Și era
 * un obstacol de netrecut pentru site-ul static, care n-are server care să
 * citească nimic.
 *
 * Unul de căutări, mai important: adresa cu parametru era marcată `noindex`,
 * fiindcă altfel ar fi concurat cu pagina curată a categoriei pentru aceleași
 * cuvinte. Adică „invertoare Deye" — exact ce caută un instalator — nu avea
 * nicio pagină care să-i răspundă.
 *
 * Ca adrese proprii, paginile devin pregătite dinainte ȘI indexabile: titlu
 * propriu, descriere proprie, adresă canonică proprie.
 *
 * ─── DE CE PREFIXUL `brand-` ──────────────────────────────────────────────
 *
 * Ruta e catch-all, iar al doilea segment e deja folosit de subcategorii:
 * /catalog/invertoare/hibride-trifazate. Fără un semn care să le deosebească,
 * un brand numit ca o subcategorie ar deschide pagina greșită. Prefixul face
 * distincția imposibil de confundat, iar verificarea că niciun slug de
 * subcategorie nu începe cu „brand-" e ieftină și a fost făcută.
 *
 * ─── DE CE NU PENTRU ORICE COMBINAȚIE ─────────────────────────────────────
 *
 * Se generează DOAR ce e și legat din meniu: brandurile categoriilor fără
 * subcategorii (vezi components/catalog/MeniuCategorii.tsx). O pagină la care
 * nu duce niciun link e o pagină pe care n-o găsește nimeni — nici omul, nici
 * Google — și care, în plus, trebuie întreținută.
 *
 * Și doar combinațiile care CHIAR au produse. O pagină goală promite un
 * răspuns pe care nu-l are.
 */

/** Ce deosebește o pagină de brand de o subcategorie, în adresă. */
export const PREFIX_BRAND = "brand-";

export type PaginaBrand = {
  /** Slug-ul categoriei: `invertoare`. */
  categorie: string;
  /** Slug-ul brandului: `deye`. */
  brand: string;
  /** Numele afișat al brandului: `Deye`. */
  numeBrand: string;
  /** Câte produse are combinația. Folosit la sortarea din sitemap. */
  produse: number;
};

/** Categoriile care arată branduri în meniu: cele fără subcategorii. */
const CATEGORII_CU_BRANDURI = CATEGORII_CUNOSCUTE.filter(
  (c) => !SUBCATEGORII_CUNOSCUTE.some((s) => s.parinte === c.slug),
).map((c) => c.slug);

/**
 * Combinațiile care merită o pagină, citite din catalogul real.
 *
 * `cache` din React ține rezultatul pe durata unei construcții: ruta îl cere
 * pentru `generateStaticParams`, sitemap-ul îl cere din nou, dar produsele se
 * încarcă o singură dată.
 */
export const paginiBrand = cache(async (): Promise<PaginaBrand[]> => {
  const produse = await incarcaToateProdusele();
  const numar = new Map<string, number>();

  for (const p of produse) {
    const categorie = p.categorie?.slug;
    if (!categorie || !CATEGORII_CU_BRANDURI.includes(categorie)) continue;

    const brand = gasesteBrand(p.brand)?.slug;
    if (!brand) continue;

    const cheie = `${categorie}/${brand}`;
    numar.set(cheie, (numar.get(cheie) ?? 0) + 1);
  }

  return [...numar.entries()]
    .map(([cheie, produse]) => {
      const [categorie, brand] = cheie.split("/");
      return {
        categorie,
        brand,
        numeBrand: BRANDURI.find((b) => b.slug === brand)?.nume ?? brand,
        produse,
      };
    })
    .sort((a, b) => b.produse - a.produse || a.categorie.localeCompare(b.categorie));
});

/** `/catalog/invertoare/brand-deye` */
export const caleBrand = (categorie: string, brand: string) =>
  `/catalog/${categorie}/${PREFIX_BRAND}${brand}`;
