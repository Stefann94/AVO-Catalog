import Image from "next/image";
import Link from "next/link";
import { Package, Truck, FileText } from "lucide-react";
import type { Produs, Statut } from "@/lib/produs";
import { gasesteBrand } from "@/lib/branduri";
import CantitateProdus from "./CantitateProdus";

/**
 * Fișa de produs — versiunea fără chenare.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CE SE SCHIMBĂ FAȚĂ DE VARIANTA CU PANOURI
 * ──────────────────────────────────────────────────────────────────────────
 * Varianta anterioară punea fiecare bloc de conținut într-un panou alb cu
 * contur (`SUPRAFATA`), pe fundal #F8F9FA: unul pentru identitatea produsului,
 * unul pentru specificații, unul pentru preț. Trei chenare pe un ecran.
 *
 * Aici nu mai există niciunul. Pagina e albă, iar textul stă direct pe ea.
 *
 * DE CE E MAI BINE, nu doar altfel. Un chenar are rost când desparte lucruri
 * care ar putea fi confundate — patru carduri de categorie într-o grilă, de
 * exemplu, unde trebuie să se vadă unde se termină unul și începe altul. Pe o
 * fișă de produs nu e nimic de confundat: tot ce e pe ecran e despre ACELAȘI
 * produs. Chenarele nu separau conținut, doar îl împachetau, iar trei cutii
 * albe pe un gri deschis adaugă șase muchii care nu spun nimic.
 *
 * Ce rămâne să facă munca de separare: spațiul și, unde chiar e nevoie, o
 * linie de un pixel. Regula pe care o urmează întreg fișierul e simplă —
 * SPAȚIUL DESPARTE, LINIA MARCHEAZĂ O SCHIMBARE DE REGISTRU (de la
 * identificarea produsului la condițiile de cumpărare, de la preț la livrare).
 *
 * CE SE PĂSTREAZĂ, fiindcă nu ține de chenare: rampa `gray`, accentul unic
 * avo-600 pe elementele de decizie, cele trei raze (12px suprafețe, 8px
 * comenzi, 6px etichete), regula „la hover se schimbă doar culoarea", mono
 * doar pentru coduri. Un card scos nu e un motiv să se schimbe și paleta.
 *
 * ─── AȘEZAREA ─────────────────────────────────────────────────────────────
 *
 *   titlul .......... pe toată lățimea, deasupra amândurora
 *   rândul de sub ... statuturile în stânga, codul de produs în dreapta
 *   stânga (7/12) ... cifra care ține locul fotografiei, apoi specificațiile
 *   dreapta (5/12) .. prețul și condițiile de cumpărare, lipicioase la derulare
 *
 * Titlul stă deasupra fiindcă denumirile din catalog sunt lungi — „FELICITY
 * FLB48314TG1-H — 16 kWh, cu încălzire, IP65" are 51 de caractere — iar
 * strânse pe șapte coloane ar cădea pe trei rânduri lângă o coloană goală.
 *
 * CODUL DE PRODUS e sus, la dreapta, nu jos în specificații: e prima
 * informație pe care o cere cineva care sună să comande.
 *
 * ─── CE ȚINE LOCUL FOTOGRAFIEI ────────────────────────────────────────────
 *
 * Catalogul nu are imagini de produs — coloana `Images` nici nu există în
 * CSV-ul de import. În locul lor stă cifra care definește produsul: 460 Wp,
 * 16 kWh, 12 kW. Când produsul n-are o astfel de cifră (cleme, șuruburi,
 * cabluri — jumătate din catalog), locul îl ia codul de model, pe mono.
 *
 * Fără fundal colorat sub ea, spre deosebire de varianta cu panouri, unde
 * stătea pe `avo-50`. Tenta aceea era peretele cutiei; odată cutia scoasă, o
 * suprafață colorată în mijlocul unei pagini albe ar fi rămas singurul dreptunghi
 * de pe ecran, adică exact ce eliminăm. Cifra se ține singură din dimensiune.
 *
 * ─── DE CE PREȚUL NU E ROȘU ───────────────────────────────────────────────
 *
 * Modelul după care e făcută așezarea (magazinele mari de bricolaj) scrie
 * prețul cu roșu, fiindcă acolo prețul e mereu într-o promoție: are o cifră
 * tăiată deasupra și o dată până când ține. La noi nu există preț anterior —
 * catalogul e o listă de prețuri lunare, nu o campanie, iar `lib/oferte.ts`
 * explică pe larg de ce un preț tăiat ar fi o cifră inventată.
 *
 * Fără preț tăiat, roșul n-ar semnala nimic; ar fi doar o a doua culoare de
 * accent. Prețul rămâne gray-900, ca toate cifrele din site, iar albastrul
 * rămâne al butoanelor. Singurul lucru colorat din coloană e prețul la volum,
 * pe avo-700 — și e colorat fiindcă e chiar condiția comercială, nu decor.
 *
 * ─── BRANDUL, CA SIGLĂ, ÎN CAPUL COLOANEI DE PREȚ ─────────────────────────
 *
 * Numele brandului stătea scris cu majuscule mici sub titlu. Acum e sigla lui,
 * în culorile ei, sus în dreapta — pe același rând cu cifra prețului, lipită de
 * marginea coloanei, sub codul de produs.
 *
 * DE CE ACOLO. Sub titlu era o etichetă între alte etichete. În capul coloanei
 * de preț are un gol al ei și o muchie pe care să se alinieze: cea a codului de
 * produs, de deasupra. Iar cele două lucruri care se împart acum rândul sunt
 * exact cele două întrebări de identificare — cât costă și de la cine e.
 *
 * Siglele există în două seturi, fiindcă un fișier nu poate fi lizibil și pe
 * negru, și pe alb: siluete albe în `public/branduri/` pentru banda de sub
 * hero, originale colorate în `public/branduri/color/` pentru fundaluri
 * deschise. Aici se folosește al doilea. Brandurile fără fișier cad pe numele
 * scris, în același loc.
 *
 * ─── STATUTURILE, CA TEXT ─────────────────────────────────────────────────
 *
 * „Ofertă specială", „Lichidare stoc" — erau pastile cu fundal. Aici sunt text
 * majuscul colorat, despărțit de linii verticale subțiri. Aceeași informație,
 * fără încă o cutie mică pe un ecran din care tocmai am scos cutiile mari.
 *
 * Contraste (prag WCAG AA text normal 4,5:1):
 *   gray-900 #101828 pe alb ........ 17,75 ✓  titlu, preț, valori
 *   gray-600 #4A5565 pe alb ......... 7,56 ✓  unitatea de lângă cifră
 *   gray-500 #6A7282 pe alb ......... 4,84 ✓  etichete, note
 *   avo-700 #003B7D pe alb ......... 10,93 ✓  prețul la volum, linkuri
 *   alb pe avo-600 #004A99 .......... 8,61 ✓  butonul de ofertă
 * ══════════════════════════════════════════════════════════════════════════
 */

