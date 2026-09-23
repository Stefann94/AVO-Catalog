/**
 * Identitatea site-ului, într-un singur loc.
 *
 * ─── DE CE EXISTĂ ─────────────────────────────────────────────────────────
 *
 * Adresa publică apare în cinci locuri care trebuie să spună același lucru:
 * `metadataBase`, canonical-ul fiecărei pagini, sitemap.xml, robots.txt și
 * datele structurate. Scrisă de cinci ori, s-ar desincroniza la prima mutare
 * de domeniu — exact mutarea care se pregătește (vercel.app → domeniu .ro).
 *
 * Se schimbă dintr-o singură variabilă de mediu, `NEXT_PUBLIC_SITE_URL`, pusă
 * în Vercel. Fără ea, rămâne adresa de test.
 *
 * ─── DE CE CONTEAZĂ PENTRU GOOGLE ─────────────────────────────────────────
 *
 * Canonical-ul trebuie să fie ABSOLUT și să indice exact adresa pe care vrem
 * s-o vadă indexată. Dacă rămâne adresa veche după mutare, Google continuă să
 * trimită lumea pe domeniul vechi.
 */

/** Adresa publică, fără slash la final. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://avo-catalog.vercel.app"
).replace(/\/+$/, "");

export const NUME_SITE = "Avo Grup Invest";

/**
 * Datele firmei folosite în datele structurate (Organization).
 *
 * Doar ce e public și verificabil pe site. CUI-ul și registrul comerțului
 * lipsesc intenționat: nu le avem completate nicăieri în proiect, iar Google
 * preferă un câmp absent unuia greșit.
 */
export const FIRMA = {
  nume: NUME_SITE,
  descriere:
    "Distribuitor de echipamente fotovoltaice pentru instalatori și revânzători: panouri, invertoare, sisteme de stocare și structuri de montaj.",
  adresa: {
    strada: "Str. Nordului 8A",
    oras: "Piatra-Neamț",
    judet: "Neamț",
    tara: "RO",
  },
  telefon: "+40721233544",
  email: "contact@avogrupinvest.ro",
} as const;

/** Adresa absolută a unei căi interne: `/catalog` → `https://…/catalog`. */
export const urlAbsolut = (cale: string) =>
  `${SITE_URL}${cale.startsWith("/") ? cale : `/${cale}`}`;
