import Image from "next/image";
import Link from "next/link";
import { economie, type Oferta } from "@/lib/oferte";
import { BUTON_PLIN, CADRU_FOTO_CARD, CARD } from "../stiluri";

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

export default function CardOferta({ o }: { o: Oferta }) {
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
      className={`relative ${CADRU_FOTO_CARD} ${o.imagine ? "" : "rounded-t-[11px] bg-avo-50"}`}
    >
      {/* Badge în exact poziția badge-ului „N produse". */}
      {o.disponibilitate === "Lichidare stoc" ? (
        <span className="absolute top-3 right-3 z-10 inline-flex items-center h-7 px-2.5 rounded-md bg-gray-900 text-[11px] font-bold uppercase tracking-wide text-white">
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
        <div className="absolute inset-0 p-4 pb-12">
          <div className="relative h-full w-full">
            <Image
              src={o.imagine.url}
              alt={o.imagine.alt ?? o.nume}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 330px"
              className="object-contain"
            />
          </div>
        </div>
      ) : (
      /* Cifra care ține locul pozei. Baseline comun și leading-none:
          unitatea stă lipită de cifră, ca într-o fișă tehnică, nu ca
          două cuvinte alăturate. */
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-10">
        {o.spec ? (
          <span className="flex items-baseline gap-1 text-gray-900">
            <span className="text-[44px] sm:text-[52px] font-extrabold leading-none">
              {o.spec.valoare}
            </span>
            <span className="text-[18px] font-bold text-gray-600">
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
          <span className="text-center font-mono text-[26px] sm:text-[30px] font-semibold text-gray-900 leading-tight break-all">
            {o.sku}
          </span>
        )}
      </div>
      )}
  
      {/* Banda de jos — poziția titlului din cardul de categorie.
          Brandul identifică, SKU-ul e ce se dictează la telefon; de
          aceea SKU-ul e pe mono, singurul loc din secțiune unde
          cifrele de lățime egală chiar contează. */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-gray-200 bg-white/70 px-3 py-2">
        <span className="truncate text-[13px] font-bold text-gray-900">
          {o.brand}
        </span>
        {/* SKU-ul apare aici DOAR când sus NU stă el însuși. Când e
            el cifra de titlu, l-am scrie de două ori în același
            pătrat, la 30px și la 11px distanță de câțiva pixeli.
  
            Deci apare și când sus e o fotografie — atunci codul chiar
            lipsește din cadru, iar el e ce se dictează la telefon. */}
        {o.imagine || o.spec ? (
          <span className="shrink-0 font-mono text-[11px] text-gray-600">
            {o.sku}
          </span>
        ) : null}
      </div>
    </div>
  
    {/* ── Corpul cardului ── */}
    <div className="flex flex-1 flex-col p-4">
      {/* Înălțime fixă pe două rânduri: denumirile din catalog au
          lungimi foarte diferite, iar fără ea blocul de preț ar sta la
          înălțimi diferite de la card la card. */}
      <h3 className="h-10 text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2">
        {o.nume}
      </h3>
  
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <div className="flex shrink-0 flex-col justify-end">
          <span className="flex items-baseline gap-1">
            <span className="text-[22px] font-extrabold text-gray-900 leading-none">
              {eur(o.pret)}
            </span>
            <span className="text-[16px] font-bold text-gray-900">€</span>
            <span className="text-[12px] font-medium text-gray-500 whitespace-nowrap">
              / {o.unitate}
            </span>
          </span>
  
          {/* Pragul de volum e singura a doua cifră reală din catalog
              și e exact ce deosebește un preț de distribuitor de unul
              de magazin. Lipsește la produsele fără coloana a doua. */}
          {o.pretVolum && o.prag ? (
            <span className="mt-1 text-[12px] font-medium text-gray-500 whitespace-nowrap">
              {eur(o.pretVolum)} € de la {o.prag}
            </span>
          ) : null}

          {/* ECONOMIA, adică motivul pentru care produsul e în secțiune.
              Secțiunea nu mai arată ce a pus furnizorul pe copertă, ci ce
              are cea mai bună reducere la prag (vezi lib/oferte.ts). Dacă
              regula selectează după economie, cardul trebuie s-o și scrie
              — altfel omul vede patru cifre și niciun motiv.

              E scrisă în EURO, nu în procent, din același motiv pentru care
              ordonarea e după euro: la un invertor de 1.680 €, „7,3%" e o
              abstracție, „−123 €" e o sumă. Procentul rămâne regula de
              selecție; euro e ce se comunică.

              Badge închis, nu colorat: e aceeași rețetă ca „Lichidare
              stoc" de pe fotografie, iar un verde de reducere ar fi fost
              al doilea accent pe un site care are unul singur. */}
          {/* Badge-ul apare DOAR unde există economie. Cardul se folosește acum
              în două locuri: la „Ofertele lunii", unde selecția garantează un
              prag de volum, și pe pagina de lichidare, unde nu-l garantează
              nimic. Fără condiția asta, un produs de lichidare fără a doua
              coloană de preț ar fi afișat „−0 € / buc". */}
          {economie(o) > 0 ? (
            <span className="mt-1.5 inline-flex w-fit items-center rounded-md bg-gray-900 px-2 py-0.5 text-[11px] font-bold text-white">
              −{eur(Math.round(economie(o)))} € / {o.unitate}
            </span>
          ) : null}
        </div>
  
        {/* Ținta e categoria, nu produsul: /catalog/produs/<slug> nu
            există încă. Când apare fișa de produs, se schimbă doar
            calea. */}
        <Link
          href={`/catalog/${o.categorie}`}
          className={`${BUTON_PLIN} after:absolute after:inset-0`}
        >
          Vezi
        </Link>
      </div>
    </div>
  </article>
  );
}
