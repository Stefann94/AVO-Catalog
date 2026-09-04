/**
 * Perioada de valabilitate a catalogului.
 *
 * Sursa de adevăr e catalogul, nu ceasul serverului. Importatorul o extrage de
 * pe coperta PDF-ului și o scrie pe fiecare produs ca meta `_perioada_eticheta`,
 * `_valabil_de` și `_valabil_pana` (vezi tools/catalog-import/parse-catalog.js),
 * de unde o citim prin GraphQL.
 *
 * Regula pe care o impune modulul ăsta: eticheta și intervalul vin ÎNTOTDEAUNA
 * din aceeași sursă. Versiunea anterioară lua eticheta din catalog, dar calcula
 * intervalul din `new Date()` — în octombrie pagina ar fi anunțat
 * „Gama de produse Septembrie 2026" lângă „Prețuri valabile 01.10 – 31.10.2026",
 * două afirmații care se contrazic sub ochii clientului.
 *
 * Din același motiv nu mai există o rezervă calculată din data curentă: a
 * inventa luna de pe ceas, când prețurile afișate sunt din alt catalog, e o
 * informație comercială falsă. Dacă nu știm perioada, nu o afirmăm.
 */

import { cache } from "react";
import { fetchGraphQL } from "./graphql-client";
import { GET_PERIOADA_CATALOG_QUERY } from "./queries";

const LUNI = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
] as const;

export type PerioadaCatalog = {
  /** „Septembrie 2026". `null` când nu o putem afla — titlul rămâne fără lună. */
  eticheta: string | null;
  /** „01.09 – 30.09.2026". `null` ascunde ștampila cu prețuri valabile. */
  interval: string | null;
  /**
   * Ultima zi de valabilitate, „30.09.2026".
   *
   * Se cere separat de `interval` fiindcă răspunde la altă întrebare. Pe fișa
   * de produs, lângă preț, contează până CÂND ține prețul, nu din când — cine e
   * pe pagină azi știe deja că a început. Un interval întreg acolo ar cere
   * cititorului să scoată singur data care îl interesează.
   */
  pana: string | null;
  /** De unde a venit valoarea. Util în dezvoltare ca să vezi dacă WooCommerce răspunde. */
  sursa: "woocommerce" | "rezerva" | "necunoscuta";
};

type Zi = { zi: number; luna: number; an: number };

/**
 * „01.09.2026" → { zi: 1, luna: 9, an: 2026 }.
 *
 * Formatul e cel tipărit pe copertă și copiat ca atare de importator. Parsăm
 * componentele manual, nu prin `new Date(text)`: constructorul interpretează
 * șirurile ambiguu de la un motor la altul, iar cele ISO le citește în UTC,
 * ceea ce poate muta ziua cu una în minus.
 */
function parseZi(text?: string | null): Zi | null {
  const m = text?.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const zi = Number(m[1]);
  const luna = Number(m[2]);
  const an = Number(m[3]);
  if (luna < 1 || luna > 12 || zi < 1 || zi > 31) return null;
  return { zi, luna, an };
}

/** „Septembrie 2026" → { luna: 9, an: 2026 }. Acceptă și scrierea fără diacritice. */
function parseEticheta(text?: string | null): { luna: number; an: number } | null {
  const t = text?.trim();
  if (!t) return null;
  const m = t.match(/^(\p{L}+)\s+(\d{4})$/u);
  if (!m) return null;
  const nume = m[1].toLowerCase();
  const index = LUNI.findIndex((l) => l.toLowerCase() === nume);
  return index === -1 ? null : { luna: index + 1, an: Number(m[2]) };
}

const doua = (n: number) => String(n).padStart(2, "0");

/** Ultima zi a lunii. Ziua 0 din luna următoare, deci și anii bisecți ies corect. */
const ultimaZi = (luna: number, an: number) => new Date(an, luna, 0).getDate();

/**
 * „01.09 – 30.09.2026".
 *
 * Anul apare o singură dată, la final, cât timp perioada nu trece dintr-un an
 * în altul. Un catalog valabil 15.12.2026 – 15.01.2027 primește ambii ani,
 * altfel prima dată ar părea din 2027.
 */
function formatInterval(de: Zi, pana: Zi): string {
  const inceput =
    de.an === pana.an
      ? `${doua(de.zi)}.${doua(de.luna)}`
      : `${doua(de.zi)}.${doua(de.luna)}.${de.an}`;
  return `${inceput} – ${doua(pana.zi)}.${doua(pana.luna)}.${pana.an}`;
}

