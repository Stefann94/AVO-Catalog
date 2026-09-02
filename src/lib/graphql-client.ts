const WP_GRAPHQL_URL = 'https://www.avogrupinvest.ro/graphql';

/**
 * Endpoint-ul WordPress răspunde în ~4 secunde. Cu `cache: 'no-store'` fiecare
 * vizitator ar aștepta atât, iar paginile n-ar putea fi randate static.
 * Implicit revalidăm o dată pe oră; catalogul se schimbă lunar, deci e amplu.
 *
 * Pentru date care chiar trebuie proaspete, apelează cu `{ revalidate: 0 }`.
 *
 * `{ optional: true }` e pentru interogările care au voie să eșueze: câmpuri
 * expuse de o extensie care poate lipsi din WordPress. Fără el, absența unui
 * câmp opțional tipărește la fiecare build un obiect de erori și o urmă de
 * stivă, adică exact aspectul unui build stricat — deși pagina are o rezervă
 * și se randează corect. Cu el, rămâne un singur rând de avertisment.
 */
const REVALIDARE_IMPLICITA = 3600;

export async function fetchGraphQL(
  query: string,
  variables = {},
  optiuni: { revalidate?: number; optional?: boolean } = {}
) {
  const revalidate = optiuni.revalidate ?? REVALIDARE_IMPLICITA;
  const optional = optiuni.optional ?? false;
  try {
    const res = await fetch(WP_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      ...(revalidate === 0
        ? { cache: 'no-store' as const }
        : { next: { revalidate } }),
    });

    if (!res.ok) {
      console.error(`Network error: ${res.status} ${res.statusText}`);
      throw new Error('Network error during GraphQL fetch');
    }

    const json = await res.json();

    if (json.errors) {
      if (optional) {
        console.warn(
          `GraphQL opțional indisponibil: ${json.errors[0]?.message ?? 'eroare necunoscută'}`
        );
        return null;
      }
      console.error(json.errors);
      throw new Error('Failed to fetch API');
    }

    return json.data;
  } catch (error) {
    if (optional) {
      console.warn(
        `GraphQL opțional indisponibil: ${error instanceof Error ? error.message : error}`
      );
      return null;
    }
    console.error('Error fetching GraphQL:', error);
    return null;
  }
}
