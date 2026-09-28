import Image from "next/image";
import Link from "next/link";
import siglaPytes from "../../public/branduri/pytes.png";

/**
 * Reclama înaltă Pytes — în marja dreaptă a secțiunii „Lichidare de stoc".
 *
 * ─── DE CE E DESENATĂ ÎN COD, NU O IMAGINE ────────────────────────────────
 *
 * Reclamele din coloana de lângă „Gama de produse" sunt JPG-uri late (2:1),
 * iar într-o coloană de 240–300px textul desenat în ele ajunge la 5–10px și nu
 * se mai citește (vezi capul lui BaraReclame.tsx). Asta e scrisă în HTML, cu
 * corpul literelor în `cqi` — procente din lățimea reclamei —, deci textul
 * rămâne mare și clar la orice lățime, fără nicio a doua variantă.
 *
 * FORMATUL e 1:2, adică 300×600 la lățimea maximă: „half page", formatul
 * standard de reclamă înaltă.
 *
 * ─── CE SCRIE, ȘI DE UNDE ─────────────────────────────────────────────────
 *
 * Tot din catalogul Solar One 09.2026, rândul „LICHIDARE STOC - PYTES V16 -
 * 16kWh, cu încălzire, IP66", 1590 €, secțiunea de acumulatori Low Voltage.
 * Nimic adăugat: fără „cel mai bun preț", fără garanții, fără termene. Dacă
 * produsul iese din catalog, reclama se scoate din app/page.tsx.
 *
 * Fără fotografie: V16 nu are poză în biblioteca media, iar poza altui model
 * Pytes pusă lângă „V16" ar arăta alt produs decât cel vândut. Locul pozei îl
 * ia cifra care îl definește, 16 kWh — aceeași idee ca pe cardurile fără poză.
 *
 * ─── CULORILE SUNT ALE BRANDULUI ──────────────────────────────────────────
 *
 * O reclamă de brand vorbește în culorile brandului, nu ale site-ului — exact
 * ca JPG-urile Deye și Canadian Solar din coloana de sus. Nuanțele sunt citite
 * din pixelii siglei (public/branduri/color/pytes.png), nu alese din ochi:
 * portocaliu #FF9100 și gri închis #333333. Fundalul e un pas mai închis decât
 * griul siglei, #1A1A1A, ca portocaliul să aibă contrast și ca text.
 *
 * Contraste (prag AA text normal 4,5:1):
 *   #FF9100 pe #1A1A1A ...... 7,72 ✓  „16 kWh"
 *   #1A1A1A pe #FF9100 ...... 7,72 ✓  eticheta și butonul
 *   alb pe #1A1A1A ......... 17,40 ✓  „PYTES V16", prețul
 *   #D4D4D4 pe #1A1A1A ..... 11,70 ✓  rândurile mici
 *
 * Sigla e varianta albă (public/branduri/pytes.png), cea de pe banda închisă de
 * sub hero: pe fundal închis, griul #333333 al siglei colorate n-ar avea
 * contrast.
 *
 * ─── DE CE PADDING-UL NU STĂ PE LINK ──────────────────────────────────────
 *
 * Linkul e containerul (`@container`), iar unitățile `cqi` se măsoară după
 * containerul STRĂMOȘ, niciodată după elementul pe care sunt scrise. Prima
 * variantă avea `p-[8cqi]` chiar pe link; fără alt container deasupra, `cqi` a
 * căzut pe lățimea ferestrei — 8% din 1906px, adică 152px pe fiecare latură.
 * Rezultatul, în captură: un dreptunghi negru de 305px, fără niciun pixel de
 * conținut. De-aia tot ce e măsurat în `cqi` stă în `div`-ul dinăuntru.
 *
 * ─── POZIȚIA: PE VERTICALA RECLAMELOR DE SUS ──────────────────────────────
 *
 * Aceleași variabile ca BaraReclame (`--bara-latime`, `--bara-stanga`) și același
 * prag de 1760px, deci marginile ei stânga și dreapta cad exact sub cele ale
 * reclamelor de lângă „Gama de produse".
 *
 * A AVUT O GEOMETRIE PROPRIE (`--reclama-latime` / `--reclama-dreapta`, prag
 * 1840px), împinsă spre fereastră. Motivul era banda de lichidare, care
 * derula atunci până la marginea containerului, cu 48px peste coloana de text,
 * iar cardul tăiat din dreapta ajungea sub reclamă. Între timp banda se oprește
 * exact la marginea coloanei de text (components/BandaOferte.tsx), deci motivul
 * a căzut — iar reclama mutată spre dreapta arăta desprinsă de coloana de sus.
 *
 * Distanța rămasă până la ultimul card, măsurată: ~31px la 1906px, 24px la
 * 1760px. La 1760 reclama are 240px, iar rândurile mici (5,2cqi) ~12,5px.
 *
 * `top-12` e `lg:pt-12` al secțiunii de lichidare: reclama pornește odată cu
 * mastheadul, la nivelul ștampilei „Valabile" — aceeași regulă ca
 * `--reclame-sus`.
 *
 * COLȚURI DREPTE pe reclamă, la cerere. A fost `rounded-xl`, raza suprafețelor
 * din site; dar reclamele din coloana de sus sunt imagini cu colțuri drepte,
 * iar una rotunjită printre ele se citea ca un card al site-ului, nu ca o
 * reclamă. Butonul (8px) și eticheta (6px) își păstrează razele, fiindcă sunt
 * comenzi și etichete, nu suprafața reclamei.
 *
 * La hover, doar un inel avo-600, ca la reclamele din BaraReclame: nimic nu se
 * ridică.
 */