/** Datele brute, așa cum vin din meta produsului în WooCommerce. */
export type PerioadaBruta = {
  eticheta?: string | null;
  valabilDe?: string | null;
  valabilPana?: string | null;
};

/**
 * Compune perioada afișată.
 *
 * `rezerva` e ultimul catalog cunoscut, scris în cod. Se folosește doar cât timp
 * WooCommerce nu răspunde încă cu perioada — la primul import care aduce meta,
 * valoarea din WooCommerce câștigă și rezerva devine inutilă.
 */
export function perioadaCatalog(
  dinWoo?: PerioadaBruta | null,
  rezerva?: PerioadaBruta | null
): PerioadaCatalog {
  const dinWooCompleta = compune(dinWoo);
  if (dinWooCompleta) return { ...dinWooCompleta, sursa: "woocommerce" };

  const dinRezerva = compune(rezerva);
  if (dinRezerva) return { ...dinRezerva, sursa: "rezerva" };

  return { eticheta: null, interval: null, pana: null, sursa: "necunoscuta" };
}

function compune(sursa?: PerioadaBruta | null): Omit<PerioadaCatalog, "sursa"> | null {
  if (!sursa) return null;

  const de = parseZi(sursa.valabilDe);
  const pana = parseZi(sursa.valabilPana);
  const dinEticheta = parseEticheta(sursa.eticheta);

  // Eticheta e preferată ca text, fiind exact cum e tipărită pe copertă. Dacă
  // lipsește, o deducem din luna în care începe valabilitatea.
  const eticheta =
    sursa.eticheta?.trim() ||
    (de ? `${LUNI[de.luna - 1]} ${de.an}` : null);

  if (!eticheta) return null;

  // Intervalul complet, când catalogul îl declară.
  if (de && pana) {
    return { eticheta, interval: formatInterval(de, pana), pana: ziLunga(pana) };
  }

  // Doar eticheta: presupunem luna calendaristică întreagă. E deducția pe care
  // o face și cititorul când vede „Septembrie 2026" pe copertă.
  const luna = dinEticheta ?? (de ? { luna: de.luna, an: de.an } : null);
  if (!luna) return { eticheta, interval: null, pana: null };

  const ultima = { zi: ultimaZi(luna.luna, luna.an), luna: luna.luna, an: luna.an };
  return {
    eticheta,
    interval: formatInterval({ zi: 1, luna: luna.luna, an: luna.an }, ultima),
    pana: ziLunga(ultima),
  };
}

/** „30.09.2026" — data completă, cu an, pentru afirmații de sine stătătoare. */
const ziLunga = (z: Zi) => `${doua(z.zi)}.${doua(z.luna)}.${z.an}`;

/**
 * Ultimul catalog încărcat manual, folosit doar cât timp WooCommerce nu
 * răspunde încă cu perioada — adică până la instalarea extensiei PHP și primul
 * import care aduce meta. După aceea valoarea din WooCommerce câștigă
 * întotdeauna, iar constanta asta nu mai e citită niciodată.
 *
 * Dacă nici WooCommerce, nici rezerva nu dau o perioadă, titlurile rămân fără
 * lună, iar ștampilele cu prețuri valabile dispar. Mai bine fără informație
 * decât cu o lună greșită lângă prețuri din alt catalog.
 */
const REZERVA: PerioadaBruta = {
  eticheta: "Septembrie 2026",
  valabilDe: "01.09.2026",
  valabilPana: "30.09.2026",
};

/**
 * Perioada catalogului, citită o singură dată pe randare.
 *
 * O cer două componente din pagina de start — banda de sub hero și „Gama de
 * produse". Fără `cache`, ar pleca două cereri: Next reunește automat doar
 * apelurile `fetch` de tip GET, iar interogarea noastră GraphQL e POST
 * (verificat în node_modules/next/dist/docs — memoizarea e explicit legată de
 * GET). Documentația trimite la `cache` din React exact pentru cazul ăsta.
 *
 * `optional: true` fiindcă `perioadaCatalog` vine dintr-o extensie WordPress
 * care poate lipsi. Absența ei e o stare prevăzută, cu rezervă, nu o eroare.
 */
export const incarcaPerioadaCatalog = cache(async (): Promise<PerioadaCatalog> => {
  const date = await fetchGraphQL(GET_PERIOADA_CATALOG_QUERY, {}, {
    optional: true,
    tags: ["perioada"],
  });
  return perioadaCatalog(date?.perioadaCatalog, REZERVA);
});
