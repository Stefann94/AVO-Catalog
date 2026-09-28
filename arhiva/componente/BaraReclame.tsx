import Image from "next/image";
import Link from "next/link";
import reclamaLichidare from "../../public/reclame/lichidare-panouri.jpg";
import reclamaDeye from "../../public/reclame/deye-invertoare.jpg";
import reclamaCanadian from "../../public/reclame/canadian-solar-panouri.jpg";

/**
 * Coloana de reclame din marja dreaptă.
 *
 * ─── GEOMETRIA E OGLINDA BAREI DE FILTRE ──────────────────────────────────
 *
 * Aceleași variabile din app/globals.css, doar că ancorate la dreapta:
 * `--bara-latime` îi dă lățimea, `--bara-stanga` distanța față de margine.
 * Nimic calculat separat, deci cele două coloane rămân simetrice la orice
 * lățime de ecran, inclusiv atunci când marja se lărgește și bara din stânga
 * se alipește de conținut.
 *
 * PORNEȘTE MAI SUS DECÂT BARA DE FILTRE, și diferența e intenționată. Bara din
 * stânga începe pe LINIA de sub titlu (`--bara-sus`), fiindcă e un cuprins al
 * secțiunii — aparține de ce urmează sub linie. Reclama începe de la nivelul
 * ștampilei „Prețuri valabile" (`--reclame-sus`), adică odată cu mastheadul,
 * fiindcă e conținut de sine stătător, nu o notă a secțiunii.
 *
 * Cele două ancore diferă cu exact 72px: înălțimea rândului de masthead plus
 * distanța lui până la linie. Amândouă ies din `--sectiune-sus`, care e
 * padding-ul de sus al secțiunii, scris o singură dată.
 *
 * Apare de la aceiași 1760px. Sub prag nu se îngustează și nu se mută în flux:
 * dispare. Regula e cea a barei de filtre — conținutul paginii nu se atinge,
 * reclamele încap în marja goală sau nu apar deloc.
 *
 * ─── DE CE E O LISTĂ ──────────────────────────────────────────────────────
 *
 * Zona e gândită să țină mai multe, iar decizia s-a plătit: a doua reclamă a
 * intrat ca încă o intrare în array, fără să se atingă nimic din componentă.
 * Scrisă ca un singur `<Image>` hardcodat, ar fi cerut rescrierea ei — și, cum
 * se întâmplă de obicei, ar fi fost lipită dedesubt cu alt markup.
 *
 * Ordinea din array e ordinea de pe ecran, de sus în jos. Distanța dintre ele
 * e `gap-4` de pe `<aside>`, deci se schimbă într-un loc pentru toate.
 *
 * ─── CE TREBUIE ȘTIUT DESPRE MATERIALELE DE ACUM ──────────────────────────
 *
 * TOATE TREI SUNT BANNERE LATE, ceea ce e formatul greșit pentru coloana asta:
 *
 *   lichidare-panouri.jpg ....... 2752×1382, adică 2:1
 *   deye-invertoare.jpg ......... 1401×752, adică 1,86:1
 *   canadian-solar-panouri.jpg .. 3022×1408, adică 2,15:1
 *
 * Coloana are cel mult 300px, deci se randează la ~150px, ~161px și ~140px
 * înălțime. Textul desenat în ele se micșorează cu tot restul: la Deye, titlul
 * ajunge pe la 10px — la limită —, iar rândurile de sub el pe la 5px, adică nu
 * se citesc deloc. La Canadian Solar e la fel. Nu e un defect de așezare, e o
 * nepotrivire de format: un banner lat pus într-o coloană îngustă.
 *
 * Pentru zona asta, materialul ar trebui să fie VERTICAL sau aproape pătrat —
 * raport 3:4 ori 1:1 — desenat pentru 300px lățime, cu puțin text și mare.
 * Aceleași reclame, refăcute pe format vertical, ar avea textul citibil fără
 * nicio modificare de cod.
 *
 * `sizes="300px"` nu e ornament: fără el, Next ar servi o variantă mult mai
 * mare decât are nevoie o coloană de 300px, pentru un fișier care are deja
 * 465 KB.
 */

