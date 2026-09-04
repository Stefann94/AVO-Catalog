import Link from "next/link";
import type { CSSProperties } from "react";
import { BUTON_PLIN, SUPRAFATA, dimensiuneTitlu } from "./stiluri";

/**
 * Condiții B2B — motorul comercial al site-ului, ca secțiune proprie.
 *
 * ─── DE CE EXISTĂ ─────────────────────────────────────────────────────────
 *
 * Asta e informația care deosebește un site de distribuitor de un magazin
 * online. Până acum stătea într-un banner care se rotea (components/BannerB2B),
 * adică într-un loc unde: nu se poate căuta cu Ctrl+F, nu se poate da link,
 * nu se poate citi în întregime fără să aștepți, și dispare din pagină după
 * șapte secunde. Trei mesaje care se ascund unul pe altul nu sunt o secțiune,
 * sunt un panou publicitar.
 *
 * Bannerul NU e șters de aici. Rămâne în proiect, nefolosit, până se decide ce
 * face cu el — poate ajunge o bandă de anunțuri deasupra navbar-ului, unde
 * rotirea chiar are sens. Secțiunea asta preia doar conținutul comercial.
 *
 * ─── IDEEA CARE ORGANIZEAZĂ SECȚIUNEA ─────────────────────────────────────
 *
 * Sunt DOUĂ reduceri, nu una, iar ele vin din surse complet diferite:
 *
 *   după CINE EȘTI ..... statutul de partener, Gold −10% / Platinum −15%,
 *                        aplicat prețului de catalog
 *   după CÂT COMANZI ... a doua coloană de preț din catalog, cu pragul ei
 *                        (4 paleți la panouri, 12 bucăți la restul)
 *
 * Sunt axe independente: statutul nu se schimbă cu volumul comenzii, iar
 * pragul de volum nu depinde de statut. De-aia stau în două carduri alăturate,
 * nu într-o listă comună de „avantaje" — o listă ar sugera că se adună.
 *
 * Comanda la container e a treia treaptă a axei de volum, nu o a treia
 * reducere: acolo catalogul renunță la grilă și scrie „PREȚ LA CERERE".
 *
 * ─── DE UNDE VIN CIFRELE ──────────────────────────────────────────────────
 *
 * Nicio cifră de aici nu e inventată în scop comercial. Fiecare are o sursă în
 * proiect, iar cine schimbă textul e obligat să păstreze regula:
 *
 *   −10% / −15% ....... meniul „Parteneri B2B" din components/Navbar.tsx,
 *                       unde scrie deja „Cont Gold -10%" și „Cont Platinum -15%"
 *   4 paleți / 12 buc . tools/catalog-import/parse-catalog.js, linia care
 *                       scrie pragul pe fiecare produs:
 *                         prag: sect.scheme === 'paleti' ? '4 paleți' : '12 buc'
 *                       iar `scheme: 'paleti'` îl au, în sections.js, exact
 *                       cele cinci secțiuni de panouri fotovoltaice
 *   preț la cerere .... același fișier, câmpul `container`, pus pe produsele
 *                       care au „PRET LA CERERE" în locul coloanei a doua
 *   per produs ........ regula e deja scrisă în subsolul „Ofertelor lunii":
 *                       pragul se aplică pe cantitatea comandată per produs
 *   EUR, fără TVA ..... subsolul secțiunii „Gama de produse"
 *
 * CE NU SCRIE AICI, deși ar suna bine: că cele două reduceri se cumulează.
 * Nu știm asta din nicio sursă din proiect, iar o singură ofertă care nu se
 * potrivește cu ce scrie pe site costă mai mult decât câștigă propoziția.
 * Secțiunea spune deschis că se confirmă în ofertă.
 *
 * ─── FĂRĂ JAVASCRIPT ──────────────────────────────────────────────────────
 *
 * Server component curat: fără stare, fără date din WooCommerce, fără nimic
 * trimis în browser. Condițiile comerciale sunt o structură permanentă, nu
 * conținut lunar — iar secțiunea nu depinde de niciun încărcător din lib/,
 * deci nu se strică dacă WordPress nu răspunde.
 *
 * ─── LIMBAJUL VIZUAL ──────────────────────────────────────────────────────
 *
 * Regulile secțiunii „Gama de produse" se aplică fără excepție și aici, ele
 * sunt ce ține site-ul să arate ca un singur obiect:
 *
 *   rampa neutră e `gray`, nu `slate`
 *   conturul face munca, nu umbra — 1px, `shadow-sm`, atât
 *   un singur accent, avo-600, și doar pe elementele de decizie
 *   trei raze: 12px suprafețe · 8px comenzi · 6px etichete
 *   la hover se schimbă DOAR culoarea
 *
 * DE CE GOLD ȘI PLATINUM NU SUNT AURII ȘI ARGINTII. În navbar, cele două au
 * pastile galbenă și gri, iar butonul „en-gros" e pe un degrade emerald. Sunt
 * rămășițe dinaintea paletei; nu se propagă aici. Cifra reducerii e gray-900,
 * ca orice cifră din site — prețurile din carduri sunt tot gray-900, fiindcă
 * sunt informație, nu acțiune. Albastrul rămâne al butoanelor.
 *
 * Diferența dintre cele două niveluri se vede din cifră (−10% față de −15%),
 * care e și singurul lucru care chiar diferă. Două culori decorative ar spune
 * mai puțin decât cifra și ar aduce în secțiune un al doilea și un al treilea
 * accent, care nu înseamnă nimic.
 *
 * FUNDALUL e #F8F9FA, ca la „Gama de produse". Pe pagină iese alternanța
 * gri → alb → gri, iar secțiunea se desprinde de „Ofertele lunii" de deasupra
 * fără nicio linie despărțitoare.
 *
 * NU e o secțiune închisă, deși e tentant pentru „motorul comercial": sub ea
 * urmează footerul, care e pe gray-800. Două blocuri întunecate lipite ar face
 * ca secțiunea să se citească drept capul footerului, nu drept conținut.
 *
 * Contraste (prag WCAG AA text normal 4,5:1):
 *   gray-900 #101828 pe alb ........ 17,75 ✓  titluri, cifrele reducerii
 *   gray-900 pe #F8F9FA ............ 16,95 ✓  titlul secțiunii
 *   gray-500 #6A7282 pe alb ......... 4,84 ✓  etichete, note de subsol
 *   avo-700 #003B7D pe avo-50 ...... 11,74 ✓  valoarea treptei, pe pastilă
 *   alb pe avo-600 #004A99 .......... 8,61 ✓  butonul principal
 *   avo-700 pe alb ................. 10,93 ✓  textul butonului secundar la hover
 */

