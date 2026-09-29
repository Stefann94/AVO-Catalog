import type { Produs } from "@/lib/produs";
import { caArticol } from "../CardProdus";
import BandaProduse from "./BandaProduse";

/* ══════════════════════════════════════════════════════════════════════════
   PREȚ MAI BUN LA VOLUM
   ──────────────────────────────────────────────────────────────────────────
   Secțiunea „Condiții B2B" promite, în josul paginii, că fiecare poziție din
   catalog are două coloane de preț și că a doua se deschide la prag. Până
   acum, prima pagină nu arăta NICIUN produs la care se vede lucrul ăsta —
   promisiunea stătea singură, fără nimic în spatele ei.

   Secțiunea asta e dovada. Nimic nou nu se inventează: ambele prețuri sunt în
   catalog, pragul la fel, iar insigna de pe card (−X € / buc) e calculată din
   diferența lor, exact ca pe restul site-ului.

   ─── DE CE SE ORDONEAZĂ DUPĂ EURO, NU DUPĂ PROCENT ───────────────────────

   88 de produse din 172 au a doua coloană de preț. Ordonate după PROCENT,
   primele zece sunt TOATE piese de montaj, cu economii între 5,48 și 5,77 € —
   iar cele mai multe dintre ele costă sub un euro bucata, deci procentul mare
   vine dintr-un numitor mic. „Clemă de mijloc, −0,18 €" ar fi fost primul card
   al unei secțiuni numite „Preț mai bun la volum". Șapte din zece au
   fotografie.

   Ordonate după SUMA ÎN EURO, primele zece sunt 8 invertoare și 2 produse de
   stocare, cu economii între 40 și 123 € pe bucată, toate zece cu fotografie.

   Argumentul nu e că a doua listă arată mai bine. E că insigna de pe card
   scrie SUMA, nu procentul: o grilă ordonată după procent ar fi apărut
   ordonată aiurea pentru cine citește cardurile.

   ─── CE NU SPUNE TITLUL ──────────────────────────────────────────────────

   Nu scrie „cele mai mari reduceri" și nu scrie un procent. Economia mediană
   pe toate cele 88 de produse e 1,8%; un titlu care ar promite mai mult s-ar
   dezminți la al treilea card.
   ══════════════════════════════════════════════════════════════════════════ */

/** Câte produse intră în secțiune: cinci pe rând, două rânduri. */
const PE_BANDA = 10;

export default function PretVolum({ produse = [] }: { produse?: Produs[] }) {
  const alese = produse
    .filter(
      (p) =>
        typeof p.pret === "number" &&
        p.pret > 0 &&
        typeof p.pretVolum === "number" &&
        p.pretVolum > 0 &&
        p.pretVolum < p.pret,
    )
    .sort((a, b) => (b.pret! - b.pretVolum!) - (a.pret! - a.pretVolum!))
    .slice(0, PE_BANDA)
    .map(caArticol);

  return (
    <BandaProduse
      titlu="Preț mai bun la volum"
      /* Fond alb: deasupra e „Produse din catalog" pe `canvas`, dedesubt
         lichidarea. Secțiunile alternează, ca să se vadă unde se termină una. */
      fundal="bg-white"
      descriere={
        <>
          Produsele la care catalogul are a doua coloană de preț. Insigna de pe
          card arată cât se economisește pe bucată, iar pragul de la care se
          aplică e scris lângă preț.
        </>
      }
      articole={alese}
      link={{ text: "Vezi toate produsele", adresa: "/catalog" }}
      nota={
        <>
          Prețuri în EUR, fără TVA, valabile pentru perioada catalogului curent.
          Pragul de volum se aplică pe cantitatea comandată per produs.
          Disponibilitatea se confirmă la plasarea comenzii.
        </>
      }
    />
  );
}