const eur = (n: number) => n.toLocaleString("ro-RO");

/**
 * Statutul, redus la culoarea textului.
 *
 * `ton` rămâne rolul, venit din lib/produs.ts; aici se decide doar cum arată.
 * Motivul pentru care aspectul nu stă în baza de date e scris acolo: cineva ar
 * alege în administrare un portocaliu sub pragul de contrast și nimeni n-ar
 * afla.
 */
const TON: Record<Statut["ton"], string> = {
  oferta: "text-avo-700",
  urgent: "text-gray-900",
  neutru: "text-gray-500",
};

/**
 * Un rând de condiție: iconiță, ce e, ce scrie.
 *
 * Iconița e `gray-400` — sub pragul de contrast pentru text, dar iconițele nu
 * sunt text: ele dublează o informație care e scrisă alături, deci pragul care
 * li se aplică e cel de 3:1 pentru elemente negrafice (gray-400 pe alb dă
 * 2,60, deci nici acela n-ar fi atins dacă ar purta informație singure —
 * exact de-aia niciuna nu poartă).
 */
function Rand({
  icon: Icon,
  titlu,
  detaliu,
}: {
  icon: typeof Package;
  titlu: string;
  detaliu?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-gray-900 leading-snug">{titlu}</p>
        {detaliu ? (
          <p className="mt-0.5 text-[13px] text-gray-500 leading-snug">{detaliu}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function FisaProdus({
  p,
  perioada,
}: {
  p: Produs;
  perioada?: { pana?: string | null };
}) {
  const caleCategorie = p.categorie ? `/catalog/${p.categorie.slug}` : "/catalog";
  const sigla = gasesteBrand(p.brand);

  return (
    <div className="bg-white pt-28 sm:pt-32 pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* ── Firul Ariadnei ─────────────────────────────────── */}
        <nav aria-label="Navigare" className="text-[13px] text-gray-500">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/catalog" className="font-medium transition-colors hover:text-avo-700">
                Catalog
              </Link>
            </li>
            {p.categorie ? (
              <>
                <li aria-hidden className="text-gray-300">/</li>
                <li>
                  <Link href={caleCategorie} className="font-medium transition-colors hover:text-avo-700">
                    {p.categorie.nume}
                  </Link>
                </li>
              </>
            ) : null}
            {p.subcategorie ? (
              <>
                <li aria-hidden className="text-gray-300">/</li>
                <li>
                  <Link
                    href={`/catalog/${p.categorie!.slug}/${p.subcategorie.slug}`}
                    className="font-medium transition-colors hover:text-avo-700"
                  >
                    {p.subcategorie.nume}
                  </Link>
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        {/* ── Titlul ─────────────────────────────────────────────
            `font-bold`, nu `font-extrabold` ca titlurile de secțiune. Un nume
            de produs are 40–60 de caractere și e scris la 34px: la greutatea
            800 rândul devine o bară neagră compactă, greu de parcurs. La 700
            respiră, și rămâne totuși cel mai greu text de pe pagină.

            `text-balance` împarte cuvintele egal între rânduri, în loc să lase
            unul singur atârnând jos. */}
        <h1 className="mt-4 text-[24px] sm:text-[30px] lg:text-[34px] font-bold text-gray-900 leading-tight text-balance">
          {p.nume}
        </h1>

        {/* ── Rândul de identificare ─────────────────────────────
            Statuturile în stânga, codul în dreapta. Fără chenare: statuturile
            sunt text majuscul colorat, despărțit de linii de un pixel, iar
            codul e mono fiindcă se dictează la telefon.

            SIGLA A STAT AICI și a plecat în capul coloanei de preț. Motivul e
            spațiul: rândul ăsta ține două lucruri scurte la capetele lui, iar
            sub codul de produs rămânea un gol de vreo 200px pe toată lățimea
            coloanei din dreapta. O marcă are nevoie de aer ca să se citească
            drept marcă, nu de un loc între o etichetă de statut și o linie
            despărțitoare. */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {p.statuturi.map((s, i) => (
              <span key={s.eticheta} className="flex items-center gap-3">
                {/* Linia desparte două statuturi, deci apare doar de la al
                    doilea. Condiția a inclus și `p.brand`, cât timp sigla
                    stătea în stânga lor. */}
                {i > 0 ? (
                  <span aria-hidden className="h-3 w-px bg-gray-200" />
                ) : null}
                <span className={`text-[12px] font-bold uppercase tracking-wider ${TON[s.ton]}`}>
                  {s.eticheta}
                </span>
              </span>
            ))}
          </div>

          {p.sku ? (
            <p className="shrink-0 text-[13px] text-gray-500">
              Cod produs:{" "}
              <span className="font-mono font-semibold text-gray-900">{p.sku}</span>
            </p>
          ) : null}
        </div>

        <div aria-hidden className="mt-5 h-px w-full bg-gray-200" />

        {/* ── Cele două coloane ──────────────────────────────────
            7 + 5, nu 8 + 4: coloana din dreapta ține un rând de comandă cu
            stepper și buton alături, care sub ~320px se rupe pe două rânduri.
            `gap-12` la lg — spațiul e singurul lucru care le desparte acum, iar
            unul strâmt le-ar face să pară o singură coloană dezordonată. */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* ── Stânga: identitatea și datele ───────────────── */}
          <div className="lg:col-span-7 min-w-0">
            {/* Zona vizuală: fotografia dacă există, altfel cifra.

                ORDINEA E FOTOGRAFIE ÎNTÂI, și rămâne așa chiar dacă acum doar
                o parte din catalog are poze. Acoperirea se face produs cu
                produs, în WooCommerce; codul nu trebuie atins pentru fiecare.

                `next/image`, spre deosebire de siglele de brand: astea sunt
                fotografii reale, servite de pe alt domeniu, unde optimizarea
                chiar contează. Domeniul e deja permis în next.config.ts.

                `sizes` e calculat, nu ghicit: coloana are 7 din 12 dintr-un
                container de 1280px cu 96px de padding, adică ~660px la xl. Sub
                `lg` coloana e cât ecranul. */}
            <div className="flex flex-col items-center justify-center py-8 sm:py-14">
              {p.imagine ? (
                <div className="relative aspect-square w-full max-w-[520px]">
                  <Image
                    src={p.imagine.url}
                    /* Fără `alt` din WooCommerce, denumirea produsului e
                       descrierea corectă a pozei — nu „imagine produs". */
                    alt={p.imagine.alt ?? p.nume}
                    fill
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-contain"
                    priority
                  />
                </div>
              ) : p.cifra ? (
                <span className="flex items-baseline gap-2">
                  <span className="text-[88px] sm:text-[120px] font-extrabold leading-none tracking-tight text-gray-900">
                    {p.cifra.valoare}
                  </span>
                  <span className="text-[28px] sm:text-[36px] font-bold text-gray-500">
                    {p.cifra.unitate}
                  </span>
                </span>
              ) : p.ancora ? (
                <span
                  className={`text-center leading-tight text-gray-900 ${
                    p.ancora.mono
                      ? "font-mono text-[32px] sm:text-[44px] font-semibold break-all"
                      : "text-[34px] sm:text-[48px] font-extrabold text-balance"
                  }`}
                >
                  {p.ancora.text}
                </span>
              ) : null}
            </div>

            {/* Descrierea apare doar dacă există. Pe catalogul de acum e goală
                peste tot — PDF-ul e o listă de prețuri, nu fișe tehnice. */}
            {p.descriere ? (
              <p className="max-w-2xl text-[15px] text-gray-600 leading-relaxed">
                {p.descriere}
              </p>
            ) : null}

            {/* Specificațiile — conținutul principal al paginii, nu un
                supliment. Într-un catalog fără poze și fără descrieri,
                atributele SUNT fișa.

                `dl` în grilă, nu `table`: sunt perechi etichetă–valoare, nu un
                tabel cu mai multe coloane. Liniile dintre rânduri sunt
                `gray-100`, mai deschise decât cele care despart registre —
                despart date de același fel, deci trebuie să se vadă mai puțin
                decât o schimbare de subiect. */}
            {p.specificatii.length > 0 ? (
              <section className={p.descriere ? "mt-10" : ""}>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
                  Specificații tehnice
                </h2>
                <dl className="mt-4 divide-y divide-gray-100 border-t border-gray-200">
                  {p.specificatii.map((a) => (
                    <div
                      key={a.nume}
                      className="grid grid-cols-1 sm:grid-cols-5 gap-1 sm:gap-4 py-3"
                    >
                      <dt className="sm:col-span-2 text-[13px] text-gray-500">{a.eticheta}</dt>
                      <dd className="sm:col-span-3 text-[14px] font-semibold text-gray-900">
                        {a.valoare}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>

          {/* ── Dreapta: prețul și condițiile ────────────────
              `sticky` de la lg în sus. La un produs cu multe atribute, tabelul
              din stânga depășește ecranul, iar prețul ar rămâne sus, în afara
              câmpului vizual, exact când omul termină de citit datele și vrea
              să acționeze. `top-28` ocolește navbar-ul fix. */}
          <aside className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            {/* ── Capul coloanei: prețul și marca ──────────────
                Cele două se împart la capetele rândului. E singurul loc din
                fișă unde ceva stă lipit de marginea din dreapta, și e
                justificat: sigla continuă coloana verticală începută de „Cod
                produs" din rândul de deasupra, deci cele două se aliniază pe
                aceeași muchie. Golul care era acolo devine locul mărcii.

                DOAR CIFRA ÎMPARTE RÂNDUL CU SIGLA, nu tot blocul de preț.
                Prețul la volum și nota de valabilitate rămân dedesubt, pe toată
                lățimea: „Prețul este valabil până la 30.09.2026, în limita
                stocului disponibil" ocupă aproape toată coloana, iar strâns
                lângă o siglă ar cădea pe patru rânduri.

                `items-start`: sigla se aliniază la marginea de sus a cifrei,
                nu la mijlocul ei. Ancorată sus, continuă linia codului de
                produs; centrată, ar pluti între preț și nimic. */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {p.pret ? (
                  /* Cifra și unitățile ei.

                     „fără TVA" și „/ unitate" stau stivuite la dreapta cifrei,
                     nu sub ea: sunt calificatori ai prețului, iar pe un rând
                     separat ar citi ca o a doua informație. `items-end` le
                     aliniază la baza cifrei. */
                  <div className="flex items-end gap-2.5">
                    <span className="flex items-baseline text-gray-900">
                      <span className="text-[44px] sm:text-[52px] font-extrabold leading-none tracking-tight">
                        {eur(p.pret)}
                      </span>
                      <span className="ml-1.5 text-[22px] sm:text-[26px] font-bold leading-none">
                        €
                      </span>
                    </span>
                    <span className="pb-1 text-[13px] font-medium leading-4 text-gray-500">
                      fără TVA
                      <br />/ {p.unitate}
                    </span>
                  </div>
                ) : (
                  <p className="text-[32px] font-extrabold leading-none text-gray-900">
                    Preț la cerere
                  </p>
                )}
              </div>

              {sigla ? (
                /* Sigla, în culorile ei.

                   DOUĂ SETURI DE SIGLE, NU UNUL. `public/branduri/` ține
                   siluetele albe, pentru banda de sub hero, care stă pe
                   slate-950; `public/branduri/color/` ține originalele
                   colorate, pentru fundalurile deschise. Aici se folosește al
                   doilea.

                   Nu e o dublare din neglijență, e singura soluție corectă. Un
                   fișier nu poate fi lizibil și pe negru, și pe alb: din cele
                   17 originale, 9 au fundal alb opac și 3 au cerneală închisă
                   pe transparent, deci pe banda întunecată ar fi ieșit ori
                   dreptunghiuri albe, ori nimic — de-aceea au fost făcute
                   siluete acolo. Pe pagina albă obiecția dispare: fundalul alb
                   al unui fișier se topește în pagină, iar cerneala închisă e
                   exact ce trebuie.

                   Aici a fost o vreme silueta albă trecută prin
                   `filter: brightness(0)`, ca să devină neagră și deci
                   vizibilă. Funcționa, dar dădea 17 sigle negre — corect
                   tehnic, sărac vizual: culoarea unei mărci e jumătate din ea.
                   Filtrul a căzut odată cu setul color.

                   `<img>`, nu `next/image`: siglele au lățimi foarte diferite
                   la aceeași înălțime de 120px, iar aici contează doar
                   înălțimea. Sunt mici (3–77 KB), deci trecerea prin
                   /_next/image n-ar câștiga nimic. Același raționament ca în
                   BandaBranduri.

                   `max-w-[45%]` e plasa de siguranță: siglele merg de la 120px
                   lățime (K2, un pătrat) la 819px (Dyness, un wordmark lung).
                   La 40px înălțime, Dyness ar cere 273px, adică mai mult decât
                   jumătate din coloană, și ar împinge prețul. Limita o strânge
                   pe înălțime, păstrându-i proporția.

                   `opacity-90`, nu 100: marca însoțește prețul, nu concurează
                   cu el. */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/branduri/color/${sigla.slug}.png`}
                  alt={sigla.nume}
                  height={40}
                  className="h-8 sm:h-10 w-auto max-w-[45%] shrink-0 object-contain object-right opacity-90"
                  decoding="async"
                />
              ) : p.brand ? (
                /* Rezerva: brand fără fișier în public/branduri/color — un nume
                   nou apărut în catalog înainte să-i punem sigla. Numele scris
                   e mai bun decât un gol. */
                <span className="shrink-0 pt-1 text-right text-[12px] font-bold uppercase tracking-wider text-gray-500">
                  {p.brand}
                </span>
              ) : null}
            </div>

            {p.pret ? (
              <>
                {/* A doua cifră reală din catalog — ce deosebește un preț de
                    distribuitor de unul de magazin. O are jumătate din catalog.
                    Era într-o pastilă `avo-50`; acum e text colorat, atât. */}
                {p.pretVolum && p.prag ? (
                  <p className="mt-2.5 text-[15px] leading-snug">
                    <span className="font-extrabold text-avo-700">
                      {eur(p.pretVolum)} €
                    </span>
                    <span className="text-gray-600">
                      {" "}/ {p.unitate} de la {p.prag}
                    </span>
                  </p>
                ) : null}

                {p.pretContainer ? (
                  <p className="mt-1.5 text-[13px] text-gray-500">
                    Comenzi container: preț {p.pretContainer}.
                  </p>
                ) : null}

                {/* Valabilitatea răspunde la „până când ține", nu la „din
                    când": cine e pe pagină azi știe deja că a început, iar un
                    interval întreg l-ar pune să extragă singur partea care îl
                    interesează. */}
                {perioada?.pana ? (
                  <p className="mt-3 text-[13px] text-gray-500 leading-relaxed">
                    Prețul este valabil până la {perioada.pana}, în limita stocului
                    disponibil.
                  </p>
                ) : null}
              </>
            ) : (
              /* „Preț la cerere" e scris sus, pe rândul siglei, exact acolo
                 unde ar fi stat cifra. Aici rămâne doar explicația. */
              <p className="mt-2.5 text-[13px] text-gray-500 leading-relaxed">
                Poziția se ofertează separat, în funcție de cantitate.
              </p>
            )}

            {/* Linie: de aici încolo nu mai e vorba de cât costă, ci de cum
                ajunge la tine. Singura schimbare de registru din coloană. */}
            <div aria-hidden className="my-6 h-px w-full bg-gray-200" />

            <div className="flex flex-col gap-4">
              {p.disponibilitate ? (
                <Rand
                  icon={Package}
                  titlu={p.disponibilitate}
                  detaliu="Disponibilitatea se confirmă la plasarea comenzii."
                />
              ) : null}

              <Rand
                icon={Truck}
                titlu="Livrare din depozit"
                detaliu="Termenul și costul se stabilesc în ofertă, în funcție de cantitate."
              />

              {p.sursaCatalog ? (
                <Rand icon={FileText} titlu="Sursa prețului" detaliu={p.sursaCatalog} />
              ) : null}
            </div>

            <p className="mt-6 text-[13px] text-gray-500">
              Se comandă la: <span className="font-semibold text-gray-900">{p.unitate}</span>
            </p>

            <div className="mt-3">
              <CantitateProdus
                unitate={p.unitate}
                pretVolum={p.pretVolum}
                prag={p.prag}
              />
            </div>

            {/* Rândul de acțiuni secundare, ca text, nu ca butoane: pe modelul
                după care e făcută pagina aici stau „Favorite / Compară /
                Distribuie". Niciuna dintre ele nu există în proiect, iar un
                buton care nu face nimic e mai rău decât lipsa lui. Rămâne
                singura acțiune reală: întoarcerea în categorie. */}
            <p className="mt-5 text-[13px]">
              <Link
                href={caleCategorie}
                className="font-semibold text-avo-700 transition-colors hover:text-avo-800"
              >
                Vezi toată categoria
                {p.categorie ? ` · ${p.categorie.nume}` : ""}
              </Link>
            </p>

            <p className="mt-6 text-xs text-gray-500 leading-relaxed">
              Preț în EUR, fără TVA. Taxa verde DEEE nu este inclusă (0,7 RON / kg).
              Reducerea de partener (Gold −10%, Platinum −15%) se aplică separat,
              prețului de catalog.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
