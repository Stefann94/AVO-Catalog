/**
 * Fișa de produs — datele, curățate de forma în care le dă GraphQL.
 *
 * Nu are rezervă scrisă în cod, spre deosebire de restul modulelor din lib/.
 * Motivul e că un produs anume ori există în WooCommerce, ori nu — nu se poate
 * inventa o versiune de siguranță a lui. Când lipsește, pagina cheamă
 * `notFound()`; e singura formă onestă.
 */

import { cache } from "react";
import { fetchGraphQL } from "./graphql-client";
import {
  GET_PRODUS_QUERY,
  GET_SLUGURI_PRODUSE_QUERY,
  GET_PRODUSE_TOATE_QUERY,
} from "./queries";
import { cifraDeTitlu, type Atribut, type CifraTitlu } from "./spec";

/**
 * Un statut afișat ca badge.
 *
 * `ton` e ROLUL, nu culoarea. Culoarea o alege componenta care randează — vezi
 * comentariul de la `STATUTURI` pentru de ce aspectul nu are ce căuta aici,
 * și cu atât mai puțin în baza de date.
 */
export type Statut = {
  eticheta: string;
  ton: "oferta" | "urgent" | "neutru";
};

export type Produs = {
  nume: string;
  slug: string;
  sku: string;
  brand?: string;
  descriere?: string;
  pret?: number;
  pretVolum?: number;
  prag?: string;
  unitate: string;
  pretContainer?: string;
  disponibilitate?: string;
  sursaCatalog?: string;
  /** Cifra care ține locul fotografiei. Vezi lib/spec.ts. */
  cifra?: CifraTitlu;
  /**
   * Ce se scrie mare când nu există cifră. `mono` cere fontul cu cifre de
   * lățime egală — se aplică doar codurilor de model. Vezi `ancoraVizuala`.
   */
  ancora?: { text: string; mono: boolean };
  /** Categoria de nivel 1 și, dacă există, subcategoria. Pentru firul Ariadnei. */
  categorie?: { nume: string; slug: string };
  subcategorie?: { nume: string; slug: string };
  /** Perechile din tabelul de specificații, fără cele afișate deja aiurea. */
  specificatii: Atribut[];
  statuturi: Statut[];
};

/* ══════════════════════════════════════════════════════════════════════════
   Statuturile
   ──────────────────────────────────────────────────────────────────────────
   Vin din două locuri, cu regimuri diferite, iar diferența e ce face sistemul
   să funcționeze luna viitoare:

   AUTOMAT, din catalog. „Ofertă specială" iese din `featured`, pe care
   importatorul îl pune citind pagina de oferte de pe coperta PDF-ului.
   „Lichidare stoc" iese din atributul Disponibilitate, scris tot de importator
   din titlul secțiunii. Nimeni nu le bifează; se recalculează la fiecare import.

   MANUAL, din WooCommerce. Etichetele de produs (Products → Tags): „Recomandat",
   „Stoc limitat", orice apare. Importatorul NU scrie coloana `Tags`, deci ce
   pune un om acolo supraviețuiește reimportului lunar. Ăsta era tot rostul
   alegerii lor.

   DE CE ASPECTUL NU STĂ ÎN BAZA DE DATE. Baza spune CE e adevărat — „ofertă
   specială". Cum arată badge-ul decide codul. Dacă am ține culoarea în
   WooCommerce, cineva ar alege un portocaliu care cade sub pragul de contrast
   și nimeni n-ar afla; iar un al patrulea accent ar strica exact regula de un
   singur accent pe care am impus-o peste tot.

   Un tag necunoscut primește tonul neutru și se afișează cu numele lui. Așa,
   un statut nou funcționează din prima, fără cod — doar că arată sobru până
   îi dăm un ton anume aici.
   ══════════════════════════════════════════════════════════════════════════ */

const TONURI: Record<string, Statut["ton"]> = {
  "oferta-speciala": "oferta",
  "lichidare-stoc": "urgent",
  "stoc-limitat": "urgent",
  recomandat: "oferta",
};

type NodProdus = {
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  price?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  stockStatus?: string | null;
  featured?: boolean | null;
  attributes?: {
    nodes?: {
      name?: string | null;
      label?: string | null;
      terms?: { nodes?: { name?: string | null }[] | null } | null;
    }[] | null;
  } | null;
  productCategories?: {
    nodes?: {
      name?: string | null;
      slug?: string | null;
      parent?: { node?: { name?: string | null; slug?: string | null } | null } | null;
    }[] | null;
  } | null;
  productTags?: { nodes?: { name?: string | null; slug?: string | null }[] | null } | null;
  dateCatalog?: {
    pretVolum?: number | null;
    pragVolum?: string | null;
    unitatePret?: string | null;
    pretContainer?: string | null;
    capacitateKwh?: number | null;
    sursaCatalog?: string | null;
  } | null;
};

