#!/usr/bin/env node
/**
 * Generează o pagină cu produsele fără poză, cu linkuri de căutare per marcă.
 *
 *   node lista-poze-lipsa.js
 *
 * Scrie `poze-lipsa.html` în rădăcina proiectului. Se deschide în browser,
 * se dă clic pe linkul fiecărui produs, se salvează imaginea potrivită.
 *
 * ─── DE CE O PAGINĂ, ȘI NU ÎNCĂ O UNEALTĂ AUTOMATĂ ───────────────────────
 *
 * Fiindcă patru unelte automate au adus 61 de fotografii și s-au oprit exact
 * aici. Pe solarone.ro verificarea era solidă: magazinul scrie codul de produs
 * în datele structurate ale paginii, deci potrivirea se putea confirma
 * mecanic. Pe site-urile de producători nu există echivalent, iar rezultatul a
 * fost patru greșeli din nouă încercări — trei produse Deye care au primit
 * același banner de marketing, și un acumulator Pytes care a primit fotografia
 * unei stații portabile dintr-un carusel de produse înrudite.
 *
 * Toate patru au fost prinse uitându-mă la imagini. Adică exact munca pe care
 * automatizarea trebuia s-o evite. Pe un catalog B2B fotografia e verificarea
 * specificației: o poză greșită e mai rea decât una lipsă, fiindcă cine se
 * bazează pe ea comandă altceva.
 *
 * Deci ce a rămas de făcut cere un ochi, nu o regulă. Pagina asta scurtează
 * partea plictisitoare — găsitul — și lasă omului doar alegerea.
 *
 * ─── DE CE CĂUTARE DE IMAGINI, RESTRÂNSĂ LA DOMENIU ──────────────────────
 *
 * Un link direct către pagina produsului ar fi mai comod, dar nu-l am pentru
 * toate: unele site-uri sunt aplicații JavaScript, altele răspund 403, iar
 * structura lor se schimbă. Căutarea de imagini restrânsă la domeniul
 * producătorului dă miniaturi — se vede din prima care e produsul corect,
 * fără să deschizi nimic.
 */

const fs = require('fs');
const path = require('path');

const GRAPHQL = 'https://www.avogrupinvest.ro/graphql';
const UA = { 'User-Agent': 'Mozilla/5.0' };
const IESIRE = path.resolve(__dirname, '../../poze-lipsa.html');

/** Marca → domeniul oficial pe care se caută. */
const DOMENII = {
  'Deye': 'deyeinverter.com',
  'Pytes': 'pytesess.com',
  'K2 Systems': 'k2-systems.com',
  'Growatt': 'en.growatt.com',
  'Felicity': 'felicitysolar.com',
  'Staubli': 'staubli.com',
  'Jinko Solar': 'jinkosolar.com',
  'Dyness': 'dyness-tech.com',
  'Canadian Solar': 'csisolar.com',
  'Aiko Solar': 'aikosolar.com',
  'Tongwei Solar': 'tongwei.cn',
};

