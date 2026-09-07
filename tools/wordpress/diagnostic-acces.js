/**
 * Ce s-a întâmplat, când o cerere autentificată e refuzată.
 *
 * Există fiindcă mesajul evident — „verifică utilizatorul și parola" — e cel
 * mai des GREȘIT, iar cine îl crede pierde o oră regenerând parole de aplicație
 * care funcționează perfect.
 *
 * Cazul real, întâlnit pe găzduirea acestui site: LiteSpeed răspunde 503 cu o
 * pagină HTML la ORICE cerere care poartă antetul `Authorization: Basic`,
 * indiferent de conținutul lui. Probat: `Basic YTpi` — patru caractere, evident
 * false — dă tot 503, în timp ce `Bearer abc123` sau un antet inventat cu
 * exact aceeași valoare trec cu 200. Deci nu e vorba de credențiale: cererea e
 * oprită de web-server înainte să ajungă la PHP.
 *
 * Semnul din WordPress e că parola de aplicație are „Last Used" gol: n-a ajuns
 * niciodată la el ca s-o poată marca folosită.
 *
 * Deosebirea se face cu o singură cerere în plus: aceeași rută, fără antetul de
 * autentificare. Dacă ACEEA răspunde curat, ruta e sănătoasă și problema e
 * antetul; dacă pică și ea, chiar e ceva cu serverul sau cu adresa.
 */

/**
 * @param {string} urlWp   adresa site-ului, fără „/" la final
 * @param {Error}  eroare  eroarea aruncată de cererea autentificată
 * @returns {Promise<string[]>} rânduri de tipărit, de la cauză spre soluție
 */
async function explicaEsecDeAcces(urlWp, eroare) {
  const randuri = [`Nu pot ajunge la WooCommerce: ${eroare.message}`, ''];

  let faraAuth = null;
  try {
    const r = await fetch(`${urlWp}/wp-json/`);
    faraAuth = {
      stare: r.status,
      json: (r.headers.get('content-type') || '').includes('json'),
    };
  } catch {
    /* Dacă nici asta nu merge, rămâne diagnosticul general de mai jos. */
  }

  const parePaginaDeFirewall =
    /răspuns HTML/.test(eroare.message) || eroare.status === 503 || eroare.status === 403;

  if (parePaginaDeFirewall && faraAuth && faraAuth.stare === 200 && faraAuth.json) {
    randuri.push(
      'CAUZA: nu credențialele. Aceeași rută răspunde corect FĂRĂ antetul de',
      'autentificare, și e refuzată doar când îl poartă. Serverul (LiteSpeed sau',
      'un mod_security) blochează `Authorization: Basic` înainte de WordPress.',
      '',
      'Se vede și din WordPress: parola de aplicație are „Last Used" gol, fiindcă',
      'nicio cerere n-a ajuns vreodată la el.',
      '',
      'CE SE FACE: un mesaj către găzduire —',
      '',
      '   „Pe domeniul <domeniu>, orice cerere către /wp-json/ care poartă antetul',
      '    Authorization: Basic primește 503 de la LiteSpeed. Aceleași cereri fără',
      '    antet merg. Vă rog să scoateți regula pentru acest domeniu — folosim',
      '    Application Passwords din WordPress, care merg doar prin Basic."',
      '',
      'Regenerarea parolei de aplicație NU ajută: e blocat antetul, nu parola.',
    );
    return randuri;
  }

  if (faraAuth && faraAuth.stare === 200 && faraAuth.json) {
    randuri.push(
      'Ruta REST e sănătoasă fără autentificare, deci adresa e bună.',
      'Verifică utilizatorul și parola de aplicație, și că utilizatorul e',
      'Administrator sau Manager magazin.',
    );
  } else {
    randuri.push(
      'Nici ruta REST fără autentificare nu răspunde cum trebuie.',
      'Verifică WP_URL, și dacă REST API-ul nu e dezactivat de un plugin de',
      'securitate sau de modul de mentenanță.',
    );
  }
  return randuri;
}

module.exports = { explicaEsecDeAcces };
