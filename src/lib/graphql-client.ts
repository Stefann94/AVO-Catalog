/**
 * Endpoint-ul GraphQL.
 *
 * Adresa productiei e valoarea implicita, ca aplicatia sa functioneze fara nicio
 * configurare. Variabila de mediu exista ca sa poti indrepta aplicatia catre
 * WordPress-ul local din tools/wp-local, unde poti testa importul si
 * modificarile de plugin fara sa atingi magazinul viu.
 */
const WP_GRAPHQL_URL =
  process.env.WP_GRAPHQL_URL ?? 'https://www.avogrupinvest.ro/graphql';

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

/**
 * Eticheta pusă pe orice răspuns venit din WordPress.
 *
 * Ea e ce permite webhook-ului să golească exact datele venite de acolo, fără
 * să atingă restul cache-ului. Fără etichete, singura opțiune ar fi să aștepți
 * expirarea celor 3600 de secunde: un coleg schimbă un preț, dă refresh, nu
 * vede nimic, schimbă din nou și te sună.
 *
 * Apelurile pot adăuga etichete mai fine (`produse`, `perioada`) ca să poată fi
 * invalidate separat.
 */
export const ETICHETA_WP = 'wp';

/**
 * Cererea propriu-zisă, cu reîncercări la erorile trecătoare de server.
 *
 * ─── DE CE E NEVOIE ───────────────────────────────────────────────────────
 *
 * Un build complet interoghează WordPress-ul de peste 180 de ori în câteva
 * zeci de secunde: 172 de fișe de produs, 27 de pagini de categorie, plus
 * pagina de start. La volumul ăsta, o găzduire obișnuită întoarce din când în
 * când un 500, iar firewall-ul poate limita ritmul. S-a întâmplat: un build a
 * primit „500 Internal Server Error" la mijloc, deși endpoint-ul era sănătos
 * și înainte, și imediat după.
 *
 * CONSECINȚA ERA GRAVĂ, nu doar un avertisment. `fetchGraphQL` înghite eroarea
 * și întoarce null, `incarcaProdus` întoarce null, iar fișa de produs cheamă
 * `notFound()`. Adică un produs care există în catalog ar fi fost scris în
 * build ca pagină de 404 — permanent, până la următorul deploy, fără ca nimeni
 * să observe.
 *
 * ─── CE SE REÎNCEARCĂ ─────────────────────────────────────────────────────
 *
 * Doar erorile de rețea și codurile 5xx, adică cele care trec de la sine. Un
 * 404 sau un 403 înseamnă că e ceva greșit la noi — adresă schimbată, cerere
 * blocată de firewall — și n-are rost repetat: a doua încercare ar da același
 * răspuns, doar mai târziu.
 *
 * Pauzele cresc — 300ms, 900ms — ca a doua încercare să nu cadă exact în
 * aceeași secundă aglomerată care a produs prima eroare.
 */
const REINCERCARI = 2;

async function cereCuReincercari(
  query: string,
  variables: object,
  revalidate: number,
  tags: string[]
): Promise<Response> {
  let ultimaEroare: unknown;

  for (let incercare = 0; incercare <= REINCERCARI; incercare++) {
    if (incercare > 0) {
      await new Promise((r) => setTimeout(r, 300 * 3 ** (incercare - 1)));
    }

    try {
      const res = await fetch(WP_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
        ...(revalidate === 0
          ? { cache: 'no-store' as const }
          : { next: { revalidate, tags } }),
      });

      if (res.ok) return res;

      // Sub 500 e o problemă de-a noastră, nu a serverului: nu se repetă.
      if (res.status < 500) {
        console.error(`Network error: ${res.status} ${res.statusText}`);
        throw new Error('Network error during GraphQL fetch');
      }

      ultimaEroare = new Error(`Network error: ${res.status} ${res.statusText}`);
      console.warn(
        `WordPress a răspuns ${res.status}; reîncercare ${incercare + 1} din ${REINCERCARI}.`
      );
    } catch (e) {
      // O eroare aruncată de noi pentru un cod sub 500 nu se reîncearcă.
      if (e instanceof Error && e.message === 'Network error during GraphQL fetch') throw e;
      ultimaEroare = e;
      if (incercare < REINCERCARI) {
        console.warn(
          `Cererea către WordPress a eșuat; reîncercare ${incercare + 1} din ${REINCERCARI}.`
        );
      }
    }
  }

  throw ultimaEroare instanceof Error
    ? ultimaEroare
    : new Error('Network error during GraphQL fetch');
}

export async function fetchGraphQL(
  query: string,
  variables = {},
  optiuni: { revalidate?: number; optional?: boolean; tags?: string[] } = {}
) {
  const revalidate = optiuni.revalidate ?? REVALIDARE_IMPLICITA;
  const optional = optiuni.optional ?? false;
  const tags = [ETICHETA_WP, ...(optiuni.tags ?? [])];
  try {
    const res = await cereCuReincercari(query, variables, revalidate, tags);

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