/** Atributele, aduse la forma { nume, etichetă, valoare }. */
function atributeDin(nod: NodProdus): Atribut[] {
  return (nod.attributes?.nodes ?? [])
    .map((a) => ({
      nume: a?.name?.trim() ?? "",
      eticheta: a?.label?.trim() ?? "",
      valoare: a?.terms?.nodes?.[0]?.name?.trim() ?? "",
    }))
    .filter((a) => a.nume && a.eticheta && a.valoare);
}

/**
 * Textul din WooCommerce, curățat de HTML.
 *
 * Editorul WordPress împachetează totul în `<p>`, iar fișa are nevoie de text
 * simplu. Descrierile sunt oricum goale pe tot catalogul — PDF-ul e o listă de
 * prețuri — dar funcția e aici pentru ziua în care nu vor mai fi.
 */
function textSimplu(html?: string | null): string | undefined {
  const t = html?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t ? t : undefined;
}

function statuturiDin(nod: NodProdus, atribute: Atribut[]): Statut[] {
  const statuturi: Statut[] = [];

  if (nod.featured) {
    statuturi.push({ eticheta: "Ofertă specială", ton: "oferta" });
  }

  const disp = atribute.find((a) => a.nume === "pa_disponibilitate")?.valoare;
  if (disp && disp !== "În stoc") {
    statuturi.push({ eticheta: disp, ton: disp === "Lichidare stoc" ? "urgent" : "neutru" });
  }

  for (const t of nod.productTags?.nodes ?? []) {
    const eticheta = t?.name?.trim();
    const slug = t?.slug?.trim() ?? "";
    if (!eticheta) continue;
    // Tag-ul care repetă un statut automat se sare: importatorul pune deja
    // „Ofertă specială" din `featured`, iar dacă cineva bifează și eticheta,
    // badge-ul ar apărea de două ori.
    if (statuturi.some((s) => s.eticheta.toLowerCase() === eticheta.toLowerCase())) continue;
    statuturi.push({ eticheta, ton: TONURI[slug] ?? "neutru" });
  }

  return statuturi;
}

/**
 * Ce se scrie mare în locul fotografiei, când produsul n-are o cifră.
 *
 * ─── DE CE NU PUR ȘI SIMPLU SKU-UL ────────────────────────────────────────
 *
 * Fiindcă nu orice SKU e un cod de model. Importatorul îl derivă din denumire
 * atunci când catalogul nu conține niciun cod (`atribuieSku` în
 * parse-catalog.js), iar rezultatul e denumirea cu majuscule și cratime:
 *
 *   SURUB-ISO-CU-DUBLU-FILET-HANGERBOARD-PLACA-MONTAJ
 *
 * Scris la 36px deasupra unui titlu care spune exact același lucru, nu
 * identifică nimic — repetă. Un cod adevărat, în schimb, chiar e ce se
 * dictează la telefon: CS6.2-48TD-460, SUN-12K-SG04LP3, FLB48314TG1-H.
 *
 * PRAGUL DE 24 DE CARACTERE separă cele două cazuri. Nu e ales din burtă: cele
 * mai lungi coduri reale din catalog au 15–17 caractere, iar cele derivate trec
 * de 30. Între ele e un gol în care nu cade nimic, deci pragul e stabil.
 *
 * CASCADA, în ordine: codul de model, dacă e unul real → brandul, care
 * identifică măcar producătorul → subcategoria, care spune ce fel de piesă e.
 * Ultima treaptă prinde exact structurile de montaj generice, care n-au nici
 * cod, nici brand — 24 din cele 172 de produse.
 */
function ancoraVizuala(
  sku: string,
  brand: string | undefined,
  subcategorie: string | undefined,
  categorie: string | undefined
): Produs["ancora"] {
  if (sku && sku.length <= 24) return { text: sku, mono: true };
  const text = brand || subcategorie || categorie;
  return text ? { text, mono: false } : undefined;
}

