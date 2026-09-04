import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { dimensiuneTitlu } from "./stiluri";

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
 * Această secțiune are un design DARK MODE pentru a crea impact și
 * a scoate în evidență importanța ofertei B2B. Cardurile sunt translucide
 * pentru a se integra perfect pe fundalul albastru marin.
 */

const TITLU = "Condiții B2B pentru companii și distribuitori";

/**
 * Butonul secundar pe fundal închis.
 */
const BUTON_SECUNDAR_DARK =
  "inline-flex items-center justify-center gap-2 shrink-0 " +
  "h-11 px-5 rounded-lg " +
  "bg-white/10 text-white text-[14px] font-semibold " +
  "border border-white/20 backdrop-blur-sm " +
  "transition-colors duration-200 " +
  "hover:bg-white/20 hover:border-white/30 active:bg-white/30 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const BUTON_ALB =
  "inline-flex items-center justify-center gap-2 shrink-0 " +
  "h-11 px-5 rounded-lg " +
  "bg-white text-slate-900 text-[14px] font-semibold shadow-sm " +
  "transition-colors duration-200 " +
  "hover:bg-slate-50 active:bg-slate-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const CARD_DARK = "bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl overflow-hidden";

/**
 * Cele două niveluri de partener.
 */
const STATUTURI = [
  { nume: "Gold", reducere: "−10%" },
  { nume: "Platinum", reducere: "−15%" },
];

/**
 * Scara de volum, cu trei trepte.
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
 */
const PASI = [
  {
    numar: "1",
    titlu: "Trimiți cererea",
    detaliu: "Completezi formularul de partener cu datele firmei.",
  },
  {
    numar: "2",
    titlu: "Îți confirmăm statutul",
    detaliu: "Stabilim nivelul — Gold sau Platinum — și condițiile care vin cu el.",
  },
  {
    numar: "3",
    titlu: "Comanzi la prețul tău",
    detaliu: "Primești oferta cu prețul tău, pentru perioada catalogului curent.",
  },
];

