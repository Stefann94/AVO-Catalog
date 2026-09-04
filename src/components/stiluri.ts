/**
 * Butonul plin — o singură rețetă, folosită peste tot.
 *
 * Există ca șir de clase, nu copiat în fiecare componentă, fiindcă „toate la
 * fel" ține doar dacă e imposibil să nu fie: aici o modificare se face într-un
 * loc și ajunge simultan pe cardurile de categorie, pe cele de ofertă și pe
 * butonul de secțiune. Înainte erau trei rețete ușor diferite pentru același
 * gest — 40px cu 44px, pilulă cu 8px, 13px cu 14px, iar una avea și alt hover.
 *
 * ─── CULOAREA ─────────────────────────────────────────────────────────────
 *
 *   repaus ... avo-600 #004A99   alb pe el:  8,61 ✓
 *   hover .... avo-700 #003B7D   alb pe el: 10,93 ✓
 *   apăsat ... avo-800 #002D64   alb pe el: 13,50 ✓
 *
 * Treapta de hover nu e aleasă din ochi. Între avo-600 și avo-700 diferența de
 * luminozitate percepută e ΔL* = 6,7 — vizibilă imediat, fără să pară alt buton.
 * avo-800 ar da ΔL* ≈ 13, prea mult pentru un hover; iar sub 4 nu s-ar observa.
 *
 * Hover-ul ÎNCHIDE, nu deschide. Aici era `hover:bg-blue-600`, adică fix
 * albastrul pe care globals.css îl interzice — și pe deasupra mai deschis decât
 * starea de repaus, deci butonul părea că se stinge când puneai mouse-ul pe el.
 *
 * ─── FORMA ────────────────────────────────────────────────────────────────
 *
 * `rounded-lg`, 8px. Nu e o rază nouă: o au deja ștampila „Prețuri valabile" și
 * butonul de sub carduri. Secțiunea rămâne astfel cu trei raze, fiecare cu rolul
 * ei — 12px suprafețe, 8px comenzi, 6px etichete. Pilula de dinainte era a patra
 * rază, fără nicio treabă proprie.
 *
 * ─── DIMENSIUNEA ──────────────────────────────────────────────────────────
 *
 * 44px înălțime, nu 40. E minimul recomandat pentru o țintă atinsă cu degetul;
 * sub el, pe telefon, se ratează.
 *
 * ─── CE NU FACE ───────────────────────────────────────────────────────────
 *
 * La hover se schimbă DOAR culoarea. Fără ridicare, fără umbră, fără scalare.
 * De aceea tranziția e `transition-colors`, nu `transition-all`: chiar dacă
 * cineva adaugă mai târziu o clasă care mișcă ceva, tranziția n-o va anima.
 *
 * ─── FOCUS ────────────────────────────────────────────────────────────────
 *
 * Niciunul dintre butoanele de aici nu avea stare de focus — cine navighează cu
 * Tab nu vedea unde se află. `focus-visible` o arată doar la tastatură, nu și la
 * clic de mouse, deci nu apare un contur nedorit după fiecare apăsare.
 */
export const BUTON_PLIN =
  "inline-flex items-center justify-center gap-2 shrink-0 " +
  "h-11 px-5 rounded-lg " +
  "bg-avo-600 text-white text-[14px] font-semibold " +
  "transition-colors duration-200 " +
  "hover:bg-avo-700 active:bg-avo-800 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600";

