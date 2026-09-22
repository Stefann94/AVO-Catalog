import Link from 'next/link';
import { incarcaOferte, incarcaProduseCatalog } from '@/lib/oferte';
import { incarcaBaraFiltre } from '@/lib/panou';
import { incarcaToateProdusele } from '@/lib/produs';
import CardOferta from '@/components/oferte/CardOferta';
import { incarcaPerioadaCatalog } from '@/lib/perioada';
import HeroCatalog from '@/components/catalog/HeroCatalog';
import MeniuCategorii from '@/components/catalog/MeniuCategorii';

/*
 * Tipul categoriilor a plecat de aici, odată cu GET_CATEGORIES_QUERY: meniul
 * le primește acum din `incarcaBaraFiltre()` (lib/panou.ts), deja ierarhizate
 * și cu totalurile adunate. Tipul produselor l-a urmat mai demult — le dă
 * `incarcaProduseCatalog()` din lib/oferte.ts, deja în forma cardului.
 */

// Catalogul se revalidează o dată pe oră, ca și restul interogărilor GraphQL.
export const revalidate = 3600;

/** „1 produs", „2 produse", „20 de produse" — acordul românesc de după 19. */
const produse = (n: number) =>
  `${n} ${n === 1 ? 'produs' : n % 100 >= 20 || n % 100 === 0 ? 'de produse' : 'produse'}`;

