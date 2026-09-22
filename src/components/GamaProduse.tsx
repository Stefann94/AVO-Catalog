import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { incarcaPerioadaCatalog } from "@/lib/perioada";
import { incarcaGamaProduse } from "@/lib/gama";
import type { CSSProperties } from "react";
import { BUTON_CARD, BUTON_PLIN, CADRU_FOTO_CARD, CARD, dimensiuneTitlu } from "./stiluri";

/**
 * Gama de produse — categoriile, cu date agregate din catalog.
 *
 * Perioada de valabilitate vine din WooCommerce: importatorul o scrie pe fiecare
 * produs ca meta `_perioada_eticheta` / `_valabil_de` / `_valabil_pana`, iar
 * extensia din tools/wordpress o expune prin GraphQL. Se actualizează singură la
 * fiecare import lunar, fără atins codul.
 *
 * Cardurile vin acum tot din WooCommerce, prin lib/gama.ts: numele, numărul de
 * produse (categoria plus subcategoriile ei), descrierea, fotografia și prețul
 * de pornire. Componenta nu mai ține nicio cifră; ce e scris în cod e doar
 * rezerva pentru cazul în care WordPress nu răspunde.
 *
 * „de la" apare DOAR unde e o ancoră onestă. La Sisteme de Montaj cel mai
 * ieftin produs e un șurub Dome de 0,21 € — inutil alături de „de la 54 €" —
 * așa că acolo arătăm cea mai mare subcategorie, nu prețul. Regula și motivul
 * ei stau în lib/gama.ts, lângă datele pe care le guvernează.
 */

