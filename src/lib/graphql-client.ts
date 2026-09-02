const WP_GRAPHQL_URL = 'https://www.avogrupinvest.ro/graphql';

export async function fetchGraphQL(query: string, variables = {}) {
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
      // Next.js Cache config
      cache: 'no-store', 
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
