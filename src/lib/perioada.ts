const LUNI = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
] as const;

/** "Septembrie 2026" din orice dată. */
export function etichetaLuna(d: Date = new Date()): string {
  return `${LUNI[d.getMonth()]} ${d.getFullYear()}`;
}

/** "01.09 – 30.09.2026" — prima și ultima zi a lunii date. */
export function intervalLuna(d: Date = new Date()): string {
  const an = d.getFullYear();
  const luna = d.getMonth();
  const ultima = new Date(an, luna + 1, 0).getDate();
  const ll = String(luna + 1).padStart(2, "0");
  return `01.${ll} – ${ultima}.${ll}.${an}`;
}

/**
 * Eticheta afișată în titlu.
 *
 * Sursa de adevăr e perioada CATALOGULUI, nu ceasul serverului: importatorul o
 * extrage de pe copertă în meta `_perioada_eticheta`. Dacă am folosi doar data
 * curentă, în decembrie titlul ar anunța "Decembrie 2026" în timp ce prețurile
 * afișate ar fi încă din catalogul pe septembrie — adică o minciună comercială.
 *
 * Data calendaristică rămâne doar ca rezervă, până conectăm GraphQL-ul.
 */
export function perioadaCatalog(dinCatalog?: string | null) {
  const acum = new Date();
  return {
    eticheta: dinCatalog?.trim() || etichetaLuna(acum),
    interval: intervalLuna(acum),
    dinCatalog: Boolean(dinCatalog?.trim()),
  };
}
