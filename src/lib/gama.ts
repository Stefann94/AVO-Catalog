/**
 * „Gama de produse" — datele celor patru carduri de pe pagina de start.
 *
 * Totul vine din WooCommerce: numele, numărul de produse, descrierea, fotografia
 * și prețul de pornire. Constanta de la finalul fișierului e rezervă, în
 * tiparul din lib/perioada.ts — se folosește doar cât timp WordPress tace sau
 * n-are încă datele, iar la primul răspuns valid valoarea lui câștigă.
 *
 * ─── CE SE COMPLETEAZĂ ÎN WOOCOMMERCE ─────────────────────────────────────
 *
 *   Products → Categories → Edit
 *     Description ... textul de sub titlu pe pagina categoriei
 *     Thumbnail ...... fotografia cardului
 *
 * Ambele sunt goale la instalare. Cardul rămâne corect fără ele: descrierea
 * lipsă nu se afișează, iar fotografia lipsă cade pe cea din public/.
 */

import { cache } from "react";
import type { StaticImageData } from "next/image";
import { fetchGraphQL } from "./graphql-client";
import { GET_CATEGORII_GAMA_QUERY, construiestePreturiQuery } from "./queries";

import imgPanouri from "../../public/cat-panouri.jpg";
import imgInvertoare from "../../public/cat-invertoare.jpg";
import imgStocare from "../../public/cat-stocare.jpg";
import imgMontaj from "../../public/cat-montaj.jpg";

export type CategorieGama = {
  slug: string;
  nume: string;
  produse: number;
  descriere?: string;
  /** Adresa miniaturii din WooCommerce. Lipsă → se folosește `imagineLocala`. */
  imagine?: string;
  /** Fotografia din public/, cu miniatură neclară generată la build. */
  imagineLocala?: StaticImageData;
  deLa?: number;
  unitate?: string;
  /** Ancora pentru categoriile fără preț comparabil: cea mai mare subcategorie. */
  statistica?: { eticheta: string; valoare: string };
};

/* ══════════════════════════════════════════════════════════════════════════
   Deciziile care nu se pot deduce din date
   ──────────────────────────────────────────────────────────────────────────
   Restul fișierului derivă totul din WooCommerce. Astea două nu se pot, și e
   mai cinstit să stea la vedere decât ascunse într-o formulă care pare
   automată.

   1. CARE PATRU CATEGORII. Sunt opt în catalog, iar grila are patru locuri.
      Alegerea nu e „cele mai mari" — după numărul de produse, „Sisteme de
      Montaj" (51) ar fi primul card, iar panourile ultimul. Ordinea reală vine
      din `menuOrder`, deci se schimbă din WooCommerce, nu de aici; lista de mai
      jos spune doar care intră în secțiune.

   2. UNDE NU SE AFIȘEAZĂ PREȚ. La „Sisteme de Montaj" cel mai ieftin produs e
      un șurub de 0,21 €. E adevărat, dar „de la 0,21 €" lângă „de la 54 €/panou"
      nu ajută pe nimeni să aleagă — cine caută o structură nu cumpără un șurub.
      Excluderea accesoriilor nu rezolvă: șurubul e în „K2 Systems", adică fix
      subcategoria principală.

      Nu există o regulă care să deducă asta din cifre fără să inventeze un prag
      arbitrar. Așa că e o decizie scrisă, iar cardul primește în loc cea mai
      mare subcategorie — care ESTE derivată: K2 Systems, 28 din 51.

      Locul definitiv al deciziei e un câmp pe categorie în WooCommerce. Până
      atunci, aici.
   ══════════════════════════════════════════════════════════════════════════ */

const IN_SECTIUNE = [
  "panouri-fotovoltaice",
  "invertoare",
  "stocare-energie",
  "sisteme-de-montaj",
] as const;

const FARA_PRET = new Set<string>(["sisteme-de-montaj"]);

/** Fotografiile din public/, cât timp categoriile n-au miniatură în WooCommerce. */
const IMAGINI_LOCALE: Record<string, StaticImageData> = {
  "panouri-fotovoltaice": imgPanouri,
  invertoare: imgInvertoare,
  "stocare-energie": imgStocare,
  "sisteme-de-montaj": imgMontaj,
};

/* ══════════════════════════════════════════════════════════════════════════
   Citirea din WooCommerce
   ══════════════════════════════════════════════════════════════════════════ */

type NodCategorie = {
  name?: string | null;
  slug?: string | null;
  count?: number | null;
  description?: string | null;
  menuOrder?: number | null;
  image?: { sourceUrl?: string | null; altText?: string | null } | null;
  children?: { nodes?: { name?: string | null; slug?: string | null; count?: number | null }[] | null } | null;
};

type NodPret = {
  price?: string | null;
  productCategories?: { nodes?: { slug?: string | null }[] | null } | null;
  dateCatalog?: { unitatePret?: string | null } | null;
};

/**
 * Descrierea WooCommerce vine cu HTML; cardul o vrea ca text simplu.
 *
 * Se scot etichetele și se normalizează spațiile. Nu folosim
 * `dangerouslySetInnerHTML` ca pe pagina de categorie: acolo textul are un
 * paragraf întreg la dispoziție, aici stă pe un rând sub titlu, iar un `<p>`
 * sau un `<strong>` venit din editor ar rupe așezarea cardului.
 */
function textSimplu(html?: string | null): string | undefined {
  const t = html?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t ? t : undefined;
}

/** Produsele categoriei, inclusiv cele din subcategorii. */
function numaraProduse(nod: NodCategorie): number {
  const direct = nod.count ?? 0;
  const copii = (nod.children?.nodes ?? []).reduce((s, c) => s + (c?.count ?? 0), 0);
  return direct + copii;
}