const TITLU = "Condiții B2B pentru companii și distribuitori";

/**
 * Butonul secundar.
 *
 * E declarat aici, nu în components/stiluri.ts, fiindcă deocamdată e folosit
 * într-un singur loc, iar o rețetă comună pentru un singur consumator e doar
 * indirecție. Locul lui e acolo, lângă BUTON_PLIN, în clipa în care apare al
 * doilea: a doua secțiune care are nevoie de un buton secundar îl MUTĂ, nu îl
 * copiază.
 *
 * Aceeași cutie ca butonul plin — 44px, 8px rază, aceleași dimensiuni de text —
 * ca cele două să stea alături fără să pară din familii diferite. Diferă doar
 * suprafața: alb cu contur, în loc de albastru plin.
 *
 * La hover se schimbă doar culoarea (contur și text), ca peste tot. Nu se
 * umple cu albastru: ar deveni identic cu butonul principal exact în momentul
 * în care omul trebuie să aleagă între ele.
 */
const BUTON_SECUNDAR =
  "inline-flex items-center justify-center gap-2 shrink-0 " +
  "h-11 px-5 rounded-lg " +
  "bg-white text-gray-900 text-[14px] font-semibold " +
  "border border-gray-300 " +
  "transition-colors duration-200 " +
  "hover:border-avo-600 hover:text-avo-700 active:text-avo-800 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600";

/**
 * Cele două niveluri de partener.
 *
 * Reducerile sunt scrise ca text, nu calculate: în catalog nu există o formulă
 * din care să iasă 10 și 15, sunt două valori comerciale fixate.
 */
