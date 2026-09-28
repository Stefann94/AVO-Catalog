/**
 * Arborele de categorii al copiei: pe FUNCȚIE, nu pe brand.
 *
 * În OpenCart arborele e „Invertoare > Deye > Trifazate > Low Voltage", dar
 * lumea caută „invertor hibrid trifazat 10 kW", nu „invertoare Deye trifazate".
 * Brandul devine filtru și pagină proprie (/branduri/deye).
 *
 * `slug` e segmentul de URL și NU se mai schimbă după lansare: un slug schimbat
 * înseamnă o pagină indexată pierdută. `nume` și textele se pot schimba oricând.
 *
 * `ghid` e textul de sub grila de produse. E scris o singură dată, pe categorie,
 * cu informație generală despre cum se alege un produs — nu afirmații despre
 * produse anume (acelea vin din date, în `intro`, calculat la transformare).
 */

export const CATEGORII = [
  {
    slug: "invertoare",
    nume: "Invertoare fotovoltaice",
    singular: "invertor",
    ghid: `<h2>Cum alegi un invertor fotovoltaic</h2>
<p><strong>Tipul de sistem decide tipul de invertor.</strong> Un invertor <em>on-grid</em> injectează energia în rețea și se oprește la căderea curentului. Un invertor <em>hibrid</em> poate încărca o baterie și poate alimenta consumatorii importanți în lipsa rețelei. Un invertor <em>off-grid</em> funcționează fără rețea, pe baterie.</p>
<p><strong>Faza trebuie să fie aceeași cu a branșamentului.</strong> O locuință cu branșament monofazat folosește un invertor monofazat; una cu branșament trifazat, un invertor trifazat, care împarte puterea egal pe cele trei faze.</p>
<p><strong>Puterea se alege după consum și după suprafața de panouri.</strong> Orientativ, o locuință care consumă 400–500 kWh pe lună are nevoie de un sistem de 5–6 kW; peste 800 kWh pe lună, de 10 kW sau mai mult. Puterea panourilor poate depăși puterea nominală a invertorului în limita declarată în fișa tehnică (puterea PV maximă de intrare).</p>
<p><strong>La hibride, tensiunea bateriei e hotărâtoare.</strong> Invertoarele <em>low voltage</em> lucrează cu baterii de 48–51,2 V; cele <em>high voltage</em>, cu baterii de sute de volți. Cele două nu sunt interschimbabile.</p>`,
    copii: [
      { slug: "hibride-monofazate", nume: "Invertoare hibride monofazate", singular: "invertor hibrid monofazat",
        ghid: `<h2>Invertor hibrid monofazat: pentru cine e</h2><p>Pentru locuințele cu branșament monofazat care vor să folosească energia produsă și seara, dintr-o baterie, sau să aibă curent la o pană de rețea. Aproape toate modelele monofazate lucrează cu baterii low voltage de 48–51,2 V.</p><p>Verifică în fișa tehnică puterea PV maximă de intrare, numărul de trackere MPPT (câte orientări diferite de acoperiș poți lega) și curentul maxim de încărcare a bateriei.</p>` },
      { slug: "hibride-trifazate", nume: "Invertoare hibride trifazate", singular: "invertor hibrid trifazat",
        ghid: `<h2>Invertor hibrid trifazat: low voltage sau high voltage</h2><p>Modelele <strong>low voltage</strong> folosesc baterii de 48–51,2 V, mai ieftine și ușor de extins cu module identice. Modelele <strong>high voltage</strong> folosesc baterii de sute de volți, cu curenți mai mici, pierderi mai mici și putere de descărcare mai mare, potrivite de la 10–12 kW în sus.</p><p>Alege întâi tensiunea bateriei, apoi invertorul: cele două trebuie să fie compatibile, iar compatibilitatea e declarată de producător.</p>` },
      { slug: "on-grid", nume: "Invertoare on-grid", singular: "invertor on-grid",
        ghid: `<h2>Invertor on-grid (de rețea)</h2><p>Varianta cea mai simplă și mai ieftină pe kW pentru prosumatori: energia produsă se consumă în casă, iar surplusul intră în rețea. Nu are baterie și nu alimentează casa la o pană de curent.</p><p>Pentru sisteme comerciale și industriale, invertoarele on-grid trifazate de 25–125 kW se leagă de obicei mai multe în paralel.</p>` },
      { slug: "off-grid", nume: "Invertoare off-grid", singular: "invertor off-grid",
        ghid: `<h2>Invertor off-grid</h2><p>Pentru locuri fără rețea electrică sau unde rețeaua nu e de încredere: cabane, ferme, pompe. Toată energia trece prin baterie, deci capacitatea bateriei se dimensionează după consumul zilnic și după numărul de zile fără soare acoperite.</p>` },
    ],
  },
  {
    slug: "acumulatori",
    nume: "Acumulatori și baterii solare",
    singular: "acumulator",
    ghid: `<h2>Cum alegi o baterie pentru sistemul fotovoltaic</h2>
<p><strong>Tensiunea bateriei trebuie să fie cea a invertorului.</strong> Invertoarele low voltage lucrează cu baterii de 48–51,2 V; cele high voltage, cu baterii de sute de volți.</p>
<p><strong>Capacitatea se alege după consumul de seară și de noapte.</strong> O baterie de 5 kWh acoperă tipic iluminatul, frigiderul, electronicele și o parte din consumul de seară al unei locuințe. Pentru pompă de căldură sau autonomie la pană de rețea sunt necesare 10–16 kWh sau mai mult.</p>
<p><strong>LiFePO4 este chimia standard azi</strong>: mii de cicluri, stabilitate termică și fără întreținere. Modelele cu încălzire integrată pot fi încărcate și la temperaturi scăzute, într-o încăpere neîncălzită.</p>`,
    copii: [
      { slug: "low-voltage", nume: "Acumulatori low voltage (48 V)", singular: "acumulator low voltage",
        ghid: `<h2>Baterii low voltage</h2><p>Module de 48–51,2 V, legate în paralel pentru capacitate mai mare. Se folosesc cu invertoarele hibride monofazate și cu cele trifazate low voltage. Verifică numărul maxim de module în paralel și dacă bateria e pe lista de compatibilitate a invertorului.</p>` },
      { slug: "high-voltage", nume: "Acumulatori high voltage", singular: "acumulator high voltage",
        ghid: `<h2>Baterii high voltage</h2><p>Module legate în serie, cu o unitate de control (BMS) comună, pentru tensiuni de sute de volți. Se folosesc cu invertoarele hibride trifazate high voltage. Unitatea de control se alege după numărul de module și după invertor.</p>` },
      { slug: "stocare-industriala", nume: "Sisteme de stocare industriale", singular: "sistem de stocare",
        ghid: `<h2>Stocare pentru firme și parcuri fotovoltaice</h2><p>Cabinete de baterii, convertoare bidirecționale (PCS) și sisteme complete de zeci sau sute de kWh, pentru reducerea vârfurilor de consum, autoconsum industrial și servicii de rețea.</p>` },
      { slug: "accesorii-stocare", nume: "Accesorii pentru baterii", singular: "accesoriu pentru baterii",
        ghid: `<h2>Accesorii pentru baterii</h2><p>Unități de control, cabluri de putere și comunicare, suporturi și cutii de backup: componentele care leagă bateria de invertor și de instalația casei.</p>` },
    ],
  },
  {
    slug: "panouri-fotovoltaice",
    nume: "Panouri fotovoltaice",
    singular: "panou fotovoltaic",
    ghid: `<h2>Cum alegi panourile fotovoltaice</h2>
<p><strong>Puterea pe panou contează mai puțin decât puterea pe metru pătrat.</strong> Eficiența modulului arată câtă energie obții de pe aceeași suprafață de acoperiș.</p>
<p><strong>Celulele N-type (TOPCon, ABC, HJT)</strong> au pierderi mai mici la temperaturi ridicate și degradare anuală mai mică decât celulele P-type mai vechi.</p>
<p><strong>Dimensiunea și greutatea</strong> decid sistemul de montaj și câte panouri încap pe acoperiș. Panourile de 54 de celule (~1,7 × 1,1 m) sunt cele mai ușor de manevrat pe acoperișuri de case.</p>`,
  },
  {
    slug: "sisteme-fotovoltaice",
    nume: "Sisteme fotovoltaice complete",
    singular: "sistem fotovoltaic",
    ghid: `<h2>Sistem complet sau componente separate</h2><p>Un sistem complet reunește invertorul, panourile și, după caz, bateria, alese să lucreze împreună. Varianta cu montaj include și instalarea.</p>`,
    copii: [
      { slug: "cu-montaj", nume: "Sisteme fotovoltaice cu montaj inclus", singular: "sistem fotovoltaic cu montaj" },
      { slug: "fara-montaj", nume: "Kituri fotovoltaice fără montaj", singular: "kit fotovoltaic" },
      { slug: "invertor-si-baterie", nume: "Pachete invertor + baterie", singular: "pachet invertor și baterie" },
      { slug: "balcon", nume: "Sisteme solare pentru balcon", singular: "sistem pentru balcon" },
    ],
  },
  {
    slug: "sisteme-de-montaj",
    nume: "Sisteme de montaj pentru panouri",
    singular: "componentă de montaj",
    ghid: `<h2>Cum alegi sistemul de montaj</h2><p>Sistemul de montaj depinde de acoperiș: cârlige pentru țiglă, suporturi sau șuruburi cu dublu filet pentru tablă, structuri cu balast sau triunghiuri pentru acoperiș plat. Șinele și clemele trebuie să corespundă grosimii ramei panoului (de obicei 30–35 mm).</p>`,
    copii: [
      { slug: "kituri-structuri", nume: "Kituri și structuri de montaj", singular: "structură de montaj" },
      { slug: "carlige-suporti", nume: "Cârlige și suporți", singular: "cârlig sau suport" },
      { slug: "sine-profile", nume: "Șine și profile", singular: "șină" },
      { slug: "cleme-conectori", nume: "Cleme și conectori de șină", singular: "clemă" },
      { slug: "suruburi-piulite", nume: "Șuruburi și piulițe", singular: "șurub" },
      { slug: "accesorii-montaj", nume: "Alte accesorii de montaj", singular: "accesoriu de montaj" },
    ],
  },
  {
    slug: "cabluri-conectori",
    nume: "Cabluri și conectori solari",
    singular: "cablu sau conector",
    ghid: `<h2>Cabluri și conectori</h2><p>Pe partea de curent continuu se folosește cablu solar H1Z2Z2-K, rezistent la UV, de 4 mm² sau 6 mm² în funcție de lungime și curent. Conectorii MC4 trebuie să fie de același tip la ambele capete ale unei legături.</p>`,
  },
  {
    slug: "protectii-tablouri",
    nume: "Tablouri, protecții și optimizatoare",
    singular: "echipament de protecție",
    ghid: `<h2>Protecții și tablouri</h2><p>Tabloul AC/DC reunește siguranțele, descărcătoarele și separatoarele dintre panouri, invertor și rețea. Se alege după puterea invertorului, faza și numărul de stringuri.</p>`,
  },
  {
    slug: "monitorizare",
    nume: "Monitorizare și contoare inteligente",
    singular: "dispozitiv de monitorizare",
    ghid: `<h2>Monitorizare și smart meter</h2><p>Contorul inteligent îi spune invertorului cât consumă casa, ca să poată limita injecția în rețea sau să folosească bateria corect. Dongle-urile Wi-Fi/4G trimit datele în aplicația producătorului.</p>`,
  },
  {
    slug: "statii-incarcare",
    nume: "Stații de încărcare auto",
    singular: "stație de încărcare",
    ghid: `<h2>Cum alegi o stație de încărcare</h2><p>Puterea depinde de branșament: 3,7–7 kW pe monofazat, 11–22 kW pe trifazat. Legată de invertor, stația poate încărca mașina din surplusul de energie solară.</p>`,
  },
  {
    slug: "carport",
    nume: "Carport fotovoltaic",
    singular: "carport",
    ghid: `<h2>Carport fotovoltaic</h2><p>Structură de parcare acoperită cu panouri, pentru una sau mai multe mașini: umbră pentru mașină și producție de energie fără ocuparea acoperișului casei.</p>`,
  },
];

/** Toate categoriile, aplatizate, cu `cale` (ex. "invertoare/on-grid") și `parinte`. */
export function toateCategoriile() {
  const lista = [];
  for (const c of CATEGORII) {
    lista.push({ ...c, cale: c.slug, parinte: null });
    for (const k of c.copii ?? []) lista.push({ ...k, cale: `${c.slug}/${k.slug}`, parinte: c.slug });
  }
  return lista;
}