/** Cea mai mare subcategorie — ancora categoriilor fără preț comparabil. */
function ceaMaiMareSubcategorie(nod: NodCategorie): { eticheta: string; valoare: string } | undefined {
  const copii = (nod.children?.nodes ?? []).filter((c) => c?.name && (c.count ?? 0) > 0);
  if (copii.length === 0) return undefined;

  const max = copii.reduce((a, b) => ((b!.count ?? 0) > (a!.count ?? 0) ? b : a))!;
  return { eticheta: max.name!, valoare: String(max.count ?? 0) };
}

/**
 * Prețul de pornire al unei categorii.
 *
 * Se sar produsele fără preț („la cerere") și cele din subcategorii de
 * accesorii. A doua regulă e ce face diferența dintre un număr adevărat și unul
 * util: la „Stocare Energie", cel mai ieftin produs e o bază cu cabluri de 60 €
 * din „Accesorii Stocare", iar cine caută stocare vrea să știe că bateria
 * începe la 395 €. Ambele cifre sunt adevărate; a doua răspunde la întrebarea
 * pusă.
 */
function pretDePornire(noduri: NodPret[]): { deLa: number; unitate: string } | undefined {
  for (const n of noduri) {
    const pret = Number(n?.price);
    if (!Number.isFinite(pret) || pret <= 0) continue;

    const slugs = (n.productCategories?.nodes ?? []).map((c) => c?.slug ?? "");
    if (slugs.some((s) => s.includes("accesorii"))) continue;

    return { deLa: pret, unitate: n.dateCatalog?.unitatePret?.trim() || "buc" };
  }
  return undefined;
}

/**
 * Cele patru categorii, din WooCommerce, cu rezervă scrisă în cod.
 *
 * Două cereri, nu una: GraphQL n-are „grupează după categorie", deci prețurile
 * de pornire se cer separat, într-o interogare construită din slug-urile venite
 * la prima. Amândouă stau o oră în cache, deci vizitatorii nu le plătesc.
 *
 * Dacă a doua cerere eșuează, categoriile rămân — pierdem doar cifra de preț,
 * nu secțiunea. De-aia nu sunt legate într-un `Promise.all` cu aruncare.
 */
export const incarcaGamaProduse = cache(async (): Promise<CategorieGama[]> => {
  const date = await fetchGraphQL(GET_CATEGORII_GAMA_QUERY, {}, {
    optional: true,
    tags: ["produse"],
  });

  const toate: NodCategorie[] = date?.productCategories?.nodes ?? [];

  // Doar cele din secțiune, în ordinea dată de WooCommerce. `menuOrder` e 0 pe
  // toate până le ordonează cineva acolo; atunci decide ordinea din IN_SECTIUNE,
  // care e cea de acum de pe site.
  const alese = IN_SECTIUNE.map((slug) => toate.find((c) => c?.slug === slug)).filter(
    (c): c is NodCategorie => Boolean(c)
  );

  if (alese.length === 0) return GAMA_REZERVA;

  alese.sort((a, b) => {
    const d = (a.menuOrder ?? 0) - (b.menuOrder ?? 0);
    if (d !== 0) return d;
    return IN_SECTIUNE.indexOf(a.slug as typeof IN_SECTIUNE[number]) -
      IN_SECTIUNE.indexOf(b.slug as typeof IN_SECTIUNE[number]);
  });

  const slugs = alese.map((c) => c.slug!);
  const preturi = await fetchGraphQL(construiestePreturiQuery(slugs), {}, {
    optional: true,
    tags: ["produse"],
  });

  return alese.map((nod, i) => {
    const slug = nod.slug!;
    const ancora = FARA_PRET.has(slug)
      ? undefined
      : pretDePornire(preturi?.[`c${i}`]?.nodes ?? []);

    return {
      slug,
      nume: nod.name?.trim() || slug,
      produse: numaraProduse(nod),
      descriere: textSimplu(nod.description),
      imagine: nod.image?.sourceUrl ?? undefined,
      imagineLocala: IMAGINI_LOCALE[slug],
      deLa: ancora?.deLa,
      unitate: ancora?.unitate,
      statistica: ancora ? undefined : ceaMaiMareSubcategorie(nod),
    };
  });
});

/**
 * Rezerva, folosită doar cât timp WooCommerce nu răspunde.
 *
 * Cifrele sunt cele din catalogul Septembrie 2026, verificate rând cu rând în
 * CSV-ul de import. Nu se actualizează de mână la fiecare lună: rolul lor e să
 * țină pagina în picioare într-o pană de WordPress, nu să fie adevărul curent.
 */
export const GAMA_REZERVA: CategorieGama[] = [
  {
    slug: "panouri-fotovoltaice",
    nume: "Panouri Fotovoltaice",
    produse: 28,
    deLa: 54,
    unitate: "panou",
    imagineLocala: imgPanouri,
  },
  {
    slug: "invertoare",
    nume: "Invertoare",
    produse: 35,
    deLa: 355,
    unitate: "buc",
    imagineLocala: imgInvertoare,
  },
  {
    slug: "stocare-energie",
    nume: "Stocare Energie",
    produse: 39,
    deLa: 395,
    unitate: "buc",
    imagineLocala: imgStocare,
  },
  {
    slug: "sisteme-de-montaj",
    nume: "Sisteme de Montaj",
    produse: 51,
    statistica: { eticheta: "K2 Systems", valoare: "28" },
    imagineLocala: imgMontaj,
  },
];