const STATUTURI = [
  { nume: "Gold", reducere: "−10%" },
  { nume: "Platinum", reducere: "−15%" },
];

/**
 * Scara de volum, cu trei trepte.
 *
 * Ordinea e crescătoare și nu e o alegere de prezentare: exact așa arată o
 * poziție din catalog citită de la stânga la dreapta — prima coloană, a doua
 * coloană, iar acolo unde a doua coloană spune „PREȚ LA CERERE", treapta a
 * treia. Prezentarea urmează documentul, nu invers.
 */
const TREPTE = [
  {
    treapta: "01",
    nume: "Preț de catalog",
    valoare: "orice cantitate",
    detaliu:
      "Prima coloană de preț. E prețul de listă al lunii curente, fără condiție de cantitate.",
  },
  {
    treapta: "02",
    nume: "Preț la volum",
    valoare: "4 paleți · 12 buc",
    detaliu:
      "A doua coloană de preț. Pragul e de 4 paleți la panourile fotovoltaice și de 12 bucăți la invertoare, acumulatori, sisteme de stocare, stații de încărcare, smart devices și sisteme de montaj.",
  },
  {
    treapta: "03",
    nume: "Comandă container",
    valoare: "preț la cerere",
    detaliu:
      "Pozițiile care au „PREȚ LA CERERE” în locul coloanei a doua nu intră în grilă: se ofertează separat, pe comandă.",
  },
];

/**
 * Cum devii partener.
 *
 * Trei pași, fiindcă atât are procesul: ceri, ți se confirmă nivelul, comanzi.
 * Textele descriu ce face vizitatorul, nu ce promitem noi înăuntru — despre
 * termene, documente cerute sau praguri de eligibilitate nu există nimic scris
 * în proiect, iar aici nu se inventează.
 */
const PASI = [
  {
    numar: "01",
    titlu: "Trimiți cererea",
    detaliu: "Completezi formularul de partener cu datele firmei.",
  },
  {
    numar: "02",
    titlu: "Îți confirmăm statutul",
    detaliu: "Stabilim nivelul — Gold sau Platinum — și condițiile care vin cu el.",
  },
  {
    numar: "03",
    titlu: "Comanzi la prețul tău",
    detaliu: "Primești oferta cu prețul tău, pentru perioada catalogului curent.",
  },
];

