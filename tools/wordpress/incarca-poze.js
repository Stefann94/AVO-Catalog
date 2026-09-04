#!/usr/bin/env node
/**
 * Încarcă pozele de produs în WooCommerce și le leagă de produse.
 *
 *   node incarca-poze.js [--dry-run] [--limit N] [--dir ../../poze-produse]
 *
 * Credențialele se dau prin variabile de mediu:
 *
 *   WP_URL=https://www.avogrupinvest.ro
 *   WP_USER=<utilizator WordPress cu drept de încărcare>
 *   WP_APP_PASSWORD=<parolă de aplicație, cu spații cu tot>
 *
 * Parola de aplicație se face în WordPress la Utilizatori → Profil →
 * „Application Passwords". NU e parola de logare, și se poate revoca separat
 * fără să schimbi nimic altceva.
 *
 * ─── DE CE PRIN REST, NU PRIN IMPORT CSV ──────────────────────────────────
 *
 * Importatorul lunar de catalog (tools/catalog-import) NU scrie coloana
 * `Images`. Asta e deliberat și e proprietatea pe care se sprijină tot
 * mecanismul: o poză pusă o dată în biblioteca media rămâne legată de produs
 * peste toate reimporturile următoare. Dacă pozele ar veni prin CSV, fiecare
 * import le-ar rescrie — și ar trebui să ai tot setul, în fiecare lună.
 *
 * Deci pozele se pun O SINGURĂ DATĂ, pe alt drum decât prețurile. Ăsta e drumul.
 *
 * ─── CE FACE, PAS CU PAS ──────────────────────────────────────────────────
 *
 *   1. citește fișierele din directorul de poze; numele fără extensie E SKU-ul
 *   2. caută produsul după SKU în WooCommerce
 *   3. dacă produsul are deja imagine, îl SARE (vezi mai jos)
 *   4. urcă fișierul în biblioteca media, cu titlu și `alt` din denumirea reală
 *   5. îl pune ca imagine principală a produsului
 *
 * NU SUPRASCRIE NIMIC. Un produs care are deja poză e lăsat în pace, iar la
 * final scrie câte au fost sărite. Pozele astea sunt un punct de plecare de
 * calitate modestă (vezi RAPORT-POZE.md); când vine una mai bună de la
 * producător, o pui de mână și rulările următoare n-o vor mai atinge.
 * Pentru înlocuire deliberată există `--forteaza`.
 *
 * ─── DE CE MERGE ÎNCET, INTENȚIONAT ───────────────────────────────────────
 *
 * O pauză între cereri. Fiecare poză înseamnă o încărcare plus două cereri
 * REST, iar WordPress generează la fiecare încărcare încă cinci-șase miniaturi.
 * Pe o găzduire obișnuită, 79 de încărcări în rafală arată exact ca un atac și
 * pot fi tăiate de firewall la jumătate — adică ai rămâne cu jumătate din
 * produse cu poză și fără să știi care.
 */

const fs = require('fs');
const path = require('path');

const arg = (nume, implicit) => {
  const i = process.argv.indexOf(nume);
  return i > -1 ? process.argv[i + 1] : implicit;
};
const are = (nume) => process.argv.includes(nume);

const URL_WP = (process.env.WP_URL || '').replace(/\/+$/, '');
const USER = process.env.WP_USER || '';
const PAROLA = process.env.WP_APP_PASSWORD || '';
const DIR = path.resolve(__dirname, arg('--dir', '../../poze-produse'));
const LIMITA = Number(arg('--limit', '0')) || Infinity;
const PROBA = are('--dry-run');
const FORTEAZA = are('--forteaza');
const PAUZA = Number(arg('--pauza', '900'));

if (!URL_WP || !USER || !PAROLA) {
  console.error('Lipsesc WP_URL, WP_USER sau WP_APP_PASSWORD. Vezi comentariul din capul fișierului.');
  process.exit(1);
}

/** Basic auth peste HTTPS. Parola de aplicație se trimite ca atare, cu spații. */
const AUTH = 'Basic ' + Buffer.from(`${USER}:${PAROLA}`).toString('base64');
const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

async function cere(cale, optiuni = {}) {
  const r = await fetch(`${URL_WP}${cale}`, {
    ...optiuni,
    headers: { Authorization: AUTH, ...(optiuni.headers || {}) },
  });
  const text = await r.text();
  let corp;
  try { corp = JSON.parse(text); } catch { corp = text; }
  if (!r.ok) {
    const mesaj = corp && corp.message ? corp.message : String(corp).slice(0, 200);
    throw new Error(`${r.status} ${cale.split('?')[0]} — ${mesaj}`);
  }
  return corp;
}

/** Tipul MIME după extensie. WordPress refuză încărcarea fără el. */
const MIME = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

async function main() {
  const fisiere = fs.readdirSync(DIR).filter((f) => MIME[path.extname(f).toLowerCase()]);
  console.log(`${fisiere.length} fișiere în ${DIR}`);
  if (PROBA) console.log('MOD PROBĂ — nu se scrie nimic în WordPress.\n');

  let urcate = 0, sarite = 0, negasite = 0, erori = 0;

  for (const fisier of fisiere.slice(0, LIMITA)) {
    const sku = path.basename(fisier, path.extname(fisier));
    try {
      // 1. Produsul, după SKU.
      const gasite = await cere(`/wp-json/wc/v3/products?sku=${encodeURIComponent(sku)}`);
      const produs = Array.isArray(gasite) ? gasite[0] : null;
      if (!produs) { console.log(`  fără produs   ${sku}`); negasite++; continue; }

      if (produs.images && produs.images.length && !FORTEAZA) {
        console.log(`  are deja poză ${sku}`); sarite++; continue;
      }

      if (PROBA) { console.log(`  ar urca       ${sku}  ->  #${produs.id} ${produs.name.slice(0, 44)}`); urcate++; continue; }

      // 2. Fișierul, în biblioteca media.
      const continut = fs.readFileSync(path.join(DIR, fisier));
      const media = await cere('/wp-json/wp/v2/media', {
        method: 'POST',
        headers: {
          'Content-Disposition': `attachment; filename="${fisier}"`,
          'Content-Type': MIME[path.extname(fisier).toLowerCase()],
        },
        body: continut,
      });

      // `alt` e denumirea reală a produsului, nu numele fișierului: fișierul se
      // cheamă „CS6.2-48TD-460.webp", ceea ce nu spune nimic unui cititor de ecran.
      await cere(`/wp-json/wp/v2/media/${media.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: produs.name, alt_text: produs.name }),
      });

      // 3. Legarea de produs, ca imagine principală.
      await cere(`/wp-json/wc/v3/products/${produs.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [{ id: media.id }] }),
      });

      console.log(`  urcat         ${sku}  ->  #${produs.id}`);
      urcate++;
    } catch (e) {
      console.log(`  EROARE        ${sku}  ${e.message}`);
      erori++;
    }
    await pauza(PAUZA);
  }

  console.log(`\nurcate ${urcate} · sărite (aveau poză) ${sarite} · fără produs ${negasite} · erori ${erori}`);
  if (urcate && !PROBA) {
    console.log('\nSite-ul se împrospătează singur: plugin-ul cheamă /api/revalidate la salvarea');
    console.log('produsului. Dacă nu e configurat, prima vizită de după o oră aduce pozele.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
