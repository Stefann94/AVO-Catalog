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
