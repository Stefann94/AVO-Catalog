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

/* ══════════════════════════════════════════════════════════════════════════
   Ordinea categoriilor și a subcategoriilor
   ──────────────────────────────────────────────────────────────────────────
   E ORDINEA DIN CATALOGUL TIPĂRIT, nu una inventată aici și nu mărimea.

   Bara se numește „cuprinsul catalogului". Un cuprins care listează altfel
   decât cartea nu e cuprins, e altă listă — iar sortarea după numărul de
   produse chiar dădea altceva: „Sisteme de Montaj" (51) apărea prima, deși în
   PDF începe abia la pagina 8 și ține până la 11, iar „Panouri Fotovoltaice",
   cu care se DESCHIDE catalogul la pagina 3, cădea pe locul patru. Cine avea
   catalogul deschis alături găsea două ordini diferite pentru același lucru.

   ─── DE UNDE IESE ────────────────────────────────────────────────────────

   Din ordinea PAGINILOR din „Catalog lunar Solar One", citită mecanic, nu din
   ochi: parserul din tools/catalog-import parcurge PDF-ul liniar, deci rândurile
   din solar-one-woocommerce.csv păstrează ordinea tipărită. Listele de mai jos
   sunt ordinea primei apariții a fiecărei categorii în acel fișier.

     p. 3–4 ... Panouri Fotovoltaice
     p. 5 ..... Invertoare
     p. 6 ..... Stocare Energie, apoi Echipamente Conversie & Comutare
     p. 7 ..... Stații de Încărcare Auto, Monitorizare & Smart Devices
     p. 8–11 .. Sisteme de Montaj
     p. 11 .... Accesorii

   Primele trei sunt confirmate și de coperta catalogului, care își anunță
   singură cuprinsul: „Panouri fotovoltaice • Invertoare • Stocare energie •
   Sisteme montaj • Accesorii".

   „Echipamente Conversie & Comutare" e la pagina 6 fiindcă acolo sunt tipărite
   cele trei produse ale ei — sub un titlu de secțiune care nu li se potrivește,
   vezi ORPHANS din tools/catalog-import/overrides.js.

   ─── CE SE ÎNTÂMPLĂ CU CE NU E ÎN LISTĂ ──────────────────────────────────

   Merge la coadă, ordonat după numărul de produse, și rămâne vizibil. O
   categorie nouă adăugată în WooCommerce nu dispare fiindcă n-a prevăzut-o
   nimeni aici; doar nu poate ști singură a câta e în catalogul tipărit.

   Slugurile sunt unice în tot arborele, deci subcategoriile încap într-o
   singură listă plată, fără să fie grupate pe părinte.
   ══════════════════════════════════════════════════════════════════════════ */

const ORDINE_CATEGORII = [
  "panouri-fotovoltaice",
  "invertoare",
  "stocare-energie",
  "echipamente-conversie-comutare",
  "statii-de-incarcare-auto",
  "monitorizare-smart-devices",
  "sisteme-de-montaj",
  "accesorii",
];

const ORDINE_SUBCATEGORII = [
  // Invertoare — pagina 5, în ordinea secțiunilor DEYE; Off-Grid vine de la
  // pagina 8, din blocul Growatt de lichidare.
  "hibride-monofazate",
  "hibride-trifazate",
  "on-grid",
  "off-grid",
  // Stocare Energie — pagina 6, apoi acumulatorii altor branduri la pagina 7.
  "acumulatori-high-voltage",
  "accesorii-stocare",
  "sisteme-stocare-complete",
  "acumulatori-low-voltage",
  "micro-ess-balcon",
  // Monitorizare & Smart Devices — pagina 7.
  "dispozitive-smart",
  "smart-meters",
  // Sisteme de Montaj — paginile 8–9 secțiunea generică, 10–11 blocul K2.
  "structuri-acoperis-plat",
  "cleme-si-accesorii",
  "structuri-acoperis-metalic",
  "sine-si-profile",
  "structuri-tigla",
  "k2-systems",
  // Accesorii — pagina 11.
  "cabluri-solare",
  "conectori",
];

