/**
 * Corecții explicite acolo unde gruparea vizuală din PDF nu reflectă realitatea.
 *
 * Fiecare intrare de aici este o abatere conștientă de la citirea literală a
 * catalogului. Motivul e notat pe fiecare linie, ca să poată fi contestat.
 */

// --- Produse orfane: apar sub un titlu de secțiune care nu li se potrivește ---
// În PDF, cele 3 de mai jos sunt tipărite sub "Sisteme stocare DEYE BOS-B PRO-A3"
// doar din cauza aranjării în pagină. Nu sunt sisteme de stocare.
const ORPHANS = {
  'SUN-MPPT-L01-EU-AM8':  { cat: 'Echipamente Conversie & Comutare', nota: 'regulator de încărcare MPPT, nu sistem de stocare' },
  'SUN-125K-PCS01HP3':    { cat: 'Echipamente Conversie & Comutare', nota: 'PCS (Power Conversion System), nu sistem de stocare' },
  'SUN-STS500L':          { cat: 'Echipamente Conversie & Comutare', nota: 'comutator static de transfer, nu sistem de stocare' },
};

// --- Accesorii listate printre produsele principale ---
// Sunt reale și rămân în catalog, dar nu sunt acumulatori.
const ACCESORII = [
  'Control Box GB-L + BASE',
  'Control Box BOS-G-PDU-2',
  'Control Box BOS-A HVB 750V/160A-EU - HV',
  'Bază și cabluri conexiune pentru Growatt AXE 5.0L',
];
const ACCESORII_CAT = 'Stocare Energie > Accesorii Stocare';

// --- Brand per produs, unde secțiunea nu îl determină ---
// Secțiunea "Acumulatori Lifepo4 51.2V Low Voltage" amestecă 5 branduri.
const BRAND_PREFIX = [
  [/^PYTES/i,       'Pytes'],
  [/^FELICITY/i,    'Felicity'],
  [/^DYNESS/i,      'Dyness'],
  [/^PCENERSYS/i,   'PCEnersys'],
  [/^Hailei/i,      'Hailei'],
  [/^EASTRON/i,     'Eastron'],
  [/^GROWATT|^AXE |^HOPE /i, 'Growatt'],
  [/^Solis/i,       'Solis'],
  [/^Deye |^SUN-|^SUN |^DEYE /i, 'Deye'],
];

// --- Subcategorii pentru secțiunea generică "Sisteme de montaj" ---
// Ordinea contează: prima potrivire câștigă.
const MONTAJ_SUBCAT = [
  [/acoperi[sș] plat|click-in|teras[ăa]/i,        'Sisteme de Montaj > Structuri Acoperiș Plat'],
  [/acoperi[sș] metalic|tabl[ăa]|trapez|f[ăa]l[țt]uit/i, 'Sisteme de Montaj > Structuri Acoperiș Metalic'],
  [/[țt]igl[ăa]/i,                                 'Sisteme de Montaj > Structuri Țiglă'],
  [/^[ȘS]in[ăa]|Rail|profil aluminiu/i,            'Sisteme de Montaj > Șine și Profile'],
  [/Clem[ăa]|Conector|[ȘS]urub|Suport|Colier|Paravant|Paravânt/i, 'Sisteme de Montaj > Cleme și Accesorii'],
];

// --- Coduri duplicate pentru același produs ---
// Pagina "OFERTELE LUNII" scrie CS62-48TD-460; tabelul scrie CS6.2-48TD-460.
const SKU_ALIAS = { 'CS62-48TD-460': 'CS6.2-48TD-460' };

// --- Typos în catalogul sursă ---
// Nu le corectăm automat în denumire (păstrăm fidelitatea față de catalog),
// doar le raportăm ca să decidă clientul.
const TYPOS = [
  ['trapezidală',        'trapezoidală',  'Basic Rail-Blocator șină / Basic Rail-Suport fixare'],
  ['Dome Pravânt',       'Dome Paravânt', 'Dome Pravânt Extralung 2045 - 2398 mm'],
  ['Paravant',           'Paravânt',      'Paravant L2200 / L2350 (scris fără diacritice)'],
  ['acoperis plat',      'acoperiș plat', 'Sisteme montaj PB-068.1 / PB-062.1 / PB-098 / PB-096'],
  ['Surub ISO',          'Șurub ISO',     'Surub ISO cu dublu filet Hangerboard'],
  ['citire directa',     'citire directă','EASTRON SDM630, trifazat'],
];

module.exports = { ORPHANS, ACCESORII, ACCESORII_CAT, BRAND_PREFIX, MONTAJ_SUBCAT, SKU_ALIAS, TYPOS };
