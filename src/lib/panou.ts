/**
 * Bara de filtre — cuprinsul catalogului, din WooCommerce.
 *
 * Categoriile cu subcategoriile lor și stările de stoc, fiecare cu numărul real
 * de produse. Constanta de la finalul fișierului e rezervă, în tiparul din
 * lib/gama.ts și lib/perioada.ts — se folosește doar cât timp WordPress tace,
 * iar la primul răspuns valid valoarea lui câștigă.
 *
 * ─── DE CE IERARHIA, NU O LISTĂ PLATĂ ─────────────────────────────────────
 *
 * Catalogul PDF nu are opt secțiuni, ci treizeci și șase, iar titlurile lor
 * poartă tot ce contează la cumpărare: „Invertoare DEYE Trifazate Hibride
 * High-Voltage", nu „Invertoare". Importatorul le transformă în subcategorii,
 * deci arborele din WooCommerce E cuprinsul catalogului. Bara îl reproduce.
 */

import { cache } from "react";
import { fetchGraphQL } from "./graphql-client";
import { GET_PANOU_CATALOG_QUERY } from "./queries";

/** O stare de stoc, cu câte produse are. */
export type StareStoc = {
  slug: string;
  eticheta: string;
  produse: number;
};

/** O subcategorie, așa cum apare în catalog. */
export type Subcategorie = {
  slug: string;
  nume: string;
  produse: number;
};

/** O categorie de nivel 1, cu subcategoriile ei. */
export type CategorieFiltru = {
  slug: string;
  nume: string;
  /** Totalul: produsele puse direct pe ea plus cele din subcategorii. */
  produse: number;
  subcategorii: Subcategorie[];
};

export type DateBaraFiltre = {
  stari: StareStoc[];
  categorii: CategorieFiltru[];
};

/* ══════════════════════════════════════════════════════════════════════════
   Ordinea stărilor de stoc
   ──────────────────────────────────────────────────────────────────────────
   Nu alfabetic și nu după număr. E ordinea în care informația chiar folosește
   cuiva care se uită la o bară de catalog:

     în stoc ......... starea normală, cea mai mare, ancora („din ce aleg")
     lichidare ....... starea perisabilă, motivul pentru care merită citit acum
     la comandă ...... excepția, cea mai mică

   După număr ar da aceeași ordine azi (155 / 15 / 2), dar din întâmplare: la
   prima lună cu trei produse „la comandă" și două în lichidare, ordinea s-ar
   inversa fără ca nimic să se fi schimbat în ce vrea cititorul să afle.

   O stare pe care WooCommerce o întoarce și care nu e în listă se adaugă la
   sfârșit, cu eticheta ei — nu dispare fiindcă n-a prevăzut-o nimeni aici.
   ══════════════════════════════════════════════════════════════════════════ */

const ORDINE_STARI = ["in-stoc", "lichidare-stoc", "la-comanda"];

type NodTermen = {
  name?: string | null;
  slug?: string | null;
  count?: number | null;
};

type NodSubcategorie = {
  name?: string | null;
  slug?: string | null;
  count?: number | null;
};

type NodCategorie = {
  name?: string | null;
  slug?: string | null;
  count?: number | null;
  menuOrder?: number | null;
  children?: { nodes?: NodSubcategorie[] | null } | null;
};