/** Poziția în ordinea din catalog; necunoscutele la coadă, nu la cap. */
function pozitie(ordine: string[], slug: string): number {
  const i = ordine.indexOf(slug);
  return i === -1 ? 99 : i;
}

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
        // Ordinea din catalogul tipărit; mărimea decide doar între cele pe care
        // ORDINE_SUBCATEGORII nu le cunoaște. Vezi comentariul de la constantă.
        .sort(
          (a, b) =>
            pozitie(ORDINE_SUBCATEGORII, a.slug) -
              pozitie(ORDINE_SUBCATEGORII, b.slug) || b.produse - a.produse,
        );

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
    // Trei criterii, în ordinea asta:
    //
    //   `menuOrder` ...... e 0 pe toate până le aranjează cineva în WooCommerce.
    //                      Rămâne primul tocmai ca aranjarea de acolo să
    //                      câștige, fără modificare de cod.
    //   catalogul ........ ordinea paginilor din PDF; vezi ORDINE_CATEGORII.
    //   numărul .......... doar pentru categoriile pe care lista nu le cunoaște.
    .sort(
      (a, b) =>
        a.ordine - b.ordine ||
        pozitie(ORDINE_CATEGORII, a.slug) - pozitie(ORDINE_CATEGORII, b.slug) ||
        b.produse - a.produse,
    )
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
  // Scrise în ordinea din catalogul tipărit, ca rezerva să arate la fel cu
  // varianta care vine din WooCommerce. Sortarea le-ar aduce oricum aici, dar
  // atunci fișierul ar fi singurul loc din proiect unde ordinea scrisă diferă
  // de cea afișată — iar cine îl citește ar crede că e ordinea reală.
  categorii: [
    {
      slug: "panouri-fotovoltaice",
      nume: "Panouri Fotovoltaice",
      produse: 28,
      subcategorii: [],
    },
    {
      slug: "invertoare",
      nume: "Invertoare",
      produse: 35,
      subcategorii: [
        { slug: "hibride-monofazate", nume: "Hibride Monofazate", produse: 11 },
        { slug: "hibride-trifazate", nume: "Hibride Trifazate", produse: 18 },
        { slug: "on-grid", nume: "On-Grid", produse: 4 },
        { slug: "off-grid", nume: "Off-Grid", produse: 2 },
      ],
    },
    {
      slug: "stocare-energie",
      nume: "Stocare Energie",
      produse: 39,
      subcategorii: [
        { slug: "acumulatori-high-voltage", nume: "Acumulatori High-Voltage", produse: 4 },
        { slug: "accesorii-stocare", nume: "Accesorii Stocare", produse: 4 },
        { slug: "sisteme-stocare-complete", nume: "Sisteme Stocare Complete", produse: 7 },
        { slug: "acumulatori-low-voltage", nume: "Acumulatori Low-Voltage", produse: 22 },
        { slug: "micro-ess-balcon", nume: "Micro ESS / Balcon", produse: 2 },
      ],
    },
    {
      slug: "echipamente-conversie-comutare",
      nume: "Echipamente Conversie & Comutare",
      produse: 3,
      subcategorii: [],
    },
    {
      slug: "statii-de-incarcare-auto",
      nume: "Stații de Încărcare Auto",
      produse: 4,
      subcategorii: [],
    },
    {
      slug: "monitorizare-smart-devices",
      nume: "Monitorizare & Smart Devices",
      produse: 8,
      subcategorii: [
        { slug: "dispozitive-smart", nume: "Dispozitive Smart", produse: 3 },
        { slug: "smart-meters", nume: "Smart Meters", produse: 5 },
      ],
    },
    {
      slug: "sisteme-de-montaj",
      nume: "Sisteme de Montaj",
      produse: 51,
      subcategorii: [
        { slug: "structuri-acoperis-plat", nume: "Structuri Acoperiș Plat", produse: 6 },
        { slug: "cleme-si-accesorii", nume: "Cleme și Accesorii", produse: 6 },
        { slug: "structuri-acoperis-metalic", nume: "Structuri Acoperiș Metalic", produse: 7 },
        { slug: "sine-si-profile", nume: "Șine și Profile", produse: 3 },
        { slug: "structuri-tigla", nume: "Structuri Țiglă", produse: 1 },
        { slug: "k2-systems", nume: "K2 Systems", produse: 28 },
      ],
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
  ],
};
