import { fetchGraphQL } from "./graphql-client";

/**
 * Adună toate nodurile unei conexiuni GraphQL, pagină cu pagină.
 *
 * ─── DE CE E NEVOIE ───────────────────────────────────────────────────────
 *
 * WPGraphQL plafonează ORICE conexiune la 100 de noduri și taie tăcut: un
 * `first: 200` întoarce tot 100, fără eroare și fără avertisment. Consecințele
 * erau reale și greu de observat:
 *
 *   - ofertele și lichidarea se calculau pe primele 100 din cele 172 de
 *     produse, deci un produs cu reducere din a doua sută nu apărea nicăieri;
 *   - grila de pe /catalog cerea 50 și arăta 50;
 *   - pagina de categorie cerea 48, iar „Sisteme de Montaj", cu 51 de produse,
 *     ascundea 3.
 *
 * La 400 de produse, cât are catalogul complet al magazinului, problema se
 * dublează. De aceea nicio interogare de listă nu mai are plafon fix.
 *
 * ─── CUM FUNCȚIONEAZĂ ─────────────────────────────────────────────────────
 *
 * Interogarea primește `$after` și cere `pageInfo { hasNextPage endCursor }`.
 * Bucla continuă până când WordPress spune că nu mai are. `maxPagini` e o
 * siguranță împotriva unui cursor care nu avansează (buclă infinită), nu un
 * plafon real: 20 × 100 = 2000 de produse.
 */
export async function adunaTot<T>(
  query: string,
  variabile: Record<string, unknown>,
  optiuni: { optional?: boolean; tags?: string[] },
  /** Scoate conexiunea din răspuns: `(d) => d?.products`. */
  conexiuneaDin: (date: unknown) => Conexiune<T> | null | undefined,
  maxPagini = 20,
): Promise<T[]> {
  const toate: T[] = [];
  let after: string | null = null;

  for (let pagina = 0; pagina < maxPagini; pagina++) {
    const date = await fetchGraphQL(query, { ...variabile, after }, optiuni);
    const conexiune = conexiuneaDin(date);
    if (!conexiune) break;

    toate.push(...(conexiune.nodes ?? []));

    if (!conexiune.pageInfo?.hasNextPage || !conexiune.pageInfo?.endCursor) break;
    after = conexiune.pageInfo.endCursor;
  }

  return toate;
}

export type Conexiune<T> = {
  nodes?: T[] | null;
  pageInfo?: { hasNextPage?: boolean | null; endCursor?: string | null } | null;
};