function mapeaza(nod: NodProdus): Produs | null {
  const nume = nod.name?.trim();
  const slug = nod.slug?.trim();
  if (!nume || !slug) return null;

  const atribute = atributeDin(nod);
  const dc = nod.dateCatalog;
  const pret = Number(nod.price);

  const c = nod.productCategories?.nodes?.[0];
  const parinte = c?.parent?.node;

  return {
    nume,
    slug,
    sku: nod.sku?.trim() || "",
    brand: atribute.find((a) => a.nume === "pa_brand")?.valoare,
    descriere: textSimplu(nod.description) ?? textSimplu(nod.shortDescription),
    pret: Number.isFinite(pret) && pret > 0 ? pret : undefined,
    pretVolum:
      typeof dc?.pretVolum === "number" && Number.isFinite(dc.pretVolum) ? dc.pretVolum : undefined,
    prag: dc?.pragVolum?.trim() || undefined,
    unitate: dc?.unitatePret?.trim() || "buc",
    pretContainer: dc?.pretContainer?.trim() || undefined,
    disponibilitate: atribute.find((a) => a.nume === "pa_disponibilitate")?.valoare,
    sursaCatalog: dc?.sursaCatalog?.trim() || undefined,
    cifra: cifraDeTitlu(atribute, dc?.capacitateKwh),
    ancora: ancoraVizuala(
      nod.sku?.trim() || "",
      atribute.find((a) => a.nume === "pa_brand")?.valoare,
      parinte?.slug ? (c?.name ?? undefined) : undefined,
      (parinte?.name ?? c?.name) ?? undefined
    ),
    // Categoria de nivel 1 e părintele, dacă există; altfel categoria însăși e
    // deja de nivel 1. Ierarhia are două trepte, deci asta acoperă tot.
    categorie: parinte?.slug
      ? { nume: parinte.name ?? parinte.slug, slug: parinte.slug }
      : c?.slug
        ? { nume: c.name ?? c.slug, slug: c.slug }
        : undefined,
    subcategorie: parinte?.slug && c?.slug ? { nume: c.name ?? c.slug, slug: c.slug } : undefined,
    // Brandul și disponibilitatea au deja locul lor pe pagină — în antet și
    // lângă preț. Repetate în tabel, ar dilua exact ce trebuie să fie dens.
    specificatii: atribute.filter(
      (a) => a.nume !== "pa_brand" && a.nume !== "pa_disponibilitate"
    ),
    statuturi: statuturiDin(nod, atribute),
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   Toate produsele, o singură dată
   ──────────────────────────────────────────────────────────────────────────
   PROBLEMA PE CARE O REZOLVĂ, măsurată, nu presupusă.

   Prima versiune cerea fiecare produs separat, la randarea fișei lui. La build
   asta însemna 172 de cereri, pornite de 9 lucrători în paralel, în câteva zeci
   de secunde. Găzduirea WordPress a cedat: zeci de răspunsuri 500.

   Iar consecința nu era un avertisment, ci pagini greșite. `fetchGraphQL`
   înghite eroarea și întoarce null, `incarcaProdus` întoarce null, fișa cheamă
   `notFound()` — deci produse care există în catalog au fost scrise în build ca
   pagini de 404. Numărate: 88 din 172 la o rulare, adică jumătate din catalog
   dispărut de pe site până la următorul deploy, fără niciun semn.

   Reîncercările din graphql-client ajută la o eroare izolată, dar nu la asta:
   serverul nu pica o clipă, rămânea saturat cât ținea build-ul. Singura soluție
   e să nu-l mai saturăm.

   MEMOIZARE LA NIVEL DE MODUL, nu `cache` din React. Acela ține doar cât o
   cerere, iar aici fiecare fișă e o randare separată. O promisiune păstrată în
   modul trăiește cât procesul lucrătorului, deci toate fișele randate de el
   împart aceleași patru cereri. La 9 lucrători: 36 de cereri în loc de 172.

   Harta se construiește o singură dată chiar dacă o cer zece pagini deodată:
   se păstrează PROMISIUNEA, nu rezultatul, deci apelurile care sosesc în timp
   ce prima încă se rezolvă așteaptă același răspuns, nu pornesc altul.
   ══════════════════════════════════════════════════════════════════════════ */

let hartaProduse: Promise<Map<string, Produs>> | null = null;

async function construiesteHarta(): Promise<Map<string, Produs>> {
  const harta = new Map<string, Produs>();
  let after: string | null = null;

  // 20 de pagini × 50 = 1000 de produse, de șase ori catalogul de acum. Limita
  // e o siguranță împotriva unui cursor care nu avansează, nu un plafon real.
  for (let pagina = 0; pagina < 20; pagina++) {
    const date = await fetchGraphQL(GET_PRODUSE_TOATE_QUERY, { after }, {
      optional: true,
      tags: ["produse"],
    });

    const conexiune = date?.products;
    if (!conexiune) break;

    for (const nod of conexiune.nodes ?? []) {
      const p = mapeaza(nod as NodProdus);
      if (p) harta.set(p.slug, p);
    }

    if (!conexiune.pageInfo?.hasNextPage || !conexiune.pageInfo?.endCursor) break;
    after = conexiune.pageInfo.endCursor as string;
  }

  return harta;
}

function toateProdusele(): Promise<Map<string, Produs>> {
  hartaProduse ??= construiesteHarta();
  return hartaProduse;
}

/**
 * Un produs, după slug.
 *
 * Se caută în harta comună. Dacă lipsește de acolo — un produs adăugat în
 * WooCommerce după ce s-a construit harta, sau unul de peste limita de
 * paginare — se cere individual, ca fișa lui să funcționeze totuși.
 */
export const incarcaProdus = cache(async (slug: string): Promise<Produs | null> => {
  const harta = await toateProdusele();

  for (const candidat of variantePentru(slug)) {
    const p = harta.get(candidat);
    if (p) return p;
  }

  const date = await fetchGraphQL(GET_PRODUS_QUERY, { slug: variantePentru(slug)[0] }, {
    optional: true,
    tags: ["produse"],
  });
  return date?.product ? mapeaza(date.product) : null;
});

/**
 * Formele sub care poate ajunge un slug, ca lookup-ul să nu rateze din cauza
 * codificării.
 *
 * WordPress păstrează în slug caracterele non-ASCII deja procentuale: cablul
 * de 6mm² are slug-ul `cablu-solar-6mm%c2%b2-tambur-500m-negru`. Când Next
 * pune valoarea aia într-o cale de URL, semnul `%` e la rândul lui codificat,
 * iar parametrul rutei ajunge `...%25c2%25b2...` — care nu se potrivește cu
 * nicio cheie din hartă.
 *
 * Concret, la un build: două produse reale scrise ca pagini de 404, cu mesajul
 * „No product ID was found corresponding to the slug". Se încearcă întâi
 * valoarea decodificată, apoi cea primită, fiindcă produsele cu slug curat
 * n-au nevoie de nicio transformare.
 *
 * `decodeURIComponent` poate arunca pe un `%` singuratic dintr-un slug scris
 * de mână; atunci rămâne varianta originală.
 */
function variantePentru(slug: string): string[] {
  try {
    const decodat = decodeURIComponent(slug);
    return decodat === slug ? [slug] : [decodat, slug];
  } catch {
    return [slug];
  }
}

/**
 * Slug-urile tuturor produselor, pentru prerandare la build.
 *
 * Se cer în pagini de câte 100, fiindcă WPGraphQL plafonează orice conexiune
 * acolo — un `first: 200` întoarce tot 100, fără să spună nimic. Prima versiune
 * a prerandat exact 100 din cele 172 de produse, iar restul de 72 ar fi ajuns
 * să se randeze la prima vizită, cu așteptarea de rigoare.
 *
 * Limita de 20 de pagini e o siguranță împotriva unei bucle infinite, dacă
 * vreodată `hasNextPage` rămâne adevărat din cauza unui cursor care nu avansează.
 * La 100 pe pagină înseamnă 2000 de produse — de zece ori catalogul de acum.
 */
export async function sluguriProduse(): Promise<string[]> {
  // Harta e oricum construită la prima fișă randată; refolosită aici,
  // prerandarea nu mai costă nici măcar cele două cereri de slug-uri.
  const harta = await toateProdusele();
  if (harta.size > 0) return [...harta.keys()];

  const sluguri: string[] = [];
  let after: string | null = null;

  for (let pagina = 0; pagina < 20; pagina++) {
    const date = await fetchGraphQL(GET_SLUGURI_PRODUSE_QUERY, { after }, {
      optional: true,
      tags: ["produse"],
    });

    const conexiune = date?.products;
    if (!conexiune) break;

    for (const n of conexiune.nodes ?? []) {
      const slug = (n as { slug?: string | null })?.slug;
      if (typeof slug === "string" && slug.length > 0) sluguri.push(slug);
    }

    if (!conexiune.pageInfo?.hasNextPage || !conexiune.pageInfo?.endCursor) break;
    after = conexiune.pageInfo.endCursor as string;
  }

  return sluguri;
}