const Q = `query($after: String) {
  products(first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { ... on SimpleProduct {
      sku name image { sourceUrl }
      attributes { nodes { name ... on GlobalProductAttribute { terms(first: 1) { nodes { name } } } } }
      productCategories(first: 2) { nodes { name parent { node { name } } } }
    } }
  }
}`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function main() {
  let after = null;
  const toate = [];
  do {
    const r = await fetch(GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...UA },
      body: JSON.stringify({ query: Q, variables: { after } }),
    });
    const j = await r.json();
    if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 200));
    const p = j.data.products;
    toate.push(...p.nodes.filter((n) => n?.sku));
    after = p.pageInfo.hasNextPage ? p.pageInfo.endCursor : null;
  } while (after);

  const marca = (n) => n.attributes?.nodes?.find((x) => x?.name === 'pa_brand')?.terms?.nodes?.[0]?.name?.trim() || '';
  const categorie = (n) => {
    const c = n.productCategories?.nodes?.[0];
    return c?.parent?.node?.name || c?.name || '';
  };

  const lipsa = toate.filter((n) => !n.image).map((n) => ({
    sku: n.sku, nume: n.name, marca: marca(n), categorie: categorie(n),
  }));

  // Ansamblurile n-au fotografie oficială nicăieri: nu sunt produse de
  // producător, ci combinații definite de catalogul lunar.
  const esteAnsamblu = (p) => /^PACHET-|^SISTEM-DE-MONTAJ-PENTRU/.test(p.sku);

  lipsa.sort((a, b) => (a.marca || 'zz').localeCompare(b.marca || 'zz') || a.sku.localeCompare(b.sku));

  const rand = (p, i) => {
    const dom = DOMENII[p.marca];
    const termen = encodeURIComponent(`${dom ? `site:${dom} ` : ''}${p.sku}`);
    const linkImagini = `https://www.google.com/search?tbm=isch&q=${termen}`;
    const linkLarg = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${p.marca} ${p.sku}`)}`;
    return `<tr${esteAnsamblu(p) ? ' class="ansamblu"' : ''}>
      <td class="nr">${i + 1}</td>
      <td><code>${esc(p.sku)}</code><div class="nume">${esc(p.nume)}</div></td>
      <td class="marca">${esc(p.marca || '—')}<div class="cat">${esc(p.categorie)}</div></td>
      <td class="fisier"><code>${esc(p.sku)}.webp</code></td>
      <td class="link">
        ${dom ? `<a href="${linkImagini}" target="_blank" rel="noreferrer">pe ${esc(dom)}</a><br>` : ''}
        <a href="${linkLarg}" target="_blank" rel="noreferrer" class="larg">căutare largă</a>
      </td>
    </tr>`;
  };

  const html = `<!doctype html>
<html lang="ro"><head><meta charset="utf-8">
<title>Poze lipsă — ${lipsa.length} produse</title>
<style>
  body{font:14px/1.5 system-ui,sans-serif;margin:0;padding:32px;color:#101828;background:#F8F9FA}
  h1{font-size:24px;margin:0 0 4px}
  .sub{color:#6A7282;margin:0 0 24px}
  table{border-collapse:collapse;width:100%;max-width:1100px;background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden}
  th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6A7282;padding:10px 12px;border-bottom:1px solid #E5E7EB;background:#F8F9FA}
  td{padding:10px 12px;border-bottom:1px solid #F3F4F6;vertical-align:top}
  tr:last-child td{border-bottom:0}
  code{font:12px ui-monospace,monospace;background:#F3F4F6;padding:1px 5px;border-radius:4px}
  .nr{color:#99A1AF;font-size:12px;width:32px}
  .nume{color:#6A7282;font-size:12px;margin-top:3px}
  .marca{font-weight:600;white-space:nowrap}
  .cat{font-weight:400;color:#6A7282;font-size:11px;margin-top:3px}
  .fisier code{background:#EFF6FF;color:#004a99}
  .link a{color:#004a99;font-weight:600;text-decoration:none;font-size:12px}
  .link a:hover{text-decoration:underline}
  .link a.larg{color:#6A7282;font-weight:400}
  tr.ansamblu{background:#FFFBEB}
  tr.ansamblu .fisier code{background:#FEF3C7;color:#92400E}
  .nota{max-width:1100px;margin:24px 0 0;padding:16px;background:#fff;border:1px solid #E5E7EB;border-radius:12px;color:#4A5565}
  .nota b{color:#101828}
</style></head><body>
<h1>${lipsa.length} produse fără fotografie</h1>
<p class="sub">Generat ${new Date().toLocaleString('ro-RO')} · ${toate.length - lipsa.length} din ${toate.length} au deja poză</p>
<table>
<tr><th>#</th><th>produs</th><th>marcă</th><th>salvează ca</th><th>caută</th></tr>
${lipsa.map(rand).join('\n')}
</table>
<div class="nota">
  <p><b>Cum se folosește.</b> Clic pe „pe &lt;domeniu&gt;" — se deschide căutarea de imagini
  restrânsă la site-ul producătorului. Alegi fotografia produsului, clic dreapta → Salvează imaginea,
  cu <b>exact numele din coloana „salvează ca"</b>. Toate în același folder.</p>
  <p><b>Rândurile galbene sunt ansambluri</b> — pachete și combinații definite de catalogul lunar,
  care nu există ca produs la niciun producător. Pentru ele nu căuta: folosește fotografia
  componentei principale, pe care o avem deja.</p>
  <p><b>Extensia nu contează</b> — .webp, .jpg sau .png merg toate. Contează numele, care trebuie
  să fie SKU-ul exact: pe el se face legarea de produs.</p>
</div>
</body></html>`;

  fs.writeFileSync(IESIRE, html);
  console.log(`${lipsa.length} produse fără poză`);
  console.log(`din care ansambluri (fără sursă oficială): ${lipsa.filter(esteAnsamblu).length}`);
  console.log(`\nscris: ${IESIRE}`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exitCode = 1; });
