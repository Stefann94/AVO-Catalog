import { WP_GRAPHQL_URL } from './wordpress';

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
 *
 * ATENȚIE: `optional` acoperă DOAR erorile din răspunsul GraphQL (câmp
 * inexistent, extensie lipsă). O eroare de rețea sau un 5xx se aruncă
 * întotdeauna, chiar și pentru interogările opționale — vezi comentariul lung
 * de la `fetchGraphQL`.
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
/**
 * Patru reîncercări, cu pauze de 0,3 · 0,9 · 2,7 · 8,1 secunde.
 *
 * Măsurat pe găzduirea actuală: fiecare interogare merge singură în 0,7–2 s,
 * inclusiv cele grele, și rezistă la patru cereri simultane. Erorile 500 apar
 * doar când build-ul trimite multe cereri grele în același timp și se atinge
 * limita de procese a găzduirii partajate — o stare care trece în câteva
 * secunde.
 *
 * Pauza care contează e ultima: opt secunde sunt suficiente ca valul să
 * treacă. Cu două reîncercări (0,3 și 0,9 s) se renunța încă în plin vârf, iar
 * build-ul se oprea — ceea ce, de când erorile nu mai sunt înghițite, chiar
 * oprește publicarea.
 */
const REINCERCARI = 4;

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

/**
 * ─── DE CE O EROARE DE REȚEA SE ARUNCĂ, NU SE ÎNGHITE ─────────────────────
 *
 * Varianta veche întorcea `null` la ORICE eșec, inclusiv la un 500 rămas după
 * toate reîncercările. Consecința, măsurată: într-un build în care găzduirea
 * WordPress a cedat, `incarcaProdus` a primit null pentru fiecare produs,
 * fișele au chemat `notFound()`, iar toate cele 172 de pagini au fost scrise
 * ca „produs negăsit". Un site fără niciun produs, publicat fără nicio eroare
 * în jurnalul de build.
 *
 * Alegerea corectă între „publicăm pagini goale" și „nu publicăm" e a doua:
 *   - la build, excepția oprește build-ul, iar Vercel păstrează versiunea
 *     anterioară, cea bună;
 *   - la revalidare, Next păstrează pagina deja generată și reîncearcă mai
 *     târziu, deci vizitatorul vede conținut puțin mai vechi, nu unul gol.
 *
 * Diferența față de `optional`: acolo e vorba de un CÂMP care lipsește din
 * schemă, adică o stare cunoscută și așteptată, cu rezervă în pagină. Aici e
 * vorba de „nu știm nimic despre produse", ceea ce nu se poate desena.
 */
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
    // Aici ajung doar eșecurile de transport (rețea, 4xx, 5xx după reîncercări)
    // și răspunsurile care nu se pot citi ca JSON. Nu se înghit niciodată.
    console.error('Error fetching GraphQL:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}