export default function ConditiiB2B() {
  return (
    <section id="conditii-b2b" className="relative bg-slate-900 py-16 sm:py-20 lg:py-28 overflow-hidden">
      {/* Un gradient subtil pe fundal pentru a nu fi doar un albastru plat */}
      <div className="absolute inset-0 bg-gradient-to-br from-avo-900/50 via-slate-900 to-slate-900/90 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* ── Masthead ───────────────────────────────────────── */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 xl:gap-6">
            <div
              className="@container min-w-0 flex-1"
              style={{ "--dim-titlu": dimensiuneTitlu(TITLU) } as CSSProperties}
            >
              <h2 className="text-[26px] sm:text-[length:var(--dim-titlu)] sm:whitespace-nowrap font-extrabold text-white leading-tight">
                {TITLU}
              </h2>
            </div>

            <div className="inline-flex items-center gap-3 shrink-0 self-start xl:self-auto h-10 sm:h-11 px-4 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Prețurile din catalog
              </span>
              <span aria-hidden className="h-4 w-px bg-white/20" />
              <span className="text-xs sm:text-[13px] font-semibold text-white whitespace-nowrap">
                EUR, fără TVA
              </span>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-[14px] text-slate-300 leading-relaxed">
            Prețul din catalog se corectează în două feluri, independente unul de
            altul: după statutul de partener și după cantitatea comandată.
            Comenzile la container se ofertează separat.
          </p>

          <div aria-hidden className="mt-5 sm:mt-7 h-px w-full bg-white/10" />
        </div>

        {/* ── Cele două axe ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* ── Axa 1: statutul ────────────────────────────── */}
          <div className={`${CARD_DARK} lg:col-span-5 flex flex-col`}>
            {/* Imagini integrate prin gradient fade */}
            <div className="relative h-40 sm:h-48 w-full bg-slate-900">
              <Image 
                src="/images/partener-b2b.jfif" 
                alt="Parteneriat Solar" 
                fill 
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover opacity-90" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 px-6 py-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  După cine ești
                </span>
                <h3 className="mt-0.5 text-[20px] font-extrabold text-white leading-tight">
                  Statut de partener
                </h3>
              </div>
            </div>

            <div className="flex flex-col flex-1 p-6 bg-slate-900/40">
              <p className="text-[14px] text-slate-300 leading-relaxed">
                Reducere aplicată prețului de catalog, pentru companiile
                înregistrate ca partener.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                {STATUTURI.map((s) => (
                  <div
                    key={s.nume}
                    className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:bg-white/10"
                  >
                    <span className="block text-[15px] font-bold text-white leading-none">
                      {s.nume}
                    </span>
                    <span className="mt-4 block text-[36px] font-extrabold text-white leading-none tabular-nums tracking-tight">
                      {s.reducere}
                    </span>
                    <span className="mt-2 block text-[13px] font-medium text-slate-400 leading-snug">
                      din prețul de catalog
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-auto pt-6 text-[13px] text-slate-400 leading-relaxed">
                Statutul se stabilește la înregistrare și se aplică pe toate
                comenzile ulterioare, indiferent de cantitate.
              </p>
            </div>
          </div>

          {/* ── Axa 2: volumul ─────────────────────────────── */}
          <div className={`${CARD_DARK} lg:col-span-7 flex flex-col`}>
            <div className="relative h-40 sm:h-48 w-full bg-slate-900">
              <Image 
                src="/images/depozit-b2b.jfif" 
                alt="Volum Comenzi" 
                fill 
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover opacity-90" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 px-6 py-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  După cât comanzi
                </span>
                <h3 className="mt-0.5 text-[20px] font-extrabold text-white leading-tight">
                  Pragurile din catalog
                </h3>
              </div>
            </div>

            <div className="flex flex-col flex-1 p-6 bg-slate-900/40">
              <p className="text-[14px] text-slate-300 leading-relaxed">
                Fiecare poziție din catalog are două coloane de preț. A doua se
                deschide la prag.
              </p>

              <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {TREPTE.map((t) => (
                  <div
                    key={t.treapta}
                    className="flex items-start gap-4 py-4"
                  >
                    <span
                      aria-hidden
                      className="shrink-0 font-mono text-[13px] font-semibold text-slate-500 leading-6"
                    >
                      {t.treapta}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <span className="text-[16px] font-bold text-white leading-6">
                          {t.nume}
                        </span>
                        <span className="inline-flex shrink-0 items-center self-start sm:self-auto h-7 px-3 rounded-md bg-white/10 text-[12px] font-bold text-white whitespace-nowrap border border-white/10">
                          {t.valoare}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[14px] text-slate-300 leading-relaxed">
                        {t.detaliu}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-auto pt-6 text-[13px] text-slate-400 leading-relaxed">
                Pragul se calculează pe cantitatea comandată per produs, nu pe
                totalul comenzii. Nu toate pozițiile din catalog au a doua coloană.
              </p>
            </div>
          </div>
        </div>

        {/* ── Cum devii partener ───────────────────────────────── */}
        <div className={`${CARD_DARK} mt-5 sm:mt-6 p-6 sm:p-8 bg-slate-900/40`}>
          <h3 className="text-[20px] font-extrabold text-white leading-tight">
            Cum devii partener
          </h3>

          <ol className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {PASI.map((p) => (
              <li key={p.numar} className="flex flex-col">
                <span aria-hidden className="h-px w-full bg-white/10" />
                <div
                  aria-hidden
                  className="mt-5 mb-2 flex items-center justify-center h-8 w-8 rounded-lg bg-white/10 border border-white/10 text-[14px] font-bold text-white"
                >
                  {p.numar}
                </div>
                <span className="mt-1.5 text-[16px] font-bold text-white leading-snug">
                  {p.titlu}
                </span>
                <span className="mt-1.5 text-[14px] text-slate-300 leading-relaxed">
                  {p.detaliu}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Subsol pe fundalul albastru ───────────────────────────────────────────── */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Reducerea de statut și prețul la volum sunt condiții distincte; cum
            se aplică pe o comandă anume se confirmă în ofertă. Prețurile sunt în
            EUR, fără TVA. Taxa verde DEEE nu este inclusă (0,7 RON / kg).
            Disponibilitatea se confirmă la plasarea comenzii.
          </p>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 shrink-0">
            <Link href="/devino-partener" className={`${BUTON_ALB} w-full sm:w-auto`}>
              Devino partener
            </Link>
            <Link href="/cerere-oferta" className={`${BUTON_SECUNDAR_DARK} w-full sm:w-auto`}>
              Cere ofertă
            </Link>
          </div>
        </div>
        
      </div>
    </section>
  );
}