function mapeazaStari(noduri: NodTermen[]): StareStoc[] {
  const stari = noduri
    .map((t) => ({
      slug: t?.slug?.trim() ?? "",
      eticheta: t?.name?.trim() ?? "",
      produse: t?.count ?? 0,
    }))
    .filter((s) => s.slug && s.eticheta && s.produse > 0);

  return stari.sort((a, b) => {
    const ia = ORDINE_STARI.indexOf(a.slug);
    const ib = ORDINE_STARI.indexOf(b.slug);
    // Necunoscutele la coadă, nu la cap: `indexOf` întoarce -1, care altfel
    // le-ar sorta înaintea tuturor.
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

function mapeazaCategorii(noduri: NodCategorie[]): CategorieFiltru[] {
  return noduri
    .map((c) => {
      const subcategorii: Subcategorie[] = (c?.children?.nodes ?? [])
        .map((s) => ({
          slug: s?.slug?.trim() ?? "",
          nume: s?.name?.trim() ?? "",
          produse: s?.count ?? 0,
        }))
        .filter((s) => s.slug && s.nume && s.produse > 0)
        // Cea mai mare subcategorie prima. În catalog ordinea e cea din PDF,
        // dar WooCommerce n-o păstrează: `menuOrder` e 0 pe toate. Mărimea e
        // cel puțin un criteriu, și e cel care pune sus lucrurile pe care le
        // caută cei mai mulți — „Hibride Trifazate" înaintea lui „Off-Grid".
        .sort((a, b) => b.produse - a.produse);

      const direct = c?.count ?? 0;
      const dinCopii = subcategorii.reduce((s, x) => s + x.produse, 0);

      return {
        slug: c?.slug?.trim() ?? "",
        nume: c?.name?.trim() ?? "",
        produse: direct + dinCopii,
        subcategorii,
        ordine: c?.menuOrder ?? 0,
      };
    })
    .filter((c) => c.slug && c.nume && c.produse > 0)
    // `menuOrder` e 0 pe toate până le ordonează cineva în WooCommerce; atunci
    // decide numărul de produse, care e cel puțin o ordine motivată. Când
    // cineva le aranjează acolo, aceea câștigă — fără modificare de cod.
    .sort((a, b) => a.ordine - b.ordine || b.produse - a.produse)
    .map(({ slug, nume, produse, subcategorii }) => ({
      slug,
      nume,
      produse,
      subcategorii,
    }));
}

/**
 * Datele barei, cu rezervă scrisă în cod.
 *
 * O singură cerere pentru amândouă seturile: GraphQL le rezolvă în paralel pe
 * server, deci un drum până la WordPress în loc de două.
 *
 * `optional: true` fiindcă interogarea cere `terms`, expus de WPGraphQL, care
 * poate lipsi dintr-o instalare incompletă. Fără el, absența lui ar tipări la
 * fiecare build un obiect de erori și o urmă de stivă — adică exact aspectul
 * unui build stricat, deși bara are rezervă și se randează corect.
 */
export const incarcaBaraFiltre = cache(async (): Promise<DateBaraFiltre> => {
  const date = await fetchGraphQL(GET_PANOU_CATALOG_QUERY, {}, {
    optional: true,
    tags: ["produse"],
  });

  if (!date) return BARA_REZERVA;

  const stari = mapeazaStari(date.disponibilitate?.nodes ?? []);
  const categorii = mapeazaCategorii(date.categorii?.nodes ?? []);

  // Fiecare bloc cade separat pe rezervă. Dacă WooCommerce răspunde cu
  // categorii dar fără termeni de stoc — se poate întâmpla, vin din extensii
  // diferite — pierdem un bloc, nu toată bara.
  return {
    stari: stari.length > 0 ? stari : BARA_REZERVA.stari,
    categorii: categorii.length > 0 ? categorii : BARA_REZERVA.categorii,
  };
});

/**
 * Rezerva, folosită doar cât timp WooCommerce nu răspunde.
 *
 * Cifrele sunt cele din catalogul Septembrie 2026, numărate în CSV-ul de
 * import. Nu se actualizează de mână la fiecare lună: rolul lor e să țină bara
 * în picioare într-o pană de WordPress, nu să fie adevărul curent.
 */
export const BARA_REZERVA: DateBaraFiltre = {
  stari: [
    { slug: "in-stoc", eticheta: "În stoc", produse: 155 },
    { slug: "lichidare-stoc", eticheta: "Lichidare stoc", produse: 15 },
    { slug: "la-comanda", eticheta: "La comandă", produse: 2 },
  ],
  categorii: [
    {
      slug: "sisteme-de-montaj",
      nume: "Sisteme de Montaj",
      produse: 51,
      subcategorii: [
        { slug: "k2-systems", nume: "K2 Systems", produse: 28 },
        { slug: "structuri-acoperis-metalic", nume: "Structuri Acoperiș Metalic", produse: 7 },
        { slug: "structuri-acoperis-plat", nume: "Structuri Acoperiș Plat", produse: 6 },
        { slug: "cleme-si-accesorii", nume: "Cleme și Accesorii", produse: 6 },
        { slug: "sine-si-profile", nume: "Șine și Profile", produse: 3 },
        { slug: "structuri-tigla", nume: "Structuri Țiglă", produse: 1 },
      ],
    },
    {
      slug: "stocare-energie",
      nume: "Stocare Energie",
      produse: 39,
      subcategorii: [
        { slug: "acumulatori-low-voltage", nume: "Acumulatori Low-Voltage", produse: 22 },
        { slug: "sisteme-stocare-complete", nume: "Sisteme Stocare Complete", produse: 7 },
        { slug: "acumulatori-high-voltage", nume: "Acumulatori High-Voltage", produse: 4 },
        { slug: "accesorii-stocare", nume: "Accesorii Stocare", produse: 4 },
        { slug: "micro-ess-balcon", nume: "Micro ESS / Balcon", produse: 2 },
      ],
    },
    {
      slug: "invertoare",
      nume: "Invertoare",
      produse: 35,
      subcategorii: [
        { slug: "hibride-trifazate", nume: "Hibride Trifazate", produse: 18 },
        { slug: "hibride-monofazate", nume: "Hibride Monofazate", produse: 11 },
        { slug: "on-grid", nume: "On-Grid", produse: 4 },
        { slug: "off-grid", nume: "Off-Grid", produse: 2 },
      ],
    },
    {
      slug: "panouri-fotovoltaice",
      nume: "Panouri Fotovoltaice",
      produse: 28,
      subcategorii: [],
    },
    {
      slug: "monitorizare-smart-devices",
      nume: "Monitorizare & Smart Devices",
      produse: 8,
      subcategorii: [
        { slug: "smart-meters", nume: "Smart Meters", produse: 5 },
        { slug: "dispozitive-smart", nume: "Dispozitive Smart", produse: 3 },
      ],
    },
    {
      slug: "statii-de-incarcare-auto",
      nume: "Stații de Încărcare Auto",
      produse: 4,
      subcategorii: [],
    },
    {
      slug: "accesorii",
      nume: "Accesorii",
      produse: 4,
      subcategorii: [
        { slug: "cabluri-solare", nume: "Cabluri Solare", produse: 2 },
        { slug: "conectori", nume: "Conectori", produse: 2 },
      ],
    },
    {
      slug: "echipamente-conversie-comutare",
      nume: "Echipamente Conversie & Comutare",
      produse: 3,
      subcategorii: [],
    },
  ],
};