/* ══════════════════════════════════════════════════════════════════════════
   Limbajul vizual al secțiunii
   ──────────────────────────────────────────────────────────────────────────
   Trei reguli, aplicate fără excepție. Ele sunt ce desparte secțiunea de un
   șablon generic, așa că orice adăugare ulterioară trebuie să le respecte.

   1. RAMPA NEUTRĂ E `gray`, NU `slate`.
      Fundalul secțiunii (#F8F9FA), conturul cardurilor (#D1D5DC) și griul
      tehnic (#6A7282) sunt exact `gray-50/300/500` din Tailwind v4. Restul
      site-ului e pe `slate`; aici trecem pe `gray` fiindcă e un neutru curat,
      fără tenta rece a lui slate, iar conturul devine astfel neutru,
      nu albăstrui.

   2. CONTURUL FACE MUNCA, NU UMBRA.
      Cardul are un contur de 1px și o umbră abia perceptibilă (`shadow-sm`),
      iar la hover conturul se colorează în avo-600 și se îngroașă la 2px.
      Atât — nicio umbră care crește, nicio ridicare. Umbrele difuze mari sunt
      exact semnătura vizuală a șabloanelor generice; un contur crisp citește
      ca desen tehnic, ceea ce se potrivește cu ce vinde firma.

      Aici scria „nicio clasă shadow-*", într-un fișier care avea `shadow-sm`
      și `hover:shadow-md`. Rețeta e acum în components/stiluri.ts, folosită de
      toate cardurile din site — categorie, ofertă și produs.

   3. UN SINGUR ACCENT: `avo-600` (#004A99), pe hue-ul siglei.
      Îl primesc numai elementele de decizie. Secțiunea avea albastru, emerald
      cu degrade, galben și cyan în concurență; niciunul nu însemna nimic.

      În card, singurul lucru colorat e butonul. Prețul e gray-900, ca titlul,
      fiindcă e informație, nu acțiune.

      A EXISTAT AICI O REGULĂ CONTRARĂ, iar schimbarea e deliberată. Butonul a
      stat gri în repaus, colorându-se abia la hover, ca patru butoane albastru
      plin să nu tragă privirea înaintea fotografiilor și a cifrelor. Motivul a
      dispărut odată cu prețul: cât timp cifra era avo-600, cardul avea albastru
      și fără buton. Acum, cu prețul pe gray-900, un buton gri ar lăsa cardul
      complet fără culoare, iar grila de patru ar citi plat.

      Rețeta butonului nu stă aici, ci în components/stiluri.ts — un singur șir
      de clase, folosit și de cardurile de ofertă, și de butonul de secțiune.
      Acolo sunt și treptele de hover și motivul pentru care sunt alea.

      Nu e `blue-600` (#2563EB), albastrul implicit din Tailwind: acela bate în
      violet și e același cu al lui Apple și al oricărui SaaS. Dar nu e nici
      albastrul literal al siglei, care e prea deschis pentru o cifră de preț
      pe alb. Vezi globals.css pentru cum e construită scara, de ce treapta
      600 coboară sub sigla și de ce cromatica e ținută sus.

   TREI RAZE, fiecare cu un rol. Nu una singură, cum scria aici — codul avea
   deja patru, iar comentariul descria o regulă pe care n-o respecta:

     12px `rounded-xl` ... suprafețe: cardul
     8px  `rounded-lg` ... comenzi: butoanele, ștampila „Prețuri valabile"
     6px  `rounded-md` ... etichete: badge-ul cu numărul de produse

   Butoanele au fost pilule (`rounded-full`). Era a patra rază, fără rol propriu
   — iar pe un buton de 44px, pilula citește ca element de interfață web, nu ca
   desen tehnic. Trecute la 8px, se aliniază cu ștampila, care are aceeași
   greutate vizuală și stă în aceeași secțiune.

   Badge-ul rămâne la 6px fiindcă pe un element de 28px înălțime, 8px se apropie
   deja de pilulă, iar eticheta cerea aspect de plăcuță.

   Un element nou primește raza rolului lui, nu una nouă.

   4. CARDUL SPUNE TREI LUCRURI, NU ȘAPTE.
      Ce categorie e, câte produse are, de la cât pornește. Atât. Restul se
      află după clic, în pagina categoriei, unde e loc ca datele tehnice să
      fie complete, nu tăiate la două rânduri.

        titlu ..... 15px bold (700)       gray-900   bandă de sticlă, peste poză
        badge ..... 12px bold (700)       gray-900   colțul din dreapta-sus
        preț ...... 22px extrabold (800)  gray-900   jos-stânga
        îndemn .... 14px semibold (600)   alb        buton avo-600, jos-dreapta

      CE A FOST ÎNAINTE, în ordine: o descriere în proză, un rând de sigle,
      apoi o fișă tehnică de două rânduri. Toate au căzut.

      Proza scria „N-Type TOPCon · 14 modele bifaciale" sau „hibride, on-grid
      și off-grid". Verificat în src/lib/categorii.ts, enumerările cu punct
      median sugerau paritate acolo unde catalogul n-o are: „on-grid și
      off-grid" acoperea 4, respectiv 2 produse din 35. Cine intra pe
      promisiunea aceea găsea două SKU-uri — clic irosit.

      Siglele rezolvau onestitatea, dar puneau trei imagini plus o pastilă
      peste o fotografie care avea deja un badge.

      Fișa tehnică era corectă și onestă, dar era tot un al patrulea nivel de
      informație într-un card de 281px lățime, iar cifrele ei nu decideau
      clicul: nimeni nu alege între categorii după câte invertoare sunt
      hibride. Datele n-au dispărut din proiect, doar din card.

      BANDA DE STICLĂ e `bg-white/45 backdrop-blur-2xl backdrop-saturate-200`.
      Alb, nu gri: la 45% fotografia chiar se vede prin ea, iar banda citește
      ca sticlă mată, nu ca o plăcuță lipită peste poză. A fost o vreme
      `slate-100/80`, rețeta de atunci a navbarului (care e azi
      `slate-300/60`) — corectă acolo, dar aici ieșea un dreptunghi gri opac
      care ascundea poza.

      Nu e nici un degrade negru peste poză, cum se face de obicei: un degrade
      ar întuneca fotografia exact în partea de jos, unde la trei din patru
      poze stă subiectul.

   Contraste verificate (prag WCAG AA, text normal 4.5:1):
     gray-900 #101828 pe alb ........ 17.75 ✓  (titluri de secțiune)
     gray-900 pe sticlă .. 6.09 – 13.90 ✓  (titlu card, badge — vezi mai jos)
     gray-500 #6A7282 pe alb ......... 4.84 ✓  („DE LA", eticheta pastilei)
     alb pe avo-600 #004A99 .......... 8.61 ✓  (buton, repaus)
     alb pe avo-700 #003B7D ......... 10.93 ✓  (buton, hover)
     alb pe avo-800 #002D64 ......... 13.50 ✓  (buton, apăsat)

   CUM SE MĂSOARĂ CONTRASTUL PE STICLĂ. Nu se poate calcula din culoarea
   scrisă în clasă: fundalul real e compunerea dintre alb la 45% și fotografia
   de dedesubt, iar aceea diferă de la card la card. Așa că e citit din pagina
   randată — captură a grilei, apoi eșantion de pixeli din banda fiecărui card,
   într-o zonă în care nu ajunge textul, și raportul calculat față de gray-900.

   Rezultate pe cele patru fotografii de acum:
     titlu pe bandă .... Panouri 6,60 · Invertoare 13,90 · Stocare 10,18 ·
                         Montaj 6,40
     badge ............. Panouri 7,75 · Invertoare 12,32 · Stocare 11,24 ·
                         Montaj 6,09

   Cel mai slab caz e 6,09:1, la 36% peste pragul AA. Marja nu e generoasă din
   întâmplare: `backdrop-blur-2xl` mediază fundalul pe o rază de zeci de
   pixeli, deci sub bandă nu ajung pixelii negri izolați din poză, ci media
   zonei. Fără blur, aceleași 45% ar cădea sub prag pe orice porțiune închisă.

   LA SCHIMBAREA UNEI FOTOGRAFII se remăsoară. O poză mult mai închisă în
   treimea de jos poate coborî raportul; atunci se urcă opacitatea benzii, nu
   se închide culoarea textului.

   PENTRU TEXT NOU, gray-500 e cea mai deschisă treaptă admisă pe alb.
   gray-400 (#99A1AF) dă 2,60:1, sub pragul AA, oricât de secundar ar părea
   elementul; subordonarea se obține din dimensiune și greutate, nu din
   ștergerea contrastului.
   ══════════════════════════════════════════════════════════════════════════ */


