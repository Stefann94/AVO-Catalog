/**
 * Moneda, citită din magazin.
 *
 * ─── DE CE EXISTĂ ─────────────────────────────────────────────────────────
 *
 * Până acum site-ul avea `€` scris în cod, în cincisprezece locuri, și
 * „Prețuri fără TVA" pe fiecare dală din hero. Pe 1 octombrie magazinul a
 * trecut pe lei, iar prețurile au primit TVA inclus — și toate cele
 * cincisprezece au rămas în urmă. Un panou de 445 de lei s-ar fi afișat
 * „445 €, fără TVA": două afirmații false pe același card.
 *
 * Nu s-a stricat nimic din neatenție. S-a stricat fiindcă o informație care
 * trăiește în baza de date era copiată în cod. Modulul ăsta o aduce înapoi
 * unde îi e locul: se schimbă moneda din WooCommerce → Setări, iar site-ul o
 * ia la următoarea construcție.
 *
 * ─── DE CE FORMATĂM NOI, DACĂ WOOCOMMERCE O FACE DEJA ────────────────────
 *
 * Pentru prețul principal nu formatăm: WooGraphQL întoarce „570,00 lei", gata
 * făcut, și acela se afișează ca atare. Dar o parte din cifrele de pe site nu
 * există în WooCommerce ca preț — prețul la volum e un număr brut dintr-o
 * meta, economia e o scădere, „de la X" e un minim peste o listă. Pe acelea le
 * compunem noi, și trebuie să arate la fel cu celelalte.
 *
 * ─── DE CE LA NIVELUL DATELOR, NU AL COMPONENTELOR ───────────────────────
 *
 * Formatarea se face în `lib/`, unde se încarcă produsele, iar componentele
 * primesc text gata scris. Alternativa — să ducem obiectul de monedă până la
 * fiecare card — ar fi însemnat un parametru în plus prin șase niveluri de
 * componente, pentru o valoare care nu se schimbă niciodată în timpul unei
 * randări. Și ar fi lăsat deschisă exact ușa pe care intrase problema: o
 * componentă care formatează singură, cu altă regulă.
 */

import { cache } from "react";
import { fetchGraphQL } from "./graphql-client";
import { GET_SETARI_MAGAZIN_QUERY } from "./queries";

export type Moneda = {
  /** Codul, „RON". Pentru datele structurate, unde Google cere ISO 4217. */
  cod: string;
  /** Ce se scrie lângă cifră: „lei". */
  simbol: string;
  /** left, right, left_space, right_space — cum le numește WooCommerce. */
  pozitie: string;
  separatorMii: string;
  separatorZecimale: string;
  zecimale: number;
  /** Cota inclusă în preț, în procente. `null` când nu o știm. */
  cotaTva: number | null;
};

/**
 * Ce folosim cât timp extensia PHP nu răspunde.
 *
 * Aceleași valori cu care e configurat magazinul azi. Tiparul e cel din
 * lib/perioada.ts: o constantă ține locul până la primul răspuns, apoi nu mai
 * e citită niciodată.
 *
 * Aici rezerva e mai puțin periculoasă decât acolo: o perioadă greșită e o
 * afirmație comercială falsă, pe când un simbol greșit se vede din prima de
 * oricine deschide pagina.
 */
const REZERVA: Moneda = {
  cod: "RON",
  simbol: "lei",
  pozitie: "right_space",
  separatorMii: ".",
  separatorZecimale: ",",
  zecimale: 2,
  cotaTva: 21,
};

type SetariBrute = {
  moneda?: string | null;
  simbol?: string | null;
  pozitie?: string | null;
  separatorMii?: string | null;
  separatorZecimale?: string | null;
  zecimale?: number | null;
  cotaTva?: number | null;
};

