import Image from "next/image";
import Link from "next/link";
import { economie, formatEconomie, type Oferta } from "@/lib/oferte";
import {
  BADGE,
  BADGE_CARD,
  BADGE_ECONOMIE,
  BADGE_LICHIDARE,
  BADGE_OFERTA,
  BUTON_CARD,
  CADRU_FOTO_PRODUS,
  CARD,
} from "../stiluri";

/**
 * Cardul unei oferte.
 *
 * A STAT ÎN OferteleLunii.tsx, scris o singură dată, în interiorul grilei. A
 * ieșit de acolo când grila a devenit bandă derulantă: banda are nevoie de aceleași
 * carduri, iar varianta comodă — să le desenez a doua oară, mai simple, pentru
 * bandă — e exact greșeala pe care paginile de catalog o fac deja, cu două
 * desene diferite pentru același produs.
 *
 * Markup-ul e mutat neschimbat, cu comentariile lui. Singura adăugare e linia
 * de economie, care e chiar motivul pentru care produsul apare în secțiune.
 *
 * Rămâne componentă de server: n-are stare, iar `next/image` și `next/link`
 * merg fără JavaScript trimis în browser. Banda dinafară e „use client",
 * dar primește cardurile deja randate, ca `children` — deci mișcarea costă
 * JavaScript, cardurile nu.
 */
const eur = (n: number) => n.toLocaleString("ro-RO");