const HREF = "/catalog/produs/lichidare-stoc-pytes-v16-16kwh-cu-incalzire-ip66";

export default function ReclamaPytes() {
  return (
    <Link
      href={HREF}
      aria-label="Pytes V16, acumulator de 16 kWh cu încălzire, IP66. Lichidare de stoc, 1.590 € fără TVA pe bucată. Vezi produsul."
      className="@container group absolute top-12 right-(--bara-stanga) z-30 hidden aspect-[1/2] w-(--bara-latime) overflow-hidden bg-[#1A1A1A] text-white transition-[box-shadow] duration-200 hover:ring-2 hover:ring-avo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600 min-[1760px]:block"
    >
      <div className="relative flex h-full flex-col p-[8cqi]">
        {/* Arcul din spatele cifrei — ecoul lui „e" din siglă. Doar decor: 15%
            opacitate, deci sub „16 kWh" fundalul se deschide abia perceptibil și
            contrastele de mai sus rămân valabile. */}
        <span
          aria-hidden
          className="absolute -right-[34cqi] top-[46cqi] size-[86cqi] rounded-full border-[7cqi] border-[#FF9100] opacity-15"
        />

        <Image src={siglaPytes} alt="" sizes="160px" className="relative h-auto w-[50cqi]" />

        <span className="relative mt-[10cqi] inline-flex w-fit items-center rounded-md bg-[#FF9100] px-[3cqi] py-[1.5cqi] text-[5.2cqi] font-bold uppercase tracking-wide text-[#1A1A1A]">
          Lichidare de stoc
        </span>

        <p className="relative mt-[7cqi] text-[12cqi] font-extrabold leading-none">PYTES V16</p>

        <p className="relative mt-[3cqi] flex items-baseline gap-[2cqi] leading-none text-[#FF9100]">
          <span className="text-[44cqi] font-extrabold tracking-tight">16</span>
          <span className="text-[13cqi] font-bold">kWh</span>
        </p>

        <p className="relative mt-[4cqi] text-[6cqi] font-medium leading-snug text-[#D4D4D4]">
          Acumulator cu încălzire
          <br />
          Protecție IP66
        </p>

        <div className="relative mt-auto">
          {/* Pe DOUĂ rânduri, nu alăturate. Alăturate, pe un rând flex, prețul
              se strângea ca să facă loc notei, iar la 281px ieșea „1.590" pe un
              rând și „€" pe următorul, cu „fără TVA / buc" rupt și el în două —
              măsurat în captură. Stivuite, prețul are toată lățimea și nu se
              mai rupe (`whitespace-nowrap`). */}
          <p className="leading-none">
            <span className="block whitespace-nowrap text-[13cqi] font-extrabold">1.590 €</span>
            <span className="mt-[2.5cqi] block text-[5.2cqi] font-medium text-[#D4D4D4]">
              fără TVA / buc
            </span>
          </p>

          {/* Nu e `<button>`: toată reclama e deja un link, iar un buton în link
              e invalid. E doar forma vizuală a țintei. La hover se schimbă
              culoarea, nimic altceva. */}
          <span className="mt-[5cqi] flex h-[16cqi] items-center justify-center rounded-lg bg-[#FF9100] text-[6cqi] font-bold text-[#1A1A1A] transition-colors duration-200 group-hover:bg-[#FFA733]">
            Vezi produsul
          </span>
        </div>
      </div>
    </Link>
  );
}
