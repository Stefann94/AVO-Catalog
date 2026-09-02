/**
 * Harta secțiunilor din "Catalog lunar Solar One".
 *
 * Fiecare secțiune din PDF este declarată explicit. Detectarea pe bază de
 * indentare nu funcționează: unele titluri sunt centrate, altele încep la
 * coloana 0 (ex. "Invertoare Growatt Monofazate Hibrid Low-Voltage - LICHIDARE STOC").
 *
 * `brand` NU se deduce din titlu -- secțiunea "Smart meters DEYE" conține
 * produse EASTRON. Unde titlul minte, brandul real e pus pe produs în overrides.js.
 */

// Titlul din PDF (normalizat: spații multiple colapsate) -> metadate
const SECTIONS = [
  // ---- PANOURI ----
  ['Panouri fotovoltaice Canadian Solar', { cat: 'Panouri Fotovoltaice', brand: 'Canadian Solar', scheme: 'paleti' }],
  ['Panouri fotovoltaice Aiko Solar',     { cat: 'Panouri Fotovoltaice', brand: 'Aiko Solar',     scheme: 'paleti' }],
  ['Panouri fotovoltaice Jinko Solar',    { cat: 'Panouri Fotovoltaice', brand: 'Jinko Solar',    scheme: 'paleti' }],
  ['Panouri fotovoltaice Tongwei Solar',  { cat: 'Panouri Fotovoltaice', brand: 'Tongwei Solar',  scheme: 'paleti' }],
  ['Panouri fotovoltaice Ulica Solar',    { cat: 'Panouri Fotovoltaice', brand: 'Ulica Solar',    scheme: 'paleti' }],

  // ---- INVERTOARE ----
  ['Invertoare DEYE Monofazate Hibride Low-Voltage',  { cat: 'Invertoare > Hibride Monofazate', brand: 'Deye', faze: 'Monofazat', tip: 'Hibrid', bat: 'Low Voltage' }],
  ['Invertoare DEYE Trifazate Hibride Low-Voltage',   { cat: 'Invertoare > Hibride Trifazate',  brand: 'Deye', faze: 'Trifazat',  tip: 'Hibrid', bat: 'Low Voltage' }],
  ['Invertoare DEYE Trifazate Hibride High-Voltage',  { cat: 'Invertoare > Hibride Trifazate',  brand: 'Deye', faze: 'Trifazat',  tip: 'Hibrid', bat: 'High Voltage' }],
  ['Invertoare DEYE Trifazate On-Grid',               { cat: 'Invertoare > On-Grid',            brand: 'Deye', faze: 'Trifazat',  tip: 'On-Grid' }],
  ['Invertoare Growatt OFF-GRID - LICHIDARE STOC',                    { cat: 'Invertoare > Off-Grid',           brand: 'Growatt', tip: 'Off-Grid', lichidare: true }],
  ['Invertoare Growatt Monofazate Hibrid Low-Voltage - LICHIDARE STOC',{ cat: 'Invertoare > Hibride Monofazate', brand: 'Growatt', faze: 'Monofazat', tip: 'Hibrid', bat: 'Low Voltage', lichidare: true }],
  ['Invertoare Growatt Trifazate Hibrid High-Voltage - LICHIDARE STOC',{ cat: 'Invertoare > Hibride Trifazate',  brand: 'Growatt', faze: 'Trifazat',  tip: 'Hibrid', bat: 'High Voltage', lichidare: true }],
  ['Invertoare Solis/Pytes Low-Voltage',              { cat: 'Invertoare > Hibride Monofazate', brand: 'Solis', tip: 'Hibrid', bat: 'Low Voltage' }],

  // ---- STOCARE ----
  ['Acumulatori DEYE High-Voltage',        { cat: 'Stocare Energie > Acumulatori High-Voltage', brand: 'Deye', bat: 'High Voltage' }],
  ['Sisteme stocare DEYE BOS-G',           { cat: 'Stocare Energie > Sisteme Stocare Complete', brand: 'Deye', bat: 'High Voltage' }],
  ['Sisteme stocare DEYE BOS-A',           { cat: 'Stocare Energie > Sisteme Stocare Complete', brand: 'Deye', bat: 'High Voltage' }],
  ['Sisteme stocare DEYE BOS-B PRO-A3',    { cat: 'Stocare Energie > Sisteme Stocare Complete', brand: 'Deye', bat: 'High Voltage' }],
  ['Sisteme stocare DEYE BOS-B OUTDOOR',   { cat: 'Stocare Energie > Sisteme Stocare Complete', brand: 'Deye', bat: 'High Voltage' }],
  ['Acumulatori DEYE Low-Voltage',         { cat: 'Stocare Energie > Acumulatori Low-Voltage',  brand: 'Deye', bat: 'Low Voltage' }],
  ['SISTEME MICRO ESS / STOCARE BALCON DEYE', { cat: 'Stocare Energie > Micro ESS / Balcon',    brand: 'Deye' }],
  ['Acumulatori Lifepo4 51.2V Low Voltage',   { cat: 'Stocare Energie > Acumulatori Low-Voltage', bat: 'Low Voltage' }], // brand per-produs
  ['Acumulatori Growatt Lifepo4 51.2V Low Voltage - LICHIDARE STOC', { cat: 'Stocare Energie > Acumulatori Low-Voltage', brand: 'Growatt', bat: 'Low Voltage', lichidare: true }],

  // ---- EV ----
  ['Stații de încărcare auto DEYE',                  { cat: 'Stații de Încărcare Auto', brand: 'Deye' }],
  ['Stații de încărcare auto Growatt - LICHIDARE STOC', { cat: 'Stații de Încărcare Auto', brand: 'Growatt', lichidare: true }],

  // ---- SMART ----
  ['DEYE Smart Devices',                   { cat: 'Monitorizare & Smart Devices > Dispozitive Smart', brand: 'Deye' }],
  ['Smart meters DEYE',                    { cat: 'Monitorizare & Smart Devices > Smart Meters', brand: 'Eastron' }], // titlul minte: produsele sunt EASTRON
  ['Smart meters Growatt - LICHIDARE STOC',{ cat: 'Monitorizare & Smart Devices > Smart Meters', brand: 'Growatt', lichidare: true }],

  // ---- MONTAJ ----
  ['Sisteme de montaj',                    { cat: 'Sisteme de Montaj' }], // subcategorie per-produs
  ['Șine montaj - K2 Systems',             { cat: 'Sisteme de Montaj > K2 Systems', brand: 'K2 Systems' }],
  ['Sisteme pentru acoperiș - K2 Systems', { cat: 'Sisteme de Montaj > K2 Systems', brand: 'K2 Systems' }],
  ['Accesorii pentru șine - K2 Systems',   { cat: 'Sisteme de Montaj > K2 Systems', brand: 'K2 Systems' }],
  ['DOME 6.10 - K2 Systems',               { cat: 'Sisteme de Montaj > K2 Systems', brand: 'K2 Systems' }],
  ['DOME 6.15 - K2 Systems',               { cat: 'Sisteme de Montaj > K2 Systems', brand: 'K2 Systems' }],
  ['Paravânt DOME - K2 Systems',           { cat: 'Sisteme de Montaj > K2 Systems', brand: 'K2 Systems' }],
  ['Accesorii DOME - K2 Systems',          { cat: 'Sisteme de Montaj > K2 Systems', brand: 'K2 Systems' }],

  // ---- ACCESORII ----
  ['Cablu Solar - Top Cable',              { cat: 'Accesorii > Cabluri Solare', brand: 'Top Cable' }],
  ['Conectori MC4 - Staubli',              { cat: 'Accesorii > Conectori', brand: 'Staubli' }],
];

module.exports = { SECTIONS: new Map(SECTIONS) };
