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
 * Suprafața în repaus, fără reacție la mouse.
 *
 * Există separat fiindcă nu orice cutie albă din site e apăsabilă: fișa de
 * produs are panouri de date, paginile de catalog au stări goale. Toate trebuie
 * să arate ca aceeași familie de suprafețe, dar un contur care se colorează la
 * hover pe ceva ce nu duce nicăieri e o promisiune falsă.
 *
 * CHENARUL E `line-strong` (#cbd6e4), NU `gray-200`. A fost gray-200 (#e5e7eb) și
 * era prea puțin: pe fondurile deschise ale site-ului, cardurile se ghiceau în
 * loc să se vadă. Acum poartă aceeași ramă ca toate comenzile — bara de file,
 * butoanele, săgețile — fiindcă sunt toate obiecte, iar în site 1px de #cbd6e4
 * înseamnă exact asta.
 */
export const SUPRAFATA = "rounded-xl border border-line-strong bg-white shadow-sm";


/**
 * Badge-urile unui produs — aceleași pe card și pe fișa produsului.
 *
 * DE CE STAU AICI. Fișa scria statuturile ca text colorat („OFERTĂ SPECIALĂ"
 * albastru), iar cardul le desena ca pastile — două limbaje pentru aceeași
 * informație, ba chiar două denumiri („Ofertă specială" pe fișă, „Ofertă" pe
 * card). Cine dădea clic pe un card cu „OFERTĂ" roșu ajungea pe o pagină unde
 * nu mai găsea nimic roșu. Acum ambele iau culorile și textele de aici.
 *
 * Doar CULOAREA și FORMA sunt comune. Mărimea o alege locul: pe card
 * `BADGE_CARD` (28px, 11px), pe fișă puțin mai mare, fiindcă stă sub un titlu
 * de 34px, nu peste o fotografie de 260px.
 *
 * Raza e 6px (`rounded-md`), treapta etichetelor din scara de trei raze.
 *
 * Contraste (prag AA text normal 4,5:1):
 *   alb pe #DC2626 ............ 4,83 ✓  „Ofertă"
 *   alb pe gray-900 #101828 .. 17,75 ✓  economia la volum, „Lichidare stoc"
 *
 * `#DC2626` scris ca valoare, nu `red-600`: în Tailwind v4 treapta aceea e
 * oklch și iese #E7000B, altă nuanță decât cea măsurată. E singura excepție de
 * la regula unui singur accent și e cerută: ofertele trebuie să se vadă.
 */
export const BADGE = "inline-flex items-center rounded-md font-bold text-white whitespace-nowrap";
/** Pe telefon 20px și 10px, fiindcă cardul are acolo ~170px; de la `sm`, 28px și 11px. */
export const BADGE_CARD = "h-5 px-1.5 text-[10px] sm:h-7 sm:px-2.5 sm:text-[11px]";
/** Produsul e pe pagina „OFERTELE LUNII" a catalogului (`featured` în WooCommerce). */
export const BADGE_OFERTA = "bg-[#DC2626] uppercase tracking-wide";
/** Economia pe unitate la prețul de volum: „−60 € / buc". */
export const BADGE_ECONOMIE = "bg-gray-900";
/** Disponibilitatea „Lichidare stoc", din secțiunile de lichidare ale catalogului. */
export const BADGE_LICHIDARE = "bg-gray-900 uppercase tracking-wide";

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
 *
 * ─── PLAFONUL E 28px, A FOST 42 ──────────────────────────────────────────
 *
 * La 42px, pe o pagină unde textul de bază e 16px și cel din carduri 13,6px,
 * titlul era de 2,6 ori textul din jur — nu un cap de secțiune, un banner. Tot
 * conținutul părea umflat din cauza lui, deși nu el crescuse.
 *
 * Reperul e prototipul din care e luat restul desenului (Solarone.ro,
 * `stil-v2.css`): acolo `.sec-h h2` e 25px. 28 și nu 25, fiindcă noi avem
 * Archivo, un font cu mai multă personalitate, care suportă un corp puțin mai
 * mare fără să strige. Raportul față de textul de bază ajunge 1,75×.
 */
export function dimensiuneTitlu(text: string, plafonPx = 28): string {
  const LATIME_CARACTER = 0.55;
  const procenteDinContainer = 100 / (text.length * LATIME_CARACTER);
  return `min(${plafonPx}px, ${procenteDinContainer.toFixed(2)}cqi)`;
}

/**
 * Titlul cel mai lung din site, folosit ca ETALON pentru toate titlurile de
 * secțiune.
 *
 * ─── PROBLEMA PE CARE O REZOLVĂ ───────────────────────────────────────────
 *
 * `dimensiuneTitlu` calculează corpul din lungimea textului, ca titlul să
 * încapă pe un rând. Corect ca mecanism, dar cu o consecință pe care n-o
 * voiam: fiecare secțiune ajungea la ALT corp de literă, după cât de lung era
 * titlul ei. Măsurat pe pagina randată, la 1440px:
 *
 *     Categoriile principale pentru casa și energia ta ... 47 caractere, ~33px
 *     Ofertele lunii Septembrie 2026 .................... 30 caractere,  42px
 *
 * (Cifrele sunt de pe vremea plafonului de 42px; de când e 28, amândouă ating
 * plafonul la 1440 și diferența nu se mai vede acolo — dar reapare la ferestre
 * înguste, unde `cqi` coboară sub plafon, deci etalonul rămâne necesar.)
 *
 * Adică 9px diferență între două titluri aflate la un ecran distanță. Se citea
 * ca două fonturi diferite, deși e același font, aceeași grosime și aceeași
 * culoare — doar altă treaptă de mărime.
 *
 * ─── DE CE UN ETALON, ȘI NU UN NUMĂR FIX ──────────────────────────────────
 *
 * Un `text-[33px]` scris de mână ar fi rezolvat egalitatea și ar fi pierdut
 * exact ce face funcția bună: la ferestre înguste, sau lângă ștampila
 * „Prețuri valabile", corpul trebuie să scadă ca titlul să nu se rupă. Etalonul
 * păstrează comportamentul și adaugă doar regula care lipsea: toate titlurile
 * de secțiune stau pe ACEEAȘI treaptă, iar treapta o dă cel mai lung dintre
 * ele — singurul care are voie să decidă, fiindcă el e cel care se rupe primul.
 *
 * CINE SCHIMBĂ TITLUL DE LA „GAMA DE PRODUSE" schimbă și șirul de aici. Dacă
 * noul titlu e mai scurt, toate secțiunile cresc; dacă e mai lung, toate scad.
 * Asta e ideea, nu un efect secundar.
 */
const TITLU_ETALON = "Categoriile principale pentru casa și energia ta";

/**
 * Corpul unui titlu de secțiune. O singură treaptă pentru toată pagina.
 *
 * `dimensiuneTitlu` rămâne exportată separat pentru titluri care CHIAR trebuie
 * să-și calculeze corpul din textul propriu — un titlu de categorie, de pildă,
 * unde numele vine din catalog și poate avea orice lungime.
 */
export function dimensiuneTitluSectiune(plafonPx = 28): string {
  return dimensiuneTitlu(TITLU_ETALON, plafonPx);
}
