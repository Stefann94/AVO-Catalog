const WP_GRAPHQL_URL = 'https://www.avogrupinvest.ro/graphql';

/**
 * Endpoint-ul WordPress răspunde în ~4 secunde. Cu `cache: 'no-store'` fiecare
 * vizitator ar aștepta atât, iar paginile n-ar putea fi randate static.
 * Implicit revalidăm o dată pe oră; catalogul se schimbă lunar, deci e amplu.
 *
 * Pentru date care chiar trebuie proaspete, apelează cu `{ revalidate: 0 }`.
 */
const REVALIDARE_IMPLICITA = 3600;

export async function fetchGraphQL(
  query: string,
  variables = {},
  optiuni: { revalidate?: number } = {}
) {
  const revalidate = optiuni.revalidate ?? REVALIDARE_IMPLICITA;
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
      console.error(json.errors);
      throw new Error('Failed to fetch API');
    }

    return json.data;
  } catch (error) {
    console.error('Error fetching GraphQL:', error);
    return null;
  }
}