/**
 * Cardul — o singură suprafață, folosită de toate tipurile din site.
 *
 * Erau patru rețete pentru același obiect: cardurile de categorie și de ofertă
 * pe `gray` cu 12px, cele de produs din catalog pe `slate` cu 16px, unele cu
 * `border`, altele cu `ring`, iar hover-ul diferea la fiecare — umbră mică,
 * mare, sau contur mai închis.
 *
 * ─── HOVER-UL ─────────────────────────────────────────────────────────────
 *
 * Conturul se colorează în avo-600 și se îngroașă de la 1px la 2px. Atât.
 * Nicio umbră, nicio ridicare, nicio scalare — aceeași regulă ca la butoane:
 * la hover se schimbă doar culoarea, obiectul nu se mișcă.
 *
 * Îngroșarea vine dintr-un `ring`, nu din `border-2`. Diferența contează:
 * `border-2` ar modifica lățimea chenarului, deci conținutul cardului s-ar
 * deplasa cu un pixel la fiecare trecere a mouse-ului. `ring` e desenat ca
 * umbră, în afara cutiei, deci nu intră în calculul așezării — cardul rămâne
 * nemișcat, iar ochiul vede tot 2px de albastru.
 *
 * Tranziția e declarată pe proprietăți anume, nu `transition-all`: dacă cineva
 * adaugă mai târziu o clasă care mișcă ceva, tranziția n-o va anima.
 *
 * Contrast: avo-600 #004A99 pe alb dă 8,61 — cu mult peste pragul de 3:1 cerut
 * pentru elemente negrafice. Conturul se vede și de către cine distinge greu
 * culorile, fiindcă se și îngroașă, nu doar își schimbă nuanța.
 *
 * ─── CE NU CONȚINE ────────────────────────────────────────────────────────
 *
 * Doar suprafața: colț, chenar, fundal, hover. Așezarea dinăuntru
 * (`flex flex-col`, `overflow-hidden`, padding) rămâne la fiecare card,
 * fiindcă diferă de la un tip la altul.
 */
/**
 * Suprafața în repaus, fără reacție la mouse.
 *
 * Există separat fiindcă nu orice cutie albă din site e apăsabilă: fișa de
 * produs are panouri de date, paginile de catalog au stări goale. Toate trebuie
 * să arate ca aceeași familie de suprafețe, dar un contur care se colorează la
 * hover pe ceva ce nu duce nicăieri e o promisiune falsă.
 */
export const SUPRAFATA = "rounded-xl border border-gray-200 bg-white shadow-sm";

export const CARD =
  SUPRAFATA +
  " transition-[border-color,box-shadow] duration-200" +
  " hover:border-avo-600 hover:ring-1 hover:ring-avo-600";

/**
 * Dimensiunea unui titlu de secțiune, calculată din lungimea lui.
 *
 * PROBLEMA. Titlurile de secțiune trebuie să stea pe un singur rând, dar
 * lungimea lor variază: „Ofertele lunii Septembrie 2026" are 30 de caractere,
 * „Categoriile principale pentru casa și energia ta" are 47, iar cel de la
 * oferte se lungește singur cu numele lunii. O dimensiune fixă ori taie
 * titlurile lungi pe două rânduri, ori le lasă pe cele scurte prea mici.
 *
 * SOLUȚIA. Corpul literei devine o fracțiune din lățimea DISPONIBILĂ, împărțită
 * la câte caractere are titlul. Cu cât e mai lung, cu atât scade — exact atât
 * cât să încapă, niciodată mai mult decât plafonul.
 *
 * DE CE `cqi`, NU `vw`. Unitățile de viewport măsoară fereastra, dar titlul nu
 * primește toată fereastra: la lățimi mari stă pe același rând cu ștampila
 * „Prețuri valabile", care îi ia vreo 300px. `cqi` măsoară containerul în care
 * chiar se află, deci socoteala iese corectă și cu ștampila lângă el, și fără
 * ea. Cere `@container` pe învelișul titlului.
 *
 * CONSTANTA 0,55 e lățimea medie a unui caracter, în em, pentru Libre Franklin
 * la greutatea 800. E aleasă cu o marjă în plus față de media reală: dacă
 * greșim în sus, titlul iese cu câțiva pixeli mai mic decât ar fi încăput;
 * dacă greșim în jos, se rupe pe două rânduri. Prima greșeală nu se vede,
 * a doua da.
 *
 * PE TELEFON regula nu se aplică. Un titlu de 47 de caractere ar avea nevoie de
 * ~14px ca să încapă pe un rând la 375px lățime — ilizibil pentru un titlu de
 * secțiune. Acolo rămâne dimensiunea fixă și se rupe pe rânduri, cum e normal.
 */
export function dimensiuneTitlu(text: string, plafonPx = 42): string {
  const LATIME_CARACTER = 0.55;
  const procenteDinContainer = 100 / (text.length * LATIME_CARACTER);
  return `min(${plafonPx}px, ${procenteDinContainer.toFixed(2)}cqi)`;
}