const TITLU = "Categoriile principale pentru casa și energia ta";

/**
 * Îndemnul de la finalul secțiunii — „Ai un proiect?".
 *
 * ─── CE A FOST AICI ȘI DE CE A CĂZUT ──────────────────────────────────────
 *
 * O bandă de patru facilități, fiecare cu iconiță într-o plăcuță `avo-50`:
 * „Livrare / 24 de ore", „Consiliere / telefonică", „Prețuri / de importator",
 * „Catalog / actualizat lunar". A picat din trei motive, în ordinea gravității:
 *
 *   1. LIVRAREA ÎN 24 DE ORE NU ERA ADEVĂRATĂ. O adusesem din slide-ul al
 *      treilea din HeroSlider.tsx („24h · Livrare · Din depozite naționale"),
 *      crezând că e o afirmație a firmei — dar acel slide e text de schelet.
 *      Termenele reale: 2–3 zile lucrătoare prin curier, 3–14 cu flota proprie,
 *      15–90 de la furnizor. AFIRMAȚIA E ȘI ACUM ÎN HeroSlider.tsx și trebuie
 *      scoasă și de-acolo.
 *
 *      Lecția, fiindcă regula de proveniență a acestui fișier o trecuse:
 *      „scris în proiect" nu înseamnă „verificat". Un text-șablon e scris în
 *      proiect. Regula cere o sursă, dar sursa trebuie să fie o afirmație a
 *      firmei, nu un rând rămas din primul schelet al site-ului.
 *
 *   2. DOUĂ DIN PATRU NU SPUNEAU NIMIC. „Consiliere telefonică" e adevărată și
 *      goală — orice firmă are telefon; nu e o facilitate, e o condiție de
 *      existență. „Prețuri de importator" era un adjectiv fără cifră în spate.
 *
 *   3. PLĂCUȚA CU ICONIȚĂ E CLIȘEUL. Fundal deschis, colț rotunjit, iconiță de
 *      contur: tiparul „feature list" din orice șablon din ultimii opt ani. Nu
 *      iconița era greșită — faptul că exista o plăcuță cu iconiță era.
 *
 * ─── DE CE UN ÎNDEMN, ȘI DE CE ĂSTA ───────────────────────────────────────
 *
 * Locul ăsta e închiderea secțiunii, iar cine ajunge la el a trecut prin toate
 * patru categoriile: e cel mai calificat cititor de pe pagină. Îi arătam un
 * rezumat. Acum îi cerem ceva.
 *
 * În fotovoltaice nu se cumpără un panou, se cumpără un PROIECT — panouri plus
 * invertor plus acumulator plus structură. De aceea îndemnul nu e „vezi
 * produsul", ci „trimite lista". Iar promisiunea din el, „prețul tău de volum",
 * e chiar diferențiatorul catalogului: a doua coloană de preț, de la 4 paleți
 * la panouri și 12 bucăți la invertoare (vezi ConditiiB2B.tsx).
 *
 * Nu e o acțiune inventată de noi: „Cerere de ofertă" e deja în navigația
 * proprie a firmei, în Footer.tsx.
 *
 * ─── UNDE DUCE ACUM ───────────────────────────────────────────────────────
 *
 * La `mailto:`, nu la o pagină, fiindcă PAGINA NU EXISTĂ ÎNCĂ — aplicația are
 * cinci rute, toate de catalog. Un îndemn care duce în 404 e mai rău decât
 * banda pe care a înlocuit-o; e chiar greșeala reparată o dată în proiect,
 * când bara de filtre scria „Lichidare stoc — 15" fără să ducă undeva.
 *
 * Adresa e cea verificată de pe avogrupinvest.ro/contact, aceeași ca în
 * Footer.tsx. Când se face `/cerere-oferta`, se schimbă `ADRESA_OFERTA` cu
 * ruta și `<a>` redevine `<Link>` — două rânduri.
 */
