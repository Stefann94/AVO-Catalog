/**
 * Unde stă WordPress-ul.
 *
 * ─── DE CE UN FIȘIER SEPARAT ──────────────────────────────────────────────
 *
 * Până acum, adresa WordPress-ului apărea în două forme independente: o
 * constantă în `graphql-client.ts` pentru interogări, și implicit în fiecare
 * `sourceUrl` venit din răspunsuri, fiindcă WordPress își scrie singur numele
 * de gazdă în adresele pozelor. Cât timp amândouă spuneau
 * `www.avogrupinvest.ro`, nimeni n-avea de ce să observe.
 *
 * Mutarea le desparte. `www.avogrupinvest.ro` devine acest site, iar WordPress
 * rămâne în spate, pe `admin.avogrupinvest.ro`. Din acel moment o poză cerută
 * de la `www` nu mai ajunge la WordPress — ajunge la noi, care n-avem fișierul,
 * deci 404 pe toate imaginile din catalog.
 *
 * ─── CE REZOLVĂ ───────────────────────────────────────────────────────────
 *
 * `GAZDA_WP` se deduce din endpoint, nu se scrie a doua oară: dacă îndrepți
 * aplicația spre WordPress-ul local, și pozele vin de acolo, automat.
 *
 * `urlMedia()` rescrie gazda oricărei adrese de fișier primite din WordPress.
 * Asta o face să funcționeze indiferent ce crede WordPress despre propriul nume
 * — și înainte de mutare, când încă răspunde `www`, și după, când va răspunde
 * `admin`. Nu depindem de o setare din baza de date pe care n-o controlăm de
 * aici.
 */

/**
 * Endpoint-ul GraphQL.
 *
 * Implicit subdomeniul de administrare: e adresa care rămâne valabilă și după
 * ce domeniul principal trece la acest site. Variabila de mediu există ca să
 * poți îndrepta aplicația către WordPress-ul local din tools/wp-local.
 */
export const WP_GRAPHQL_URL =
  process.env.WP_GRAPHQL_URL ?? "https://admin.avogrupinvest.ro/graphql";

/** Gazda WordPress-ului, dedusă din endpoint: `admin.avogrupinvest.ro`. */
export const GAZDA_WP = (() => {
  try {
    return new URL(WP_GRAPHQL_URL).host;
  } catch {
    return "admin.avogrupinvest.ro";
  }
})();

/**
 * Gazdele pe care avem voie să le rescriem.
 *
 * Lista e închisă intenționat. O poză găzduită în altă parte (un CDN, un
 * furnizor) trebuie lăsată exact cum a venit — rescrisă, ar indica un fișier
 * care nu există la noi. Rescriem doar numele sub care poate apărea propriul
 * nostru WordPress.
 */
const GAZDE_PROPRII = new Set([
  "avogrupinvest.ro",
  "www.avogrupinvest.ro",
  "admin.avogrupinvest.ro",
]);

/**
 * Adresa unui fișier din biblioteca media, mutată pe gazda WordPress curentă.
 *
 * Întoarce valoarea neatinsă dacă e goală, relativă, sau de pe altă gazdă.
 */
export function urlMedia(url: string): string;
export function urlMedia(url: string | null | undefined): string | undefined;
export function urlMedia(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const adresa = new URL(url);
    if (!GAZDE_PROPRII.has(adresa.host) || adresa.host === GAZDA_WP) return url;
    adresa.host = GAZDA_WP;
    return adresa.toString();
  } catch {
    // Adresă relativă sau malformată: o lăsăm cum e.
    return url;
  }
}