export default function CardOferta({
  o,
  oferta = false,
}: {
  o: Oferta;
  /**
   * Produsul e pe pagina „OFERTELE LUNII" a catalogului — primește badge-ul
   * roșu „Ofertă". Îl dă secțiunea, nu datele: cardul se folosește și în banda
   * de lichidare și pe pagina ei, unde nu are ce căuta.
   */
  oferta?: boolean;
}) {
  return (
  <article
    className={`${CARD} group relative flex flex-col overflow-hidden`}
  >
    {/* Zona vizuală — aceeași proporție ca fotografia cardului de
        categorie, ca cele două grile să aibă același ritm. */}
    {/* Fundalul se schimbă odată cu conținutul, și nu din capriciu:
        `avo-50` a fost ales ca să susțină o CIFRĂ mare — un accent
        discret în spatele unui număr. Fotografiile de produs vin
        decupate pe alb, iar un dreptunghi alb așezat peste tenta
        albastră se vede ca o scăpare, nu ca o poză. Unde e poză,
        fundalul e alb; unde e cifră, rămâne exact ce era. */}
    {/* CONTURUL SE RUPEA ÎN COLȚURILE DE SUS, și de-aici venea.
        Cardul are `border` plus `rounded-xl` plus `overflow-hidden`, iar
        primul lui copil e un dreptunghi care umple toată lățimea, cu fundal
        propriu. Un asemenea copil e tăiat de colțurile rotunjite ale
        părintelui, iar tăietura e antialiasată: pe cei câțiva pixeli ai
        fiecărui colț, fundalul copilului se amestecă peste linia de 1px a
        conturului și o subțiază. Restul laturilor rămân intacte — de-aia
        conturul arăta neuniform, nu lipsă.

        DOUĂ REPARAȚII, pentru cele două cazuri:

        CU FOTOGRAFIE, fundalul alb se scoate cu totul. Nu e o pierdere: părintele
        e deja `bg-white`, deci copilul picta alb peste alb. Singurul lui efect
        real era să aibă ce se amesteca peste contur.

        FĂRĂ FOTOGRAFIE, unde `avo-50` chiar înseamnă ceva, fundalul rămâne, dar
        colțurile de sus primesc propria rază. 11px, nu 12: raza interioară a
        unui colț e cea exterioară minus grosimea conturului, iar aici conturul
        e de 1px. Cu 12 ar fi ieșit cu un pixel peste linie — exact ce reparăm. */}
    <div
      className={`relative ${CADRU_FOTO_PRODUS} ${o.imagine ? "" : "rounded-t-[11px] bg-avo-50"}`}
    >
      {/* ECONOMIA, adică motivul pentru care un preț de volum contează.

          E scrisă în EURO, nu în procent: la un invertor de 1.680 €, „7,3%" e
          o abstracție, „−123 €" e o sumă. Badge închis, nu colorat: aceeași
          rețetă ca „Lichidare stoc" din colțul opus, iar un verde de reducere
          ar fi fost al doilea accent pe un site care are unul singur.

          A STAT ÎN CORPUL CARDULUI, sub „600 € de la 12 buc", și de-acolo
          venea un card mai înalt decât vecinii. Coloana prețului avea trei
          rânduri — preț, preț de volum, badge — adică vreo 74px, lângă un
          buton de 44. Într-o bandă în care majoritatea produselor n-au preț de
          volum, cardul care îl avea ieșea cu 30px mai jos decât toate
          celelalte. Aici sus nu ocupă înălțime: preț plus preț de volum fac
          exact 44px (22 + 4 + 18), cât butonul, deci cardul are aceeași
          înălțime cu sau fără a doua cifră.

          Apare DOAR unde există economie. Pe pagina de lichidare nu o
          garantează nimic, iar fără condiție un produs fără a doua coloană de
          preț ar fi afișat „−0 € / buc". */}
      {/* ─── „OFERTĂ", ROȘU ────────────────────────────────────────────
          Singura excepție de la regula unui singur accent, și e cerută: pe
          „Ofertele lunii" cardurile trebuie să se citească dintr-o privire ca
          fiind la ofertă, iar un al treilea badge închis s-ar fi pierdut lângă
          celelalte două.

          FĂRĂ CIFRĂ. Catalogul nu dă un preț anterior pentru ofertele lunii,
          doar prețul de ofertă, deci un „−15%" ar fi inventat. Badge-ul spune
          exact ce spune catalogul — eticheta „OFERTĂ" de pe pagina lui.

          `#DC2626` scris ca valoare, nu `red-600`: în Tailwind v4 treapta aceea
          e oklch și iese #E7000B, altă nuanță decât cea măsurată.
            alb pe #DC2626 .... 4,83 ✓  (AA text normal 4,5)

          Stă primul în grup, în stânga, înaintea economiei: e motivul pentru
          care produsul e în secțiune; economia la volum e un detaliu de preț.
          Grupul se așază pe rând (`flex gap-1.5`) ca două badge-uri să nu se
          suprapună; la 280px, „Ofertă" + „−60 € / buc" ocupă ~150px, iar în
          dreapta rămâne loc pentru „Lichidare stoc". */}
      {/* PE TELEFON TOATE BADGE-URILE STAU ÎN ACEST GRUP, cu `flex-wrap`: la
          145–175px lățime, economia din stânga și „Lichidare" din dreapta se
          călcau. Grupul e mărginit la dreapta (`right-2`), deci ce nu încape
          trece pe rândul următor. De la `sm` grupul redevine cel de dinainte,
          iar „Lichidare stoc" se întoarce în colțul din dreapta. */}
      {oferta || economie(o) > 0 || o.disponibilitate === "Lichidare stoc" ? (
        <div className="absolute top-2 right-2 left-2 z-10 flex flex-wrap gap-1 sm:top-3 sm:right-auto sm:left-3 sm:flex-nowrap sm:gap-1.5">
          {oferta ? (
            <span className={`${BADGE} ${BADGE_CARD} ${BADGE_OFERTA}`}>
              Ofertă
            </span>
          ) : null}
          {economie(o) > 0 ? (
            <span className={`${BADGE} ${BADGE_CARD} ${BADGE_ECONOMIE}`}>
              −{formatEconomie(economie(o))} € / {o.unitate}
            </span>
          ) : null}
          {/* Varianta de telefon a lui „Lichidare stoc", scurtată, în grup. */}
          {o.disponibilitate === "Lichidare stoc" ? (
            <span className={`sm:hidden ${BADGE} ${BADGE_CARD} ${BADGE_LICHIDARE}`}>
              Lichidare
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Badge în exact poziția badge-ului „N produse". De la `sm` în sus.
          Clasele lui `BADGE` sunt scrise aici una câte una, fără `inline-flex`:
          `hidden` și `inline-flex` în aceeași listă s-ar fi anulat după ordinea
          din foaia de stil, deci imprevizibil. `sm:inline-flex` e cel din
          `BADGE`, doar mutat după prag. */}
      {o.disponibilitate === "Lichidare stoc" ? (
        <span className={`absolute top-3 right-3 z-10 hidden items-center rounded-md font-bold text-white whitespace-nowrap sm:inline-flex ${BADGE_CARD} ${BADGE_LICHIDARE}`}>
          Lichidare stoc
        </span>
      ) : null}
  
      {/* ── Fotografia, când există ──
          `object-contain`, nu `cover`: pozele sunt produse decupate,
          iar o tăiere pe margini le-ar reteza colțurile. E invers
          decât la cardurile de categorie, unde fotografiile sunt de
          ambianță și umplerea cadrului e tocmai ce se vrea.
  
          `pb-12` ferește poza de banda cu brand și SKU de dedesubt;
          fără el, produsul ar sta pe jumătate sub ea.
  
          Fără `alt` din WooCommerce se folosește denumirea produsului:
          e cea mai bună descriere pe care o avem, iar numele
          fișierului („SE-F16.webp") n-ar spune nimic unui cititor de
          ecran. */}
      {o.imagine ? (
        <div className="absolute inset-0 px-2 pt-7 pb-8 sm:p-4 sm:pb-12">
          <div className="relative h-full w-full">
            <Image
              src={o.imagine.url}
              alt={o.imagine.alt ?? o.nume}
              fill
              /* Pe telefon cardul are o jumătate de ecran (grilă de două) sau
                 mai puțin (banda de lichidare), deci 50vw ajunge. */
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 50vw, 330px"
              className="object-contain"
            />
          </div>
        </div>
      ) : (
      /* Cifra care ține locul pozei. Baseline comun și leading-none:
          unitatea stă lipită de cifră, ca într-o fișă tehnică, nu ca
          două cuvinte alăturate. */
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 pb-7 sm:px-4 sm:pb-10">
        {o.spec ? (
          <span className="flex items-baseline gap-0.5 text-gray-900 sm:gap-1">
            <span className="text-[30px] sm:text-[52px] font-extrabold leading-none">
              {o.spec.valoare}
            </span>
            <span className="text-[13px] sm:text-[18px] font-bold text-gray-600">
              {o.spec.unitate}
            </span>
          </span>
        ) : (
          /* Fără cifră, locul ei îl ia CODUL DE MODEL, pe mono.
           *
           * Verificat pe catalogul real: jumătate din produse n-au o
           * cifră de titlu în date, iar dintre cele patru oferte ale
           * lunii, două (SE-F16, HOPE 16.0LM-A1) n-o au — deși sunt,
           * amândouă, acumulatori de 16 kWh. Cazul nu e marginal,
           * deci varianta de rezervă trebuie să fie la fel de bună,
           * nu o umplutură.
           *
           * Brandul ar fi fost alegerea greșită: apare deja pe banda
           * de dedesubt, deci cardul l-ar fi spus de două ori, iar
           * „Growatt" scris mare nu deosebește două produse Growatt.
           * Codul de model chiar identifică — e ce se dictează la
           * telefon și ce se caută în catalog.
           *
           * Gramatica rămâne una singură: lucrul care identifică
           * produsul, scris mare. Se schimbă doar care e acela. */
          <span className="text-center font-mono text-[15px] sm:text-[30px] font-semibold text-gray-900 leading-tight break-all">
            {o.sku}
          </span>
        )}
      </div>
      )}
  
      {/* Banda de jos — poziția titlului din cardul de categorie.
          Brandul identifică, SKU-ul e ce se dictează la telefon; de
          aceea SKU-ul e pe mono, singurul loc din secțiune unde
          cifrele de lățime egală chiar contează. */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-gray-200 bg-white/70 px-2 py-1.5 sm:px-3 sm:py-2">
        {/* CINE CEDEAZĂ LOCUL, când rândul nu ajunge: codul, nu brandul.
            Era invers — brandul `truncate`, codul `shrink-0` — iar la un cod
            construit din denumire („PYTES-V16-16KWH-CU-INCALZIRE-IP66") brandul
            ajungea „P". Brandul e scurt și e ce identifică produsul dintr-o
            privire; codul lung se poate tăia cu „…", fiindcă întreg stă oricum
            în fișa produsului. */}
        <span className="shrink-0 text-[11px] font-bold text-gray-900 sm:text-[13px]">
          {o.brand}
        </span>
        {/* SKU-ul apare aici DOAR când sus NU stă el însuși. Când e
            el cifra de titlu, l-am scrie de două ori în același
            pătrat, la 30px și la 11px distanță de câțiva pixeli.
  
            Deci apare și când sus e o fotografie — atunci codul chiar
            lipsește din cadru, iar el e ce se dictează la telefon. */}
        {o.imagine || o.spec ? (
          <span className="min-w-0 truncate font-mono text-[9px] text-gray-600 sm:text-[11px]">
            {o.sku}
          </span>
        ) : null}
      </div>
    </div>
  
    {/* ── Corpul cardului ── */}
    {/* PE TELEFON (sub `sm`) cardul are ~170px, fiindcă stă câte două pe rând.
        Corpurile scad (titlu 12px, preț 17px), iar butonul coboară sub preț,
        pe toată lățimea: alături nu mai încape. De la `sm` fiecare clasă e cea
        de dinainte, deci desktopul e neatins. */}
    <div className="flex flex-1 flex-col p-2.5 sm:p-4">
      {/* Înălțime fixă pe două rânduri: denumirile din catalog au
          lungimi foarte diferite, iar fără ea blocul de preț ar sta la
          înălțimi diferite de la card la card. */}
      <h3 className="h-8 text-[12px] leading-4 font-semibold text-gray-900 line-clamp-2 sm:h-10 sm:text-[14px] sm:leading-snug">
        {o.nume}
      </h3>

      <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-end sm:justify-between sm:gap-2 sm:pt-4">
        {/* `min-h-8` pe telefon: 17 + 4 + 12 = 33px, cât prețul cu prag de
            volum. Fără el, un card fără a doua cifră ar avea butonul mai sus
            decât vecinul lui din grilă. */}
        <div className="flex min-h-[33px] shrink-0 flex-col justify-end sm:min-h-0">
          {/* `leading-none` pe rând, nu doar pe cifră: „€" (16px) și „/ buc"
              moșteneau înălțimea de rând 1,5, deci rândul ieșea de 24px, nu 22,
              iar cardul cu preț de volum rămânea cu 2px mai înalt decât vecinii. */}
          <span className="flex items-baseline gap-1 leading-none">
            {/* „LA CERERE" în catalog, deci nicio cifră de arătat. Scris la 16px,
                nu la 22 ca prețul: la 1024px cardul are ~200px, iar rândul îl
                împarte cu butonul „Vezi". Aceeași formulare ca în PDF. */}
            {o.pretLaCerere ? (
              <span className="text-[14px] font-extrabold text-gray-900 leading-none whitespace-nowrap sm:text-[16px]">
                La cerere
              </span>
            ) : (
              <>
                <span className="text-[17px] font-extrabold text-gray-900 leading-none sm:text-[22px]">
                  {eur(o.pret)}
                </span>
                <span className="text-[12px] font-bold text-gray-900 sm:text-[16px]">€</span>
                <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap sm:text-[12px]">
                  / {o.unitate}
                </span>
              </>
            )}
          </span>
  
          {/* Pragul de volum e singura a doua cifră reală din catalog
              și e exact ce deosebește un preț de distribuitor de unul
              de magazin. Lipsește la produsele fără coloana a doua. */}
          {o.pretVolum && o.prag ? (
            /* `leading-4` (16px) ține coloana prețului sub înălțimea butonului:
               22 + 4 + 16 = 42px, lângă 44. Cu înălțimea de rând moștenită,
               18px, ieșea 44 plus rotunjiri, iar cardul cu preț de volum
               rămânea cu 4px mai înalt decât vecinii — măsurat pe bandă. */
            <span className="mt-1 truncate text-[10px] leading-3 font-medium text-gray-500 sm:overflow-visible sm:text-[12px] sm:leading-4 sm:whitespace-nowrap">
              {eur(o.pretVolum)} € de la {o.prag}
            </span>
          ) : null}

          {/* Aici era badge-ul de economie. S-a mutat în colțul stâng de sus
              al fotografiei — motivul e scris acolo. */}
        </div>
  
        {/* Ținta e FIȘA PRODUSULUI. A fost categoria, cu motivul că
            /catalog/produs/<slug> nu exista; între timp există, iar un clic pe
            „HOPE 5.0L-B1" care deschide lista tuturor acumulatorilor îl punea
            pe om să-l caute a doua oară.

            Categoria rămâne doar rezerva pentru lista scrisă în cod, care n-are
            slug (vezi `slug` în lib/oferte.ts). `after:absolute after:inset-0`
            întinde linkul pe tot cardul, deci și clicul pe poză sau pe nume duce
            tot acolo. */}
        <Link
          href={o.slug ? `/catalog/produs/${o.slug}` : `/catalog/${o.categorie}`}
          className={`${BUTON_CARD} after:absolute after:inset-0`}
        >
          Vezi
        </Link>
      </div>
    </div>
  </article>
  );
}