const ADRESA_OFERTA =
  "mailto:contact@avogrupinvest.ro" +
  "?subject=" +
  encodeURIComponent("Cerere de ofertă — listă echipamente");

const eur = (n: number) => n.toLocaleString("ro-RO");

export default async function GamaProduse() {
  /**
   * Perioada vine din încărcătorul comun din lib/perioada, nu dintr-un apel
   * propriu. Banda de sub hero cere aceeași valoare, iar interogarea e POST —
   * pe care Next nu o reunește automat, memoizarea lui fiind doar pentru GET.
   * `cache` din React face ca ambele componente să împartă o singură cerere,
   * iar rezerva scrisă în cod există într-un singur loc.
   */
  // Cele două pleacă odată: n-au nicio dependență între ele, iar înlănțuite ar
  // aduna două drumuri până la WordPress în timpul de randare al paginii.
  const [perioada, categorii] = await Promise.all([
    incarcaPerioadaCatalog(),
    incarcaGamaProduse(),
  ]);

  /**
   * PADDING-UL VERTICAL E ASIMETRIC, și niciunul dintre capete nu e liber.
   *
   *   SUS, `lg:pt-28` ... cei 112px sunt scriși ȘI ca literal în `--bara-sus`
   *      din app/globals.css (112 + 44 + 28 = 184px), de unde bara de filtre
   *      își ia ancorajul pe linia de sub titlu. Schimbați aici fără să fie
   *      schimbați și acolo, bara pornește din gol.
   *
   *   JOS, `lg:pb-20` ... 80px, din care bara de filtre își ia capătul de jos
   *      (`bottom-10` în BaraFiltre, măsurat de la marginea secțiunii). Scăzut
   *      mai mult fără să scadă și `bottom`, panoul ajunge lipit de ultimul
   *      rând de conținut.
   *
   * A fost `lg:py-28` pe amândouă. Împreună cu cei 112px ai secțiunii de
   * dedesubt ieșeau 224px de gol la joncțiune, peste o tăietură pe care
   * culoarea o face deja singură — de patru ori și jumătate cel mai mare
   * interval dinăuntrul secțiunii. Socoteala întreagă e în OferteleLunii.tsx,
   * lângă cealaltă jumătate a joncțiunii.
   */
  return (
    /* PE TELEFON (sub `sm`) secțiunea e strânsă: 40px sus și jos în loc de 64,
       titlu de 22px, carduri câte două pe rând. De la `sm` fiecare clasă e cea
       de dinainte — `sm:pb-16` readuce exact jumătatea de jos a lui `py-16`. */
    <section className="bg-[#F8F9FA] py-10 sm:pt-20 sm:pb-16 lg:pt-28 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* ── Masthead ───────────────────────────────────────── */}
        <div className="mb-5 sm:mb-10 lg:mb-12">
          {/* Ștampila trece lângă titlu abia de la xl: sub această lățime i-ar
              lăsa titlului ~574px, insuficient pentru un singur rând. */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 sm:gap-4 xl:gap-6">
            {/* Fără `tracking` negativ: aceeași spațiere ca titlul din hero.
                La un font geometric, strângerea literelor schimbă vizibil
                desenul și titlurile par a fi din fonturi diferite.

                TITLUL NU MAI POARTĂ LUNA. Era „Gama de produse Septembrie
                2026", iar perioada apărea de două ori pe același rând — și în
                titlu, și în ștampila de alături. Categoriile nu se schimbă
                lunar; prețurile da, iar ștampila e a lor. La „Ofertele lunii"
                luna rămâne în titlu, fiindcă acolo chiar înseamnă ceva.

                DE CE NU „CELE MAI POPULARE CATEGORII". Ar fi fost o afirmație
                nesusținută: magazinul n-a avut nicio comandă, `totalSales` e
                null pe toate produsele, iar ordonarea după popularitate
                întoarce de fapt ordinea implicită — conectori și șuruburi.

                `text-balance` în loc de `whitespace-nowrap`: titlul e acum prea
                lung ca să încapă pe un rând lângă ștampilă, iar echilibrarea
                împarte cuvintele între rânduri în loc să lase unul singur
                atârnând jos. */}
            <div
              className="@container min-w-0 flex-1"
              style={{ "--dim-titlu": dimensiuneTitlu(TITLU) } as CSSProperties}
            >
              <h2 className="text-[22px] sm:text-[length:var(--dim-titlu)] sm:whitespace-nowrap font-extrabold text-gray-900 leading-tight">
                {TITLU}
              </h2>
            </div>

            {/* Ștampila e o dată tehnică, dar rămâne pe fontul global, ca tot
                restul secțiunii. Fără umbră: contur de 1px. */}
            {perioada.interval ? (
              <div className="inline-flex items-center gap-2 sm:gap-3 shrink-0 self-start xl:self-auto h-8 sm:h-11 px-3 sm:px-4 rounded-lg bg-white border border-gray-200">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Prețuri valabile
                </span>
                <span aria-hidden className="h-3.5 sm:h-4 w-px bg-gray-200" />
                <span className="text-[11px] sm:text-[13px] font-semibold text-gray-900 whitespace-nowrap">
                  {perioada.interval}
                </span>
              </div>
            ) : null}
          </div>

          <div aria-hidden className="mt-4 sm:mt-7 h-px w-full bg-gray-200" />
        </div>

        {/* ── Categorii ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
          {categorii.map((c) => {
            const cale = `/catalog/${c.slug}`;
            return (
              /*
               * TOT CARDUL E O SINGURĂ ȚINTĂ, prin link întins.
               *
               * AICI A FOST INVERS, și merită spus de ce s-a schimbat. Cardul
               * avea două zone care duceau undeva — fotografia și butonul —
               * argumentul fiind că un card întreg făcut link promite ceva ce
               * nu se vede: cursorul devine mână peste o cifră de preț.
               *
               * Argumentul cădea la o verificare simplă: cele două linkuri
               * duceau la ACEEAȘI adresă. Nu erau două acțiuni între care omul
               * alege, era aceeași acțiune scrisă de două ori — două opriri
               * consecutive cu Tab pentru aceeași destinație, anunțată de două
               * ori de un cititor de ecran. Redundanța era problema, nu soluția.
               *
               * CUM E FĂCUT. Nu cu un `<Link>` în jurul cardului: butonul e și
               * el link, iar `<a>` în `<a>` e HTML invalid, pe care browserele
               * îl repară imprevizibil. Singurul link rămâne butonul, iar un
               * `::after` transparent (`after:absolute after:inset-0`) i se
               * întinde peste tot cardul. În arborele de accesibilitate rămâne
               * un singur link, cu o singură oprire de Tab, iar conturul de
               * focus se vede pe buton — acolo unde scrie unde duce.
               *
               * `relative` pe `<article>` e ce ancorează stratul acela; fără el
               * s-ar întinde peste cel mai apropiat părinte poziționat, adică
               * peste toată grila.
               *
               * CE PIERDEM: textul de pe card nu mai poate fi selectat cu
               * mouse-ul, fiindcă stratul stă deasupra lui. Pe un card care
               * spune „De la 54 € / panou" nu e o pierdere reală — nimeni nu
               * copiază de acolo, toți dau clic.
               */
              <article
                key={c.slug}
                className={`${CARD} group relative flex flex-col overflow-hidden`}
              >
                {/* Fotografia, cu titlul așezat pe ea.
                    Nu mai e link: stratul întins al butonului acoperă și zona
                    asta. Zoom-ul ascultă acum de `group`, adică de hover-ul
                    întregului card — înainte pornea doar când mouse-ul intra pe
                    fotografie, ceea ce arăta ca o scăpare acum, când tot cardul
                    răspunde. */}
                <div className={`relative block ${CADRU_FOTO_CARD} overflow-hidden bg-gray-100`}>
                  {/* Miniatura din WooCommerce, dacă a încărcat-o cineva;
                      altfel fotografia din public/.

                      DIFERENȚA DINTRE CELE DOUĂ nu e doar adresa. Fișierul din
                      public/ e importat static, deci Next îi calculează la
                      build un `blurDataURL` — o miniatură inline care ține
                      locul pozei cât se încarcă. Pentru o adresă din
                      WooCommerce nu are de unde: fișierul nu există la
                      compilare. De-aia `placeholder` se pune doar pe varianta
                      locală, iar cea remotă se sprijină pe fundalul gri al
                      containerului.

                      Nu e o regresie de acceptat pe termen lung — miniatura
                      neclară se poate genera la build descărcând poza, sau
                      stocând-o ca meta pe categorie. Până atunci, cardul
                      arată corect în ambele cazuri. */}
                  <Image
                    src={c.imagine ?? c.imagineLocala!}
                    alt=""
                    fill
                    /* Cardul are cel mult ~296px la xl (7xl minus padding, în
                       4 coloane), deci 300px e limita reală, nu o presupunere.
                       Se cere cu 10% peste, fiindcă la hover imaginea e mărită
                       la 105% și altfel s-ar vedea ușor moale. */
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 50vw, 330px"
                    {...(c.imagine ? {} : { placeholder: "blur" as const })}
                    /* Tranziția stă pe element, nu pe starea de hover, ca
                       ieșirea din zoom să fie la fel de lină ca intrarea.
                       Se animă `transform`, singura proprietate pe care
                       browserul o rezolvă pe compozitor, fără redesenare. */
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />

                  {/* Badge-ul stă pe aceeași sticlă ca banda de jos: două rețete
                      diferite pe aceeași fotografie s-ar vedea ca o scăpare. */}
                  <span className="absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center h-5 sm:h-7 px-1.5 sm:px-2.5 rounded-md bg-white/45 backdrop-blur-2xl backdrop-saturate-200 border border-white/50 text-[10px] sm:text-[12px] font-bold text-gray-900">
                    {c.produse} produse
                  </span>

                  {/* Banda cu titlul.

                      `bg-white/45`, nu un gri: la 45% fotografia se vede prin
                      ea, iar banda citește ca sticlă mată, nu ca o plăcuță
                      opacă lipită peste poză.

                      Blur-ul mare nu e ornament, el face lizibilitatea posibilă.
                      Neclarizarea mediază fundalul pe o rază de zeci de pixeli,
                      deci sub bandă nu mai ajung pixelii negri izolați din poză,
                      ci media zonei. Fără el, un contrast calculat pe medie ar
                      fi o minciună; cu el, media chiar e ce se vede.

                      `backdrop-saturate-200` e ce desparte „sticla" de „albul
                      translucid": fără saturație în plus, culorile de dedesubt
                      ies spălăcite și efectul se pierde.

                      Titlul e centrat și banda e subțire — o singură linie de
                      text, `truncate` în loc de două rânduri, ca grosimea benzii
                      să fie identică pe toate cardurile. */}
                  <div className="absolute inset-x-0 bottom-0 bg-white/45 backdrop-blur-2xl backdrop-saturate-200 border-t border-white/50 px-2 py-1.5 sm:px-3 sm:py-2">
                    <h3 className="text-center text-[12px] sm:text-[15px] font-bold text-gray-900 leading-tight truncate">
                      {c.nume}
                    </h3>
                  </div>
                </div>

                {/* Piciorul cardului: ancora de preț și îndemnul. */}
                {/* Pe telefon butonul coboară sub preț, pe toată lățimea
                    cardului (~170px): alături nu încape. De la `sm`, rândul de
                    dinainte. */}
                <div className="flex flex-1 flex-col justify-end gap-2 p-2.5 sm:flex-initial sm:flex-row sm:items-end sm:justify-between sm:gap-2 sm:p-4">
                  {c.deLa ? (
                    <div className="flex min-w-0 shrink-0 flex-col justify-end">
                      <span className="text-[10px] sm:text-[12px] font-medium text-gray-500 mb-0.5">De la</span>
                      <span className="flex items-baseline gap-0.5 sm:gap-1">
                        <span className="text-[17px] sm:text-[22px] font-extrabold text-gray-900 leading-none">
                          {eur(c.deLa)}
                        </span>
                        <span className="text-[12px] sm:text-[16px] font-bold text-gray-900">€</span>
                        <span className="text-[10px] sm:text-[12px] font-medium text-gray-500 whitespace-nowrap">
                          / {c.unitate}
                        </span>
                      </span>
                    </div>
                  ) : c.statistica ? (
                    <div className="flex min-w-0 shrink-0 flex-col justify-end">
                      <span className="truncate text-[10px] sm:text-[12px] font-medium text-gray-500 mb-0.5">{c.statistica.eticheta}</span>
                      <span className="flex items-baseline gap-1">
                        <span className="text-[17px] sm:text-[22px] font-extrabold text-gray-900 leading-none">
                          {c.statistica.valoare}
                        </span>
                      </span>
                    </div>
                  ) : null}

                  <Link
                    href={cale}
                    className={`${BUTON_CARD} after:absolute after:inset-0`}
                  >
                    Accesează
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Îndemnul și butonul de secțiune ──────────────────
            Stau pe ACELAȘI rând, nu unul sub altul. Îndemnul ia tot ce rămâne
            (`flex-1`), butonul stă la dreapta și nu se strânge. Rândul închide
            secțiunea dintr-o margine în alta, cu aceeași linie de 1px deasupra
            ca despărțire — cea de sub titlul secțiunii, deci nicio muchie nouă
            în pagină.

            ÎNĂLȚIMEA RÂNDULUI E NEATINSĂ, ȘI E O CERINȚĂ, NU O ÎNTÂMPLARE.
            Banda de facilități care era aici măsura 917×44 la 1440px, iar 44
            veneau de la plăcuțele cu iconiță — exact cât butonul de alături.
            Înlocuirea trebuie să încapă în aceiași 44px, altfel rândul crește
            și coboară tot ce urmează în pagină. De-aia textul are DOUĂ rânduri,
            nu trei: 15px cu `leading-tight` plus 13px cu `leading-snug` fac 37px
            și rămân 7 de rezervă. Al treilea rând ar fi ieșit din buget.

            Măsurat, nu estimat: `tools/captura` cu `--selector`, apoi citite
            dimensiunile din antetul PNG-ului.

            AICI ERA NOTA DE TVA ȘI DEEE. A plecat, și nu se pierde nimic din ea:
            aceeași condiție e scrisă în „Condiții B2B", mai jos pe aceeași
            pagină, și pe fiecare fișă de produs. Verificat, nu presupus —
            singura care rămâne fără duplicat nicăieri ar fi fost taxa DEEE, iar
            ea e în amândouă locurile.

            SE STIVUIESC ABIA SUB `lg`, ca înainte. */}
        <div className="mt-6 sm:mt-10 flex flex-col gap-4 sm:gap-6 border-t border-gray-200 pt-5 sm:pt-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          {/* Textul și butonul lui sunt un bloc, nu două elemente ale rândului
              mare: sub `sm` se stivuiesc între ele, iar de la `sm` în sus stau
              alături, cu butonul lipit de sfârșitul textului. Așa „Cere ofertă"
              rămâne lângă fraza care îl explică, în loc să plutească la celălalt
              capăt al rândului, la un metru de motivul lui. */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <p className="min-w-0">
              {/* Întrebarea poartă greutatea, fraza o explică. E aceeași
                  ierarhie ca la etichetă + valoare din restul site-ului, doar
                  că aici valoarea vine prima: o întrebare directă oprește
                  privirea mai bine decât un substantiv. */}
              <span className="block text-[15px] font-extrabold leading-tight text-gray-900">
                Ai un proiect?
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-gray-600">
                Trimite-ne lista de echipamente și primești ofertă cu prețul tău
                de volum.
              </span>
            </p>

            {/* ── „Cere ofertă" ────────────────────────────────
                GRAY-900 PLIN, NU ALBASTRU. Butonul de alături e avo-600 și
                rămâne neatins; două butoane albastru plin pe același rând s-ar
                fi bătut între ele, iar unul cu contur ar fi spus că cererea de
                ofertă e acțiunea de rangul doi — exact pe dos față de ce
                valorează pentru firmă. Închis, are toată greutatea fără să
                atingă albastrul.

                Nu e o culoare nouă în site: bara de contact din navbar, subsolul
                și „Condiții B2B" sunt deja pe suprafețe închise.

                Aceeași înălțime, aceeași rază, aceeași greutate de literă ca
                butonul de catalog — sunt frați, nu rude îndepărtate.

                  alb pe gray-900 #101828 ... 17,75 ✓
                  alb pe gray-800 #1E2939 ... 14,68 ✓  (hover)

                `<a>`, nu `<Link>`: `mailto:` nu e o rută internă, iar Link l-ar
                trata ca navigare. Se schimbă amândouă când apare
                `/cerere-oferta`. */}
            <a
              href={ADRESA_OFERTA}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-lg bg-gray-900 px-5 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 sm:w-auto"
            >
              Cere ofertă
              <ArrowRight aria-hidden size={16} strokeWidth={2} className="shrink-0" />
            </a>
          </div>

          {/* ── Butonul de secțiune ─────────────────────────────
              FRATE CU „CERE OFERTĂ", NU EXCEPȚIE. Aceeași formă — 44px
              înălțime, rază de 8px, padding, literă, săgeată la aceeași
              distanță — și o singură diferență: suprafața.

              ─── CE A FOST ÎNAINTE ȘI DE CE A CĂZUT ─────────────────────────

              Albastru plin, COLȚURI DREPTE, linie despărțitoare de 1px între
              text și săgeată, muchie interioară `white/15`. Luat separat, arăta
              bine. Dar era SINGURUL element cu colțuri drepte de pe pagină:
              cardurile au 12px, „Accesează" și ștampila 8px, iar „Cere ofertă",
              chiar alături, tot 8px. Două butoane pe același rând, cu raze și
              detalii diferite, citeau ca luate din două seturi de componente.

              Înaintea lui a fost o variantă cu capăt pătrat întunecat
              `avo-800` și majuscule late — căzută fiindcă arăta a 2015.

              A trecut scurt și printr-o variantă de sticlă gri, rețeta
              navbarului (`slate-300/60`), ca să nu fie două butoane pline pe
              același rând. A căzut la vedere: albastrul e culoarea tuturor
              butoanelor de acțiune din site, iar un buton gri ieșea din familie
              la fel de tare cum ieșeau colțurile drepte.

              ─── REȚETA ────────────────────────────────────────────────────

              E `BUTON_PLIN` din components/stiluri.ts, aceeași cu „Accesează"
              din carduri — deci contrastele și treptele de hover sunt cele
              verificate acolo. Se adaugă doar ce ține de locul lui: pe toată
              lățimea sub `sm` și fără rupere de rând. */}
          <Link
            href="/catalog"
            className={`${BUTON_PLIN} w-full whitespace-nowrap sm:w-auto`}
          >
            Vezi catalogul complet
            <ArrowRight aria-hidden size={16} strokeWidth={2} className="shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  );
}