type Reclama = {
  /** Fișierul, importat static ca Next să genereze `blurDataURL` la build. */
  imagine: typeof reclamaLichidare;
  /** Ce scrie în imagine, pentru cine n-o vede. O reclamă fără `alt` e o gaură. */
  descriere: string;
  href: string;
};

const RECLAME: Reclama[] = [
  {
    imagine: reclamaLichidare,
    descriere: "Lichidare de stoc la panouri fotovoltaice — vezi produsele",
    href: "/catalog/lichidare-stoc",
  },
  {
    imagine: reclamaDeye,
    /* `alt` spune ce scrie ÎN imagine, nu ce se vede în ea. Cine folosește un
       cititor de ecran are nevoie de mesaj și de destinație, nu de descrierea
       garajului din fotografie. */
    descriere:
      "Invertoare hibride Deye de 10 kW, compatibile Li-Ion și Lead-Acid, cu monitorizare WiFi — vezi modelele",
    /* Reclama zice „Vezi Detalii Produs & Modele", la plural, iar imaginea nu
       arată un cod anume. Deci duce la categoria întreagă, nu la un produs
       ales de noi — invertoarele Deye sunt împrăștiate între subcategoriile
       mono și trifazate, iar alegerea uneia ar fi fost o presupunere. */
    href: "/catalog/invertoare",
  },
  {
    imagine: reclamaCanadian,
    descriere:
      "Panouri fotovoltaice Canadian Solar, de înaltă eficiență și cu garanție extinsă — cere o ofertă",
    /* Reclama cere „Cere o ofertă acum!", dar site-ul n-are încă o pagină de
       ofertă sau de contact — sunt cinci rute în total, toate de catalog. Până
       apare una, duce la categoria de panouri, care e cel mai aproape de ce
       promite imaginea. De schimbat aici, într-un rând, când ruta există. */
    href: "/catalog/panouri-fotovoltaice",
  },
];

export default function BaraReclame() {
  if (RECLAME.length === 0) return null;

  return (
    <div
      /* `pointer-events-none` pe înveliș, `auto` pe fiecare reclamă: învelișul e
         o coloană înaltă cât secțiunea, iar fără asta ar înghiți clicurile din
         zona goală de sub ultima reclamă. Aceeași grijă ca la bara de filtre. */
      className="pointer-events-none absolute top-(--reclame-sus) right-(--bara-stanga) z-30 hidden w-(--bara-latime) min-[1760px]:block"
    >
      <aside
        aria-label="Promoții"
        className="sticky top-[calc(var(--inaltime-navbar)+1.5rem)] flex flex-col gap-4"
      >
        {RECLAME.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            /* FĂRĂ CHENAR ȘI FĂRĂ UMBRĂ ÎN REPAUS. O reclamă își aduce
               propriul cadru — are fundal, margini și un buton desenate în
               imagine. Un chenar de card pe deasupra ar fi ramă peste ramă, iar
               `bg-white` sub o fotografie opacă nu se vede niciodată.

               Toată suprafața e apăsabilă: linkul e `block` și înconjoară
               imaginea, deci ținta e imaginea întreagă, nu o zonă din ea.

               RĂMÂNE DOAR HOVER-UL, ca `ring`, nu ca `border`: fără o grosime
               de chenar în repaus, `hover:border-*` n-ar avea ce îngroșa.
               Inelul se desenează în afara cutiei, deci imaginea nu se
               deplasează cu un pixel când treci cu mouse-ul. E singurul semn
               că suprafața duce undeva. */
            className="pointer-events-auto block overflow-hidden transition-[box-shadow] duration-200 hover:ring-2 hover:ring-avo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
          >
            <Image
              src={r.imagine}
              alt={r.descriere}
              sizes="300px"
              placeholder="blur"
              className="h-auto w-full"
            />
          </Link>
        ))}
      </aside>
    </div>
  );
}