export default function ConditiiB2B() {
  return (
    /* `id` ca să existe o ancoră: meniul „Parteneri B2B" și footerul pot
       trimite la /#conditii-b2b până când pagina dedicată chiar există. */
    <section id="conditii-b2b" className="bg-[#F8F9FA] py-16 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* ── Masthead ───────────────────────────────────────── */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 xl:gap-6">
            <div
              className="@container min-w-0 flex-1"
              style={{ "--dim-titlu": dimensiuneTitlu(TITLU) } as CSSProperties}
            >
              <h2 className="text-[26px] sm:text-[length:var(--dim-titlu)] sm:whitespace-nowrap font-extrabold text-gray-900 leading-tight">
                {TITLU}
              </h2>
            </div>

            {/* Aceeași ștampilă ca la celelalte două secțiuni, cu a treia
                întrebare: acolo răspunde la „de când" și „cât mai țin", aici la
                „în ce sunt prețurile". E o dată tehnică pe care un cumpărător
                B2B o caută înainte de orice cifră, iar acum stă doar în
                subsolul secțiunii de categorii, unde ajunge după ce a citit
                patru prețuri. */}
            <div className="inline-flex items-center gap-3 shrink-0 self-start xl:self-auto h-10 sm:h-11 px-4 rounded-lg bg-white border border-gray-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Prețurile din catalog
              </span>
              <span aria-hidden className="h-4 w-px bg-gray-200" />
              <span className="text-xs sm:text-[13px] font-semibold text-gray-900 whitespace-nowrap">
                EUR, fără TVA
              </span>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-[14px] text-gray-500 leading-relaxed">
            Prețul din catalog se corectează în două feluri, independente unul de
            altul: după statutul de partener și după cantitatea comandată.
            Comenzile la container se ofertează separat.
          </p>

          <div aria-hidden className="mt-5 sm:mt-7 h-px w-full bg-gray-200" />
        </div>

        {/* ── Cele două axe ──────────────────────────────────────
            5 + 7 coloane, nu 6 + 6: cardul din dreapta are trei rânduri de
            text explicativ, cel din stânga două cifre. Împărțite egal, dreapta
            ar sta înghesuită iar stânga ar avea o coloană de aer.

            Se despart abia la `lg`. Sub pragul ăla, 5 coloane înseamnă ~300px,
            adică fix lățimea la care „4 paleți · 12 buc" se rupe în două. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* ── Axa 1: statutul ────────────────────────────── */}
          <div className={`${SUPRAFATA} lg:col-span-5 flex flex-col p-5 sm:p-6`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              După cine ești
            </span>
            <h3 className="mt-2 text-[18px] font-extrabold text-gray-900 leading-tight">
              Statut de partener
            </h3>
            <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">
              Reducere aplicată prețului de catalog, pentru companiile
              înregistrate ca partener.
            </p>

            {/* Cele două niveluri, în cutii identice.

                Sunt pe #F8F9FA, adică pe fundalul secțiunii: cutia interioară
                se citește ca o scobitură în cardul alb, nu ca un al doilea card
                pus peste el. Un alb pe alb ar fi cerut încă un contur, deci încă
                o linie într-o secțiune care are deja destule. */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {STATUTURI.map((s) => (
                <div
                  key={s.nume}
                  className="rounded-xl border border-gray-200 bg-[#F8F9FA] p-4"
                >
                  <span className="block text-[15px] font-bold text-gray-900 leading-none">
                    {s.nume}
                  </span>
                  {/* `tabular-nums`: cifrele au aceeași lățime în ambele cutii,
                      deci „−10%" și „−15%" încep și se termină identic. Fără
                      ea, cele două s-ar decala cu un pixel-doi, exact genul de
                      nealiniere care se vede fără să știi ce vezi. */}
                  <span className="mt-3 block text-[32px] font-extrabold text-gray-900 leading-none tabular-nums">
                    {s.reducere}
                  </span>
                  <span className="mt-2 block text-[12px] font-medium text-gray-500 leading-snug">
                    din prețul de catalog
                  </span>
                </div>
              ))}
            </div>

            {/* `mt-auto` lipește nota de talpa cardului, ca ea să stea la
                aceeași înălțime cu ultima notă din cardul de alături — cele
                două carduri au conținut de înălțimi diferite. */}
            <p className="mt-auto pt-5 text-[12px] text-gray-500 leading-relaxed">
              Statutul se stabilește la înregistrare și se aplică pe toate
              comenzile ulterioare, indiferent de cantitate.
            </p>
          </div>

          {/* ── Axa 2: volumul ─────────────────────────────── */}
          <div className={`${SUPRAFATA} lg:col-span-7 flex flex-col p-5 sm:p-6`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              După cât comanzi
            </span>
            <h3 className="mt-2 text-[18px] font-extrabold text-gray-900 leading-tight">
              Pragurile din catalog
            </h3>
            <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">
              Fiecare poziție din catalog are două coloane de preț. A doua se
              deschide la prag.
            </p>

            {/* Scara.

                Treptele sunt despărțite de linii, nu așezate în cutii separate:
                sunt trei stări ale ACELUIAȘI lucru — prețul unei poziții — iar
                trei cutii ar sugera trei oferte între care alegi.

                Numărul treptei e monospațiat și gri, ca un index de tabel, nu ca
                o pastilă de marketing. Fontul mono e deja în proiect, îl
                folosește SKU-ul din cardurile de ofertă. */}
            <div className="mt-5 divide-y divide-gray-200 border-y border-gray-200">
              {TREPTE.map((t) => (
                <div
                  key={t.treapta}
                  className="flex items-start gap-3 sm:gap-4 py-4"
                >
                  <span
                    aria-hidden
                    className="shrink-0 font-mono text-[12px] font-semibold text-gray-500 leading-6"
                  >
                    {t.treapta}
                  </span>

                  <div className="min-w-0 flex-1">
                    {/* Numele și valoarea pe același rând, valoarea împinsă la
                        dreapta: pe rândurile astea ochiul caută cifra, nu
                        descrierea. Sub `sm` trec una sub alta — „4 paleți ·
                        12 buc" n-are loc lângă „Preț la volum" pe telefon. */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
                      <span className="text-[15px] font-bold text-gray-900 leading-6">
                        {t.nume}
                      </span>
                      {/* Singurul loc din secțiune unde apare albastru pe altceva
                          decât un buton. E justificat: pastila poartă chiar
                          condiția comercială, adică motivul pentru care există
                          secțiunea. Raza e 6px, raza etichetelor — aceeași ca
                          badge-ul „N produse" de pe cardurile de categorie. */}
                      <span className="inline-flex shrink-0 items-center self-start sm:self-auto h-7 px-2.5 rounded-md bg-avo-50 text-[12px] font-bold text-avo-700 whitespace-nowrap">
                        {t.valoare}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-gray-500 leading-relaxed">
                      {t.detaliu}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-auto pt-5 text-[12px] text-gray-500 leading-relaxed">
              Pragul se calculează pe cantitatea comandată per produs, nu pe
              totalul comenzii. Nu toate pozițiile din catalog au a doua coloană.
            </p>
          </div>
        </div>

        {/* ── Cum devii partener ─────────────────────────────────
            Pe toată lățimea, sub cele două axe: e pasul care urmează după ce
            omul a înțeles condițiile, nu o a treia condiție. De-aia are titlu
            propriu și stă separat, nu într-un al treilea card din grilă. */}
        <div className={`${SUPRAFATA} mt-4 sm:mt-5 p-5 sm:p-6`}>
          <h3 className="text-[18px] font-extrabold text-gray-900 leading-tight">
            Cum devii partener
          </h3>

          {/* `ol`, nu `div`: e o succesiune, iar un cititor de ecran anunță
              „listă cu 3 elemente" și numerotează singur. Numerele scrise rămân
              vizibile pentru ceilalți, dar sunt `aria-hidden`, ca să nu se audă
              de două ori. */}
          <ol className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {PASI.map((p) => (
              <li key={p.numar} className="flex flex-col">
                {/* Linia de deasupra fiecărui pas, în locul unei cutii: pașii
                    sunt trei bucăți din același traseu, iar trei chenare i-ar
                    despărți. Linia se citește ca segmentul unui parcurs. */}
                <span aria-hidden className="h-px w-full bg-gray-200" />
                <span
                  aria-hidden
                  className="mt-3 font-mono text-[12px] font-semibold text-gray-500"
                >
                  {p.numar}
                </span>
                <span className="mt-1.5 text-[15px] font-bold text-gray-900 leading-snug">
                  {p.titlu}
                </span>
                <span className="mt-1 text-[13px] text-gray-500 leading-relaxed">
                  {p.detaliu}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Subsol ─────────────────────────────────────────────
            Aceeași așezare ca la „Gama de produse": nota tehnică în stânga,
            acțiunea în dreapta.

            DOUĂ BUTOANE, ordonate. „Devino partener" e plin, fiindcă e ce vrem
            să facă cineva care tocmai a citit secțiunea; „Cere ofertă" e
            secundar, pentru cine are deja o listă și nu vrea un cont. Pe
            telefon, primul din DOM e cel principal — degetul nu ajunge la ce e
            jos fără să treacă peste ce e sus. */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            Reducerea de statut și prețul la volum sunt condiții distincte; cum
            se aplică pe o comandă anume se confirmă în ofertă. Prețurile sunt în
            EUR, fără TVA. Taxa verde DEEE nu este inclusă (0,7 RON / kg).
            Disponibilitatea se confirmă la plasarea comenzii.
          </p>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 shrink-0">
            <Link href="/devino-partener" className={`${BUTON_PLIN} w-full sm:w-auto`}>
              Devino partener
            </Link>
            <Link href="/cerere-oferta" className={`${BUTON_SECUNDAR} w-full sm:w-auto`}>
              Cere ofertă
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