export default async function CatalogPage() {
  // În paralel: n-au nicio dependență între ele.
  // `toateProdusele` e pentru ferestrele rândului de categorii: grila arată
  // doar 50 de produse, iar ferestrele au nevoie de câte unul din FIECARE
  // categorie. Harta e aceeași pe care o construiesc fișele de produs.
  const [products, bara, perioada, oferte, toateProdusele] = await Promise.all([
    incarcaProduseCatalog(),
    incarcaBaraFiltre(),
    incarcaPerioadaCatalog(),
    incarcaOferte(),
    incarcaToateProdusele(),
  ]);

  const categorii = bara.categorii;
  const totalProduse = categorii.reduce((s, c) => s + c.produse, 0);
  // Reperul riglelor de pondere din meniul din stânga: categoria cea mai mare
  // are rigla plină. `1` ca plasă, ca o listă goală să nu împartă la zero.
  const maxProduse = Math.max(1, ...categorii.map((c) => c.produse));

  return (
    /* Pagina începe EXACT sub bara fixă (`--inaltime-navbar`, care are trei
       înălțimi — vezi app/globals.css), fiindcă primul lucru de sub ea e acum
       bannerul, pe toată lățimea. Aerul de 2rem / 3rem pe care îl avea pagina
       sus s-a mutat pe învelișul catalogului, sub rândul de categorii. */
    <div className="min-h-screen bg-slate-50 pt-(--inaltime-navbar)">
      {/* ── Bannerul: ofertele lunii, ca reclamă ── */}
      <HeroCatalog eticheta={perioada.eticheta} oferte={oferte} />

      {/* ── Rândul de categorii, cu subcategoriile la hover ──
          Aceleași date ca meniul din stânga, care rămâne. */}
      <MeniuCategorii categorii={categorii} produse={toateProdusele} />

      {/* ── Catalogul: meniul din stânga și grila, neschimbate ── */}
      <div className="pt-8 lg:pt-12 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-12">
      {/* Coloana de categorii trece lângă grilă abia de la `lg`. La `md`, cum
          era, îi lua grilei 256px din 720 și rămâneau două carduri de ~200px,
          adică mai înghesuite decât pe un singur rând. */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12">

        {/* ── Meniul de categorii ──────────────────────────────────────────

            ─── CIFRELE ERAU GREȘITE, ȘI DE UNDE ────────────────────────────
            Lista venea din GET_CATEGORIES_QUERY: toate cele ~27 de termene,
            alfabetic, cu `count` din WooCommerce. Numai că `count` numără doar
            produsele puse DIRECT pe termen, iar importul le pune în
            subcategorii. De-aia „Accesorii", „Invertoare", „Monitorizare &
            Smart Devices" și „Sisteme de Montaj" arătau 0, deși pagina lor avea
            produse — 4, 35, 8 și 51.

            Acum datele sunt cele ale barei de filtre de pe prima pagină
            (`incarcaBaraFiltre`, lib/panou.ts): totalul părintelui e suma cu
            copiii, ordinea e cea din catalogul tipărit, iar subcategoriile stau
            sub părintele lor, nu amestecate alfabetic printre categorii.

            ─── MAI MIC ─────────────────────────────────────────────────────
            Coloana a scăzut de la 240/256px la 224/240px, iar rândurile de la
            16px la 13px (categorie) și 12px (subcategorie), aceeași scară de
            corp ca bara de pe prima pagină. Hover-ul e avo, nu `blue-600`, pe
            care globals.css îl interzice. Desenul de acum (colțuri drepte,
            rigla de sus, riglele de pondere) e explicat la panou.

            ─── BARA DE DERULARE ────────────────────────────────────────────
            Opt categorii cu subcategoriile lor fac ~30 de rânduri, mai mult
            decât încape pe un laptop. Panoul are înălțimea plafonată la
            fereastră; titlul și totalul stau fix, iar între ele lista se
            derulează cu bara subțire `derulare-avo` (app/globals.css), aceeași
            ca pe prima pagină. `overscroll-contain` ține derularea în panou:
            ajunsă la capăt, nu pornește să deruleze toată pagina.

            ─── SUB `lg` ────────────────────────────────────────────────────
            Coloana nu mai are unde sta, iar lista verticală ar fi primul lucru
            din pagină — măsurat la 960px, 800px de nume înainte de primul
            produs. Rămâne un rând de etichete care se rupe pe rânduri, dar doar
            cu cele opt categorii de nivel 1: cu subcategorii ar fi trei ecrane
            de etichete pe telefon. Subcategoriile se găsesc pe pagina
            categoriei. */}
        {/* LĂȚIMEA: 240px la `lg`, 288px la `xl`. A trecut prin 224/240, care
            lângă o grilă de carduri de ~280px arăta ca o notă de subsol, nu ca
            meniul paginii. La 288px, cardurile de la 1280 au ~266px — rândul de
            preț („3,79 € de la 12 buc" + „Vezi") cere ~192 din cei 234
            disponibili, deci încape. La `lg` grila are două coloane (~312px),
            deci acolo lățimea nu costă nimic. */}
        <aside className="w-full lg:w-60 xl:w-72 shrink-0">
          {/* Sub `lg`: etichetele. Colțuri drepte, ca panoul de la `lg`: e
              același meniu, doar strâns pe rânduri. */}
          <nav aria-label="Categorii" className="lg:hidden">
            <ul className="flex flex-wrap gap-2">
              {categorii.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/catalog/${c.slug}`}
                    className="flex items-center gap-2 border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] font-semibold text-gray-900 transition-colors hover:border-avo-600 hover:text-avo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
                  >
                    {c.nume}
                    <span className="text-[12px] font-bold text-gray-500">{c.produse}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* De la `lg`: panoul lipit la derulare, cu înălțimea plafonată.

              PLAFONUL E 600px, NU FEREASTRA. A fost întâi `100vh` minus bara de
              sus și 3rem, adică tot ecranul: pe un monitor de 900px panoul
              cobora până la marginea de jos, o coloană albă lungă care arăta ca
              o a doua pagină. Apoi 480px, aliniat cu primul rând de carduri —
              dar acolo încăpeau abia trei categorii întregi, iar panoul părea
              prea mic pentru pagină.

              600px e între ele: la 900px de fereastră rămân ~150px liberi sub
              panou, deci nu atinge marginea ecranului, și încap cam patru
              categorii cu subcategoriile lor. Restul listei se derulează
              înăuntru.

              `min()` păstrează regula veche ca plasă: pe o fereastră mai joasă
              de ~750px, panoul se strânge în continuare la ce încape, în loc să
              iasă din ecran. */}
          <nav
            aria-label="Categorii"
            className="sticky top-[calc(var(--inaltime-navbar)+1.5rem)] hidden max-h-[min(600px,calc(100vh-var(--inaltime-navbar)-3rem))] flex-col overflow-hidden border border-gray-200 border-t-2 border-t-gray-900 bg-white lg:flex"
          >
            {/* ─── CUM E DESENAT ───────────────────────────────────────────────
                Ca o pagină de cuprins dintr-un catalog tipărit, nu ca un widget.

                COLȚURI DREPTE ȘI O LINIE DE CERNEALĂ SUS. Panoul nu mai are rază
                și nici umbră: chenar gray-200 pe trei laturi, iar sus 2px
                gray-900 — rigla cu care se deschide o secțiune pe hârtie. Fără
                fond colorat în antet: ierarhia o dau rigla și corpul titlului.

                FIECARE CATEGORIE ARE O RIGLĂ DE PONDERE, de 2px, sub nume. E
                lungă cât partea categoriei din cea mai mare dintre ele — „Sisteme
                de Montaj" (51) plină, „Echipamente Conversie & Comutare" (3) un
                rest. Nu e ornament: arată dintr-o privire unde e grosul
                catalogului, informație pe care cifra singură o dă abia după ce
                citești toate opt. În repaus e gri; la hover devine avo-600.

                HOVER-UL NU MIȘCĂ NIMIC. Se colorează numele, cifra, rigla și o
                dungă de 2px pe marginea din stânga, care există mereu,
                transparentă. La subcategorii dunga e un segment din linia de
                ghidaj, în dreptul rândului atins. Fără fundal: un gri ar fi
                culoarea paginii, iar un albastru pe tot rândul ar concura cu
                butoanele „Vezi" din grilă.

                Focusul e desenat înăuntru (`-outline-offset-2`): panoul are
                `overflow-hidden`, iar un contur în afara rândului s-ar tăia.

                Contraste (prag AA 4,5:1):
                  gray-900 pe alb .......... 17,75 ✓  titlul, numele
                  gray-600 pe alb ........... 7,56 ✓  eticheta, subcategoriile
                  gray-500 pe alb ........... 4,84 ✓  cifrele subcategoriilor
                  avo-700 pe alb ........... 10,93 ✓  rândul atins */}
            <div className="shrink-0 px-5 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                {perioada.eticheta ? `Catalog ${perioada.eticheta}` : 'Catalog'}
              </p>
              <h2 className="mt-1 text-[20px] font-extrabold leading-tight tracking-tight text-gray-900">Categorii</h2>
              <div aria-hidden className="mt-4 h-px bg-gray-200" />
            </div>

            <div className="derulare-avo min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {categorii.length === 0 ? (
                <p className="px-5 py-3 text-[13px] text-gray-500">Nicio categorie găsită.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {categorii.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/catalog/${c.slug}`}
                        className="group relative block px-5 pt-3 pb-3 transition-colors before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-transparent before:transition-colors hover:before:bg-avo-600 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-avo-600"
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="text-[13px] leading-snug font-bold text-gray-900 transition-colors group-hover:text-avo-700">
                            {c.nume}
                          </span>
                          <span className="min-w-[2.25ch] shrink-0 text-right text-[12px] font-semibold text-gray-600 transition-colors group-hover:text-avo-700">
                            {c.produse}
                          </span>
                        </span>
                        {/* Rigla de pondere. Minimum 3%, ca o categorie mică să
                            aibă totuși un semn. FĂRĂ PISTĂ GRI sub ea: pista
                            plină ajungea la 10px deasupra liniei dintre
                            categorii și, în captură, se citeau două linii. */}
                        <span aria-hidden className="mt-2 block h-0.5">
                          <span
                            className="block h-full bg-gray-300 transition-colors group-hover:bg-avo-600"
                            style={{ width: `${Math.max(3, Math.round((c.produse / maxProduse) * 100))}%` }}
                          />
                        </span>
                      </Link>

                      {/* Subcategoriile. Linia de ghidaj cade exact sub marginea
                          din stânga a numelui categoriei (20px): numele lungi se
                          rup pe două rânduri, iar fără linie al doilea rând ar
                          pierde ierarhia. Pseudo-elementul fiecărui rând vine
                          după al listei în DOM, deci segmentul colorat se
                          desenează peste linia gri.

                          HOVER-UL SE ÎNGROAȘĂ, la cerere: numele și cifra trec
                          pe bold și pe avo-600 (8,61 pe alb ✓), iar segmentul de
                          ghidaj de la 1px la 2px. Grosimea în plus n-are voie să
                          mute nimic, deci numele își rezervă din start lățimea
                          variantei bold: un `::after` invizibil, înalt de 0, cu
                          același text (`data-nume`), în aceeași coloană de grid.
                          Fără el, bold-ul lățea numele cu câțiva pixeli, iar
                          „Acumulatori High-Voltage" putea sări pe al doilea
                          rând sub mouse. Cifra are deja coloană proprie
                          (`min-w` + `text-right`). */}
                      {c.subcategorii.length > 0 ? (
                        <ul className="relative -mt-1 pb-2.5 before:absolute before:top-0 before:bottom-2.5 before:left-5 before:w-px before:bg-gray-200">
                          {c.subcategorii.map((s) => (
                            <li key={s.slug}>
                              <Link
                                href={`/catalog/${c.slug}/${s.slug}`}
                                className="group relative flex items-baseline justify-between gap-3 py-[5px] pr-5 pl-9 transition-colors before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-transparent before:transition-colors hover:before:w-0.5 hover:before:bg-avo-600 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-avo-600"
                              >
                                <span
                                  data-nume={s.nume}
                                  className="grid text-[12px] leading-snug text-gray-600 transition-colors after:invisible after:h-0 after:overflow-hidden after:font-bold after:content-[attr(data-nume)] group-hover:font-bold group-hover:text-avo-600"
                                >
                                  {s.nume}
                                </span>
                                <span className="min-w-[2.25ch] shrink-0 text-right text-[11px] text-gray-500 transition-colors group-hover:font-bold group-hover:text-avo-600">
                                  {s.produse}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Totalul, fix sub zona derulabilă: cât ține catalogul. Se
                calculează din categoriile afișate, nu dintr-o constantă, deci
                se mută odată cu lista. */}
            <p className="shrink-0 border-t border-gray-200 px-5 py-3 text-[11px] text-gray-500">
              <span className="font-semibold text-gray-900">{produse(totalProduse)}</span>
              {' '}în {categorii.length} categorii
            </p>
          </nav>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="mb-8">
            <h1 className="text-[28px] sm:text-[34px] lg:text-4xl font-bold text-slate-900 mb-2 leading-tight">Catalog Echipamente</h1>
            <p className="text-[15px] sm:text-base text-slate-500">Vizualizează portofoliul nostru complet de sisteme fotovoltaice.</p>
          </div>

          {/* ── Grila ────────────────────────────────────────────────────────
              CARDUL E CEL DE PE PRIMA PAGINĂ (components/oferte/CardOferta.tsx):
              aceeași poză pe alb, aceeași bandă cu brand și cod, același preț cu
              prețul de volum dedesubt, aceleași badge-uri, același buton. Aici
              era un al doilea desen pentru același produs — fond slate-100,
              eticheta categoriei în blue-600, poza care se mărea la hover,
              „Fără Imagine" scris în gol —, adică exact greșeala pe care cardul
              acela o numește în capul lui.

              Badge-ul roșu „Ofertă" vine din `featured` (`laOferta`), ca pe
              fișa produsului. Pe prima pagină îl dă secțiunea „Ofertele lunii".

              ─── TREI COLOANE DE LA `xl`, NU DE LA `lg` ──────────────────────
              Cu meniul de categorii alături, la 1024px trei coloane dau carduri
              de ~200px. Cardul vechi supraviețuia acolo lăsând rândul de preț
              să se rupă; cel nou e desenat pentru ~280px, cât are pe prima
              pagină, iar la 200px s-a văzut în captură: „3,79 € de la 12 buc"
              (care nu se rupe) împingea butonul „Vezi" cu ~13px peste padding,
              iar la cardurile fără poză badge-ul de economie călca pe cifră.

              Între 1024 și 1279 grila are două coloane, de la 1280 trei. Sub
              `lg` rămâne cum era: meniul nu stă alături, deci două coloane au
              ~290px. */}
          {/* Pe telefon două pe rând, ca pe prima pagină: cardul are acolo o
              variantă compactă (vezi components/oferte/CardOferta.tsx). */}
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
            {products.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-lg text-slate-500 font-medium mb-2">Nu există produse în baza de date WooCommerce momentan.</p>
                <p className="text-sm text-slate-400">Așteptăm finalizarea importului CSV...</p>
              </div>
            ) : (
              products.map((o) => <CardOferta key={o.slug ?? o.sku} o={o} oferta={o.laOferta} />)
            )}
          </div>
        </main>

      </div>
      </div>
    </div>
  );
}