export function monedaDin(brut: SetariBrute | null | undefined): Moneda {
  if (!brut) return REZERVA;
  const text = (v: string | null | undefined, rezerva: string) => {
    const t = (v ?? "").trim();
    return t === "" ? rezerva : t;
  };
  return {
    cod: text(brut.moneda, REZERVA.cod),
    simbol: text(brut.simbol, REZERVA.simbol),
    pozitie: text(brut.pozitie, REZERVA.pozitie),
    // Separatorii pot fi legitim un spațiu, deci nu se trec prin `trim`.
    separatorMii: brut.separatorMii ?? REZERVA.separatorMii,
    separatorZecimale: brut.separatorZecimale ?? REZERVA.separatorZecimale,
    zecimale:
      typeof brut.zecimale === "number" && Number.isFinite(brut.zecimale) && brut.zecimale >= 0
        ? brut.zecimale
        : REZERVA.zecimale,
    cotaTva:
      typeof brut.cotaTva === "number" && Number.isFinite(brut.cotaTva) ? brut.cotaTva : null,
  };
}

/**
 * Cifra, cu separatorii magazinului, fără simbol.
 *
 * ZECIMALELE SE TAIE CÂND SUNT ZERO. WooCommerce e configurat pe două
 * zecimale, iar 134 din cele 135 de prețuri sunt numere întregi: „445,00 lei"
 * pe un card ar ocupa trei caractere ca să spună nimic. Unde există bani —
 * „54,76" — se păstrează.
 */
function cifra(n: number, m: Moneda): string {
  const rotunjit = Math.round(n * 10 ** m.zecimale) / 10 ** m.zecimale;
  const zecimale = Number.isInteger(rotunjit) ? 0 : m.zecimale;
  const [intreg, fractie = ""] = Math.abs(rotunjit).toFixed(zecimale).split(".");
  const cuMii = intreg.replace(/\B(?=(\d{3})+(?!\d))/g, m.separatorMii);
  const semn = rotunjit < 0 ? "-" : "";
  return fractie ? `${semn}${cuMii}${m.separatorZecimale}${fractie}` : `${semn}${cuMii}`;
}

/** „445 lei" — cifra plus simbolul, așezat cum zice magazinul. */
export function bani(n: number, m: Moneda): string {
  const c = cifra(n, m);
  switch (m.pozitie) {
    case "left":        return `${m.simbol}${c}`;
    case "left_space":  return `${m.simbol} ${c}`;
    case "right":       return `${c}${m.simbol}`;
    default:            return `${c} ${m.simbol}`;
  }
}

/**
 * Prețul venit gata formatat din WooCommerce, curățat.
 *
 * WooGraphQL întoarce „570,00&nbsp;lei" — cu spațiu neîntrerupt, ca prețul să
 * nu se rupă la capăt de rând, și cu zecimalele mereu scrise. Păstrăm spațiul
 * neîntrerupt, fiindcă are rost, dar tăiem „,00" din același motiv ca mai sus.
 *
 * Întoarce `null` pentru produsele fără preț — cele 24 care intră „la cerere".
 */
export function dinWoo(text: string | null | undefined, m: Moneda): string | null {
  const t = (text ?? "").replace(/&nbsp;/g, " ").trim();
  if (!t) return null;
  const zero = `${m.separatorZecimale}${"0".repeat(m.zecimale)}`;
  return m.zecimale > 0 ? t.replace(zero, "") : t;
}

/** Numărul din spatele prețului formatat, pentru sortări și scăderi. */
export function numarDin(text: string | null | undefined, m: Moneda): number | null {
  const t = (text ?? "").replace(/&nbsp;/g, " ");
  const curat = t
    .replace(new RegExp(`\\${m.separatorMii}`, "g"), "")
    .replace(m.separatorZecimale, ".")
    .replace(/[^\d.-]/g, "");
  const n = Number.parseFloat(curat);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Moneda magazinului, citită o singură dată pe randare.
 *
 * `cache` din același motiv ca la perioadă: o cer mai multe module, iar Next
 * nu reunește cererile POST. `optional: true` fiindcă vine dintr-o extensie
 * WordPress care poate lipsi — absența ei e o stare prevăzută, cu rezervă.
 */
export const incarcaMoneda = cache(async (): Promise<Moneda> => {
  const date = await fetchGraphQL(GET_SETARI_MAGAZIN_QUERY, {}, {
    optional: true,
    tags: ["moneda"],
  });
  return monedaDin(date?.setariMagazinAvo);
});
