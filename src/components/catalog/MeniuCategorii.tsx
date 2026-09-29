import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import IconCategorie from "./IconCategorie";
import type { CategorieFiltru } from "@/lib/panou";
import type { Produs } from "@/lib/produs";
import { gasesteBrand } from "@/lib/branduri";
import { formatEconomie } from "@/lib/oferte";
import {
  BADGE,
  BADGE_CARD,
  BADGE_ECONOMIE,
  BADGE_OFERTA,
  BUTON_PLIN,
} from "@/components/stiluri";

/* ── Eticheta unei liste din fereastra de categorie ───────────────────────
   „SUBCATEGORII", „BRANDURI". Aceeași rețetă pentru amândouă, ca lista să nu
   pară că începe altfel după ce se schimbă ce e în ea.

   10,5px cu spațiere de 0,08em, nu 11px cu `tracking-wider` (0,05em): la
   corpuri mici scrise cu majuscule, literele se lipesc și cuvântul devine o
   bară. Cu cât textul e mai mic, cu atât are nevoie de mai mult aer între
   litere — de-aia eticheta e mai MICĂ decât rândurile de sub ea și totuși se
   citește la fel de ușor.

   Culoarea e `faint`, treapta de text cea mai deschisă din site: eticheta
   spune ce urmează, nu concurează cu lista. */
const ETICHETA_LISTA =
  "px-2.5 pt-3 pb-1.5 text-[10.5px] font-bold tracking-[0.08em] text-muted uppercase";

/* ── Un rând din listele ferestrei ────────────────────────────────────────
   Subcategorii și mărci. AMÂNDOUĂ TREC PE ACELEAȘI CLASE, și asta e tot
   rostul constantelor de aici.

   ─── CE ERA ÎNAINTE ────────────────────────────────────────────────────

   Două rețete pentru același lucru, scrise la câteva luni distanță:

     subcategoriile ... fundal `avo-50` sub mouse, textul spre avo-700
     mărcile .......... o bară verticală de 2px pe marginea din stânga,
                        numele și cifra trecute pe bold

   Deschideai „Stocare Energie” și primeai un fel de evidențiere; deschideai
   „Panouri Fotovoltaice” și primeai altul. Nu se vedea ca două intenții, se
   vedea ca o scăpare. Bara verticală a ieșit la cerere, îngroșarea la fel.

   Cu bold-ul dispare și un truc: numele mărcii avea lățimea variantei
   îngroșate rezervată dinainte, printr-un `after:` invizibil cu
   `content: attr(data-nume)`, ca rândul să nu se lățească și să împingă
   cifra la fiecare trecere cu mouse-ul. Fără îngroșare, n-are ce împinge.

   ─── CIFRA ARE COLOANA EI ──────────────────────────────────────────────

   `min-w-6` plus `text-right`: cifrele stau pe o coloană de lățime fixă,
   deci săgeata de după ele cade în același loc pe toate rândurile. Fără
   asta, un „4” și un „22” mutau săgeata cu o literă între rânduri — se
   vedea la „Accesorii Stocare 4” lângă „Acumulatori Low-Voltage 22”, iar
   ochiul citește coloana aia ca strâmbă înainte să înțeleagă de ce.
   `tabular-nums` face restul: cifrele au lățimi egale între ele.
   ────────────────────────────────────────────────────────────────────── */
/* GREUTATEA ȘI HOVER-UL, DUPĂ O PRIVIRE PE ECRAN.

   Erau text obișnuit gray-700 pe fundal avo-50 la hover: corect pe hârtie —
   contrastul trecea pragul — dar într-o fereastră de meniu, unde te uiți o
   secundă și treci mai departe, se citea ca o listă stinsă, iar rândul de sub
   mouse abia se deosebea de vecini.

   În repaus: `font-medium` și culoarea de text plină a site-ului, nu o
   treaptă de gri. La 13px, greutatea 500 e diferența dintre un rând care se
   citește dintr-o privire și unul care cere să fie căutat.

   La hover: fundalul urcă de la avo-50 la avo-100 — o treaptă întreagă, nu o
   nuanță — iar textul trece pe avo-800. Două semne în loc de unul slab.

   CE NU SE SCHIMBĂ LA HOVER E GREUTATEA. Ar fi fost cel mai simplu mod de a
   întări efectul și e exact cel care s-a scos acum o iterație: textul îngroșat
   e mai lat, deci rândul se lățește sub mouse. Aici nu s-ar mai vedea la
   cifră, fiindcă ea are coloana ei fixă, dar numele s-ar reteza altfel la
   fiecare trecere. Culoarea și fundalul nu mișcă niciun pixel. */
const RAND_LISTA =
  "group/rand flex items-center justify-between gap-2 rounded-md px-2.5 py-2 " +
  "transition-colors hover:bg-avo-100 focus-visible:outline-2 focus-visible:outline-avo-600";

const NUME_RAND =
  "truncate text-[13px] font-medium text-fg transition-colors group-hover/rand:text-avo-800";

const NUMAR_RAND =
  "min-w-6 text-right text-[12.5px] font-semibold text-muted tabular-nums transition-colors " +
  "group-hover/rand:text-avo-800";

const SAGEATA_RAND =
  "text-avo-600 opacity-0 transition-all duration-150 " +
  "group-hover/rand:translate-x-0.5 group-hover/rand:opacity-100";

/**
 * Rândul de categorii de sub banner, pe pagina /catalog.
 *
 * ─── CE ESTE ──────────────────────────────────────────────────────────────
 *
 * Cele opt categorii de nivel 1, ca butoane egale pe un rând — tiparul
 * magazinelor mari, unde sub reclama principală stă „cuprinsul" pe
 * departamente. Fiecare buton duce la pagina categoriei, iar la hover (sau la
 * focus, de la tastatură) deschide o fereastră.
 *
 * Textele și cifrele sunt EXACT cele din meniul din stânga (`incarcaBaraFiltre`
 * din lib/panou.ts). Aceeași sursă, deci cele două meniuri nu pot spune lucruri
 * diferite.
 *
 * ─── FEREASTRA: SUBCATEGORII ÎN STÂNGA, UN PRODUS ÎN DREAPTA ──────────────
 *
 * A fost doar o listă albă de subcategorii. Acum are două jumătăți, după
 * tiparul meniurilor de magazin: lista la stânga, iar la dreapta un produs real
 * din categorie, cu poză, preț și buton spre fișa lui.
 *
 * CE PRODUS, după o regulă, nu ales de mână — ca luna viitoare să se schimbe
 * singur, odată cu catalogul:
 *
 *   1. o ofertă a lunii din categorie (`featured`), dacă există;
 *   2. altfel, cel cu cea mai mare economie la prețul de volum;
 *   3. altfel, cel mai scump.
 *
 * Doar produse cu fotografie și cu preț. Eticheta de deasupra spune ce regulă
 * l-a ales („Oferta lunii", „Cea mai mare economie la volum", „Din categorie"),
 * deci nu afirmă nimic ce datele nu susțin — fără „recomandat" sau „cel mai
 * vândut".
 *
 * Și categoriile fără subcategorii (panouri, conversie, stații de încărcare)
 * au acum fereastră: înainte n-aveau ce arăta, acum au produsul. În stânga, în
 * locul subcategoriilor, stau brandurile categoriei cu numărul de produse (vezi
 * `branduriDin`).
 *
 * ─── DE CE FĂRĂ JAVASCRIPT ────────────────────────────────────────────────
 *
 * Doar CSS: `group-hover` și `group-focus-within`. Componenta rămâne de server.
 *
 * `invisible` + `opacity-0`, nu `hidden`: fereastra apare cu o tranziție scurtă
 * de opacitate, fără să se miște, iar linkurile din ea pot primi focus de la Tab.
 *
 * `pt-2` pe înveliș, nu `mt-2` pe fereastră: golul dintre buton și fereastră e
 * tot în interiorul elementului `group`, altfel mouse-ul care coboară ar ieși din
 * zona de hover și fereastra s-ar închide pe drum.
 *
 * JUMĂTATEA DIN DREAPTA A RÂNDULUI se deschide spre stânga (`right-0`).
 * Fereastra are 560px; la 1024px containerul are 928, deci una lipită la stânga
 * butonului al cincilea ar ieși din ecran.
 *
 * ─── DOAR DE LA `lg` ──────────────────────────────────────────────────────
 *
 * Sub 1024px opt butoane nu încap pe un rând, iar hover-ul nu există pe touch.
 * Acolo pagina are etichetele de categorie de deasupra grilei.
 *
 * ─── CULORI ȘI CONTRASTE (prag AA 4,5:1) ──────────────────────────────────
 *
 *   bandă ............ avo-900 #00214F
 *   buton ............ avo-800 #002D64, alb pe el 13,50 ✓
 *   hover ............ avo-600 #004A99, alb pe el  8,61 ✓
 *   rama ferestrei ... 5px avo-600, aceeași cu butonul aprins; 8,61 pe alb
 *   jumătatea dreaptă  #EEF3F9, ca fondul bannerului de deasupra; gray-900
 *                      pe el 15,9 ✓, gray-600 6,8 ✓. Poza e
 *                      `mix-blend-multiply`, din motivul scris în HeroCatalog:
 *                      e decupată pe alb, iar înmulțită albul ia culoarea
 *                      fondului.
 *
 * Butonul de categorie 8px (comandă), fereastra 12px (suprafață), badge-urile
 * 6px (etichete).
 */

const eur = (n: number) => n.toLocaleString("ro-RO");

type Promovat = { p: Produs; motiv: string; economie: number };

/** Produsul din dreapta ferestrei, după regula din capul fișierului. */
function produsPromovat(slug: string, produse: Produs[]): Promovat | null {
  const din = produse.filter((p) => p.categorie?.slug === slug && p.imagine && p.pret);
  if (din.length === 0) return null;

  const economie = (p: Produs) =>
    p.pret && p.pretVolum && p.pretVolum < p.pret ? p.pret - p.pretVolum : 0;

  const oferte = din.filter((p) => p.oferta);
  if (oferte.length > 0) {
    const p = oferte.sort((a, b) => economie(b) - economie(a))[0];
    return { p, motiv: "Oferta lunii", economie: economie(p) };
  }

  const cuEconomie = din.filter((p) => economie(p) > 0);
  if (cuEconomie.length > 0) {
    const p = cuEconomie.sort((a, b) => economie(b) - economie(a))[0];
    return { p, motiv: "Cea mai mare economie la volum", economie: economie(p) };
  }

  const p = din.sort((a, b) => (b.pret ?? 0) - (a.pret ?? 0))[0];
  return { p, motiv: "Din categorie", economie: 0 };
}

/**
 * Brandurile unei categorii, cu câte produse are fiecare, cele mai mari primele.
 *
 * Pentru categoriile FĂRĂ subcategorii (panouri, conversie, stații de încărcare),
 * unde stânga ferestrei avea doar „Toate produsele" și o frază despre lipsa
 * subcategoriilor. Brandurile sunt a doua împărțire firească a unui catalog de
 * echipamente — după ele cumpără un instalator — și sunt deja în date.
 *
 * Numele afișat e cel din lib/branduri.ts când brandul e cunoscut („Felicity"
 * de pe produs devine „Felicity Solar"), altfel cel scris pe produs. Produsele
 * fără brand (structuri generice) nu apar, dar rămân în totalul de deasupra.
 */
function branduriDin(
  slug: string,
  produse: Produs[],
): { nume: string; slug: string | null; produse: number }[] {
  const numarate = new Map<string, { slug: string | null; produse: number }>();
  for (const p of produse) {
    if (p.categorie?.slug !== slug || !p.brand) continue;
    const b = gasesteBrand(p.brand);
    const nume = b?.nume ?? p.brand;
    const intrare = numarate.get(nume) ?? { slug: b?.slug ?? null, produse: 0 };
    intrare.produse++;
    numarate.set(nume, intrare);
  }
  return [...numarate]
    .map(([nume, x]) => ({ nume, ...x }))
    .sort((a, b) => b.produse - a.produse || a.nume.localeCompare(b.nume, "ro"));
}

export default function MeniuCategorii({
  categorii,
  produse = [],
}: {
  categorii: CategorieFiltru[];
  produse?: Produs[];
}) {
  if (categorii.length === 0) return null;

  return (
    /* ── ERA ASCUNS PE TELEFON ────────────────────────────────────────────
       Avea `hidden lg:block`, deci sub 1024px prima pagină și catalogul
       rămâneau fără nicio intrare în categorii: singura cale spre marfă era
       meniul din bara de sus. Pe un magazin, asta înseamnă că vizitatorul de
       pe telefon — majoritatea — nu vedea ce vindem decât dacă deschidea un
       meniu.

       Acum se vede peste tot. Diferența e cum:

         sub lg .... rând care se trage cu degetul, plăci de 132px
         de la lg .. grilă care împarte coloana în părți egale, ca înainte

       Fereastra cu subcategorii rămâne doar de la lg în sus: se deschide la
       hover, iar pe ecran tactil hover-ul nu există. Pe telefon, placa duce
       direct la categorie, ceea ce e oricum ce vrea degetul. */
    /* ══════════════════════════════════════════════════════════════════════
       BANDA TRAVERSEAZĂ ECRANUL, PLĂCILE STAU ÎN COLOANĂ
       ──────────────────────────────────────────────────────────────────────
       Culoarea e pe `<nav>`, deci albastrul merge de la o margine a ferestrei
       la cealaltă. Plăcile dinăuntru rămân în `coloana`, aliniate cu bannerul
       de dedesubt și cu titlurile secțiunilor.

       A FOST ȘI INVERS o vreme — culoarea pe `<ul>`, deci banda cât coloana.
       Arăta îngrijit, dar banda e singurul element de navigare din pagină, iar
       o navigare care se oprește înainte de marginea ecranului se citește ca o
       secțiune de conținut, nu ca o bară. Acum e iar bară.

       Plăcile sunt lipite de muchiile coloanei, fără padding orizontal propriu:
       banda ESTE rândul de categorii, nu un chenar în jurul lui. Bannerul de
       dedesubt are padding interior fiindcă acolo e text, nu butoane.

       FĂRĂ SPAȚIU, NICI SUS, NICI JOS. Sus se lipește de bara cu sigla, jos de
       hero. Cele trei formează un singur cap de pagină; aerul vine abia după
       hero, din el.

       ─── RĂMÂNE PE ECRAN LA DERULARE ─────────────────────────────────────

       `sticky top-(--inaltime-navbar)`: se oprește exact sub bara cu sigla,
       care e `fixed` și are aceeași înălțime scrisă în aceeași variabilă
       (globals.css). Cele două nu se pot despărți, oricât s-ar schimba
       înălțimea barei la praguri — 68px pe telefon, 100px de la `lg`, 104px de
       la `2xl`.

       `sticky`, nu `fixed`: banda rămâne în fluxul paginii, deci nu trebuie ca
       nimeni să-i lase loc cu un padding. Un al doilea element `fixed` ar fi
       însemnat o a doua cifră de întreținut, exact problema pe care o rezolvă
       `--inaltime-navbar`.

       `z-40`, sub cei `z-50` ai barei: dacă s-ar egala, banda ar trece peste
       ea la derulare.
       ══════════════════════════════════════════════════════════════════════ */
    /* ─── CULORILE BENZII ─────────────────────────────────────────────────
       Banda `avo-800`, dalele `avo-600`. A fost invers ca idee: banda `avo-900`
       și dalele `avo-800`, adică două albastre lipite ca luminozitate — raportul
       dintre ele era 1,17, practic zero. Opt dreptunghiuri închise pe un fond
       închis nu se citeau ca opt butoane, ci ca o bară solidă cu text pe ea, iar
       ochiul trebuia să despartă singur cuvintele în grupuri.

       Măsurat pe cele patru variante puse una lângă alta: a deschide TOATĂ banda
       nu rezolvă nimic (la o treaptă mai sus raportul urcă doar la 1,23, la două
       trepte la 1,27) fiindcă fondul și dalele urcă împreună. Ce rezolvă e să
       rămână distanță între ele: banda urcă o treaptă, dalele sar trei. Raportul
       ajunge la 1,56.

       DALELE SUNT PE ALBASTRUL BUTOANELOR (`avo-600`), nu pe o nuanță aleasă
       pentru bandă. În site, avo-600 plin înseamnă „aici poți apăsa" — pe buton,
       pe săgeata benzii, pe coșul din card. Categoriile chiar sunt apăsabile.

       Hover-ul a trebuit mutat pe `avo-500`: era tot `avo-600`, care acum e
       culoarea de repaus, deci trecerea cu mouse-ul n-ar mai fi schimbat nimic.

       Contrastul textului alb rămâne peste prag: 8,61 pe avo-600, față de 13,47
       cât era pe avo-800. Pragul cerut pentru text de 13px e 4,5.
       ────────────────────────────────────────────────────────────────────── */
    <nav
      aria-label="Categorii principale"
      className="sticky top-(--inaltime-navbar) z-40 bg-avo-800"
    >
      <div className="coloana">
      {/* UN SINGUR RÂND DE OPT, CÂT SE POATE.

          Două ture ratate înainte, și amindouă merită scrise, ca să nu se
          repete:

            `zoom`, ca la hero .... banda e o grilă `fr`, deci se întinde
                                   oricum pe toată coloana. Singurul lucru
                                   pe care îl făcea era să micșoreze textul:
                                   la 860px dalele rămâneau opt, dar scrisul
                                   cădea la 9,4px. Exact pe dos.
            două rânduri de patru . respins la cerere: o bară de navigație
                                   lipicioasă care ocupă două rânduri mănâncă
                                   prea mult din ecran.

          Rămas: opt coloane pe un rând, cu textul la corpul lui, care se
          rupe pe două–trei rânduri în dală. Podeaua e 850px, iar cifra nu e
          aleasă: cel mai lung cuvânt din etichete e „Monitorizare”, care la
          12px cere ~80px, plus cei 16 de spațiu interior — deci dala nu
          poate coborî sub ~96px fără să taie cuvinte. Opt dale de 96 plus
          șapte spații de 8 cer 824px de coloană, adică o fereastră de ~872.

          Sub 850px rămâne rândul derulabil cu dale de 132px, tiparul de pe
          telefon, unde eticheta a fost dintotdeauna citibilă. */}
      <ul
        data-banda-categorii
        className="fara-bara-derulare flex gap-2 overflow-x-auto py-3 min-[53.125rem]:grid min-[53.125rem]:grid-cols-8 min-[53.125rem]:overflow-x-visible"
      >
        {categorii.map((c) => {
          const promovat = produsPromovat(c.slug, produse);
          const sigla = promovat?.p.brand ? gasesteBrand(promovat.p.brand) : undefined;
          const branduri = c.subcategorii.length === 0 ? branduriDin(c.slug, produse) : [];

          return (
            /* `w-[132px] shrink-0` doar pe rândul derulabil, sub 850px: într-un rând care se derulează,
               plăcile trebuie să aibă o lățime a lor, altfel flex le strânge
               până intră toate pe ecran și textul se rupe pe patru rânduri.
               De la lg, grila le dă lățimi egale și cele două clase ies. */
            <li key={c.slug} className="group relative w-[132px] shrink-0 min-[53.125rem]:w-auto">
              <Link
                href={`/catalog/${c.slug}`}
                className="flex h-14 items-center justify-center rounded-lg bg-avo-600 px-2 text-center text-[12px] leading-tight font-semibold text-white transition-colors group-hover:bg-avo-500 group-focus-within:bg-avo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white xl:text-[13px]"
              >
                {c.nume}
              </Link>

              {/* SE VEDEA DOAR DE LA 1024px în sus (`lg:block`), deci pe o
                  fereastră strânsă dispuărea cu totul: rămâneau opt butoane
                  care duceau direct în categorie, fără subcategorii și fără
                  mărci. Acum apare oriunde banda e grilă, adică de la 850px.
                  Fereastra are 560px și încape și acolo: coloana are 802.

                  ÎPRE CE PARTE SE DESCHIDE O HOTĂRĂȘTE CSS-UL, NU MARCAJUL.
                  Era `i >= categorii.length / 2`, adică primele patru spre
                  dreapta, ultimele patru spre stânga — socoteală corectă cât
                  timp exista un singur rând de opt. Pe două rânduri de patru,
                  a patra dală e în colțul din dreapta al primului rând, dar
                  are indicele 3, deci s-ar fi deschis spre dreapta și ar fi
                  ieșit din pagină cu vreo 400px.

                  Coloana în care cade o dală depinde de pragul de lățime, iar
                  marcajul, randat o singură dată, n-are de unde s-o știe.
                  CSS-ul are: `nth-child` numără câte patru sau câte opt, după
                  media query. Vezi „FEREASTRA BENZII DE CATEGORII” în
                  globals.css. */}
              <div
                data-fereastra
                className="invisible absolute top-full z-50 hidden pt-3 opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 min-[53.125rem]:block"
              >
                {/* RAMA: 5px `avo-500`, aceeași culoare cu a dalei APRINSE de
                    deasupra, ca butonul atins și fereastra deschisă să se
                    citească drept un singur obiect. A fost 3px și s-a îngroșat
                    la cerere — la 3 se citea încă drept contur, nu drept ramă.
                    A fost și `avo-600` cât timp acela era hover-ul dalei; de
                    când dalele stau în repaus pe avo-600 și se aprind pe avo-500,
                    rama a urmat hover-ul. Contrast 4,60 pe alb, peste pragul de
                    3:1 pentru elemente negrafice.

                    Fără conturul de 1px `gray-200` al celorlalte suprafețe
                    (`SUPRAFATA`): cu acela, fereastra albă peste pagina tot
                    albă se citea ca o bucată de pagină desprinsă, nu ca un
                    meniu deschis. Fără umbră mare — conturul face delimitarea,
                    regula site-ului.

                    ─── FEREASTRA ATÂRNĂ DE BANDĂ, NU PLUTEȘTE SUB EA ─────

                    Nu are latură de sus și n-are colțuri rotunjite sus. Linia
                    de care începe e chiar muchia de jos a benzii albastre:
                    fereastra se continuă din ea, ca un sertar tras în jos.
                    Cu ramă de jur împrejur, arăta ca o cutie pusă peste
                    pagină, cu o dungă de 5px între ea și banda din care
                    plecase.

                    `pt-3`, nu `pt-2`, pe înveliș: 12px e exact spațiul de sub
                    dală (`py-3` pe listă), deci fereastra pleacă fix de pe
                    muchia benzii. Cu 8 intra 4px peste bandă, iar rama ei se
                    suprapunea peste albastru. Învelișul acela e și puntea pe
                    care trece mouse-ul de la dală la fereastră fără ca ea să
                    se închidă — de-aia spațiul stă ca `padding` pe elementul
                    care se arată, nu ca `margin`.

                    `overflow-hidden` taie fondul coloanei din dreapta pe raza
                    interioară (12 − 5 = 7px), deci rama rămâne întreagă în
                    colțurile de jos. `w-[560px]` include rama (border-box). */}
                                {/* UMBRA E EXCEPȚIA DE LA REGULA SITE-ULUI, și are motiv.
                    Peste tot altundeva delimitarea o face conturul, fiindcă
                    suprafețele stau ÎN pagină, una lângă alta. Fereastra asta
                    stă PESTE ea — acoperă hero-ul de dedesubt. Fără umbră,
                    ce e sub ea se citește la același nivel, iar fereastra pare
                    o bucată de pagină care s-a lățit peste restul.

                    E coborâtă mult și estompată tare (18px în jos, 40 de
                    întindere, 12 de strângere), în albastrul închis al paletei,
                    nu în negru: negrul peste un fond albăstrui dă o pată gri
                    care se citește ca murdărie. La 28% nu se vede ca umbră,
                    doar ridică fereastra deasupra paginii. */}
                <div className="flex w-[560px] max-w-[calc(100vw-2*var(--coloana-pad))] overflow-hidden rounded-b-xl border-x-[5px] border-b-[5px] border-avo-500 bg-white shadow-[0_18px_40px_-12px_rgb(0_33_79/0.28)]">

                  {/* ── Stânga: categoria și subcategoriile ── */}
                  <div className="w-[248px] shrink-0 p-2">
                    {/* CAPUL FERESTREI: NUMELE CATEGORIEI, NU „TOATE PRODUSELE".

                        Scria „Toate produsele", ceea ce era adevărat, dar se
                        repeta identic în toate cele opt ferestre — deschideai
                        oricare și primul rând spunea același lucru. Numele
                        categoriei spune și unde ești, și unde duce linkul.

                        Iconul e desenul obiectului din categorie, nu o metaforă:
                        panoul cu celulele lui, cutia invertorului, rastelul de
                        acumulatori. Vezi IconCategorie.tsx pentru de ce sunt
                        desenate acolo și nu luate din setul lucide al site-ului.

                        Numele poate fi lung („Echipamente Conversie & Comutare"),
                        iar coloana are 248px: `leading-tight` îl lasă să cadă pe
                        două rânduri fără să umfle rândul, `items-start` ține
                        iconul lipit de primul rând de text, nu centrat pe două.

                        Săgeata alunecă 2px la hover — același gest ca la
                        legăturile din josul secțiunilor, ca să nu apară un al
                        doilea fel de a spune mergi mai departe. */}
                    <Link
                      href={`/catalog/${c.slug}`}
                      className="group/tot flex items-center justify-between gap-2 rounded-md bg-avo-50 px-2.5 py-2.5 transition-colors hover:bg-avo-100 focus-visible:outline-2 focus-visible:outline-avo-600"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <IconCategorie
                          slug={c.slug}
                          className="shrink-0 text-avo-600 [&>svg]:h-[26px] [&>svg]:w-[26px]"
                        />
                        <span className="text-[13px] leading-tight font-bold text-avo-800">
                          {c.nume}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[13px] font-bold text-avo-700 tabular-nums">
                          {c.produse}
                        </span>
                        <ChevronRight
                          size={14}
                          aria-hidden
                          className="text-avo-600 transition-transform duration-150 group-hover/tot:translate-x-0.5"
                        />
                      </span>
                    </Link>

                    {c.subcategorii.length > 0 ? (
                      <>
                        {/* LISTA ARE UN NUME, nu doar o linie deasupra. Era o
                            dungă de 1px și atât: se vedea că urmează altceva,
                            dar nu ce anume. Sub „Stocare Energie 39", cinci
                            rânduri fără cap puteau fi la fel de bine mărci,
                            filtre sau produse.

                            Eticheta ține și locul liniei — două semne pentru
                            aceeași despărțire ar fi fost unul în plus. */}
                        <p className={ETICHETA_LISTA}>Subcategorii</p>
                        <ul>
                          {c.subcategorii.map((s) => (
                            <li key={s.slug}>
                              <Link
                                href={`/catalog/${c.slug}/${s.slug}`}
                                className={RAND_LISTA}
                              >
                                <span className={NUME_RAND}>{s.nume}</span>
                                <span className="flex shrink-0 items-center gap-1.5">
                                  <span className={NUMAR_RAND}>{s.produse}</span>
                                  {/* Săgeata apare doar sub mouse. În repaus ar fi
                                      pus o coloană de opt vârfuri identice, care nu
                                      spun nimic; apărând, arată exact rândul pe care
                                      ești. Locul îi rămâne rezervat prin opacitate,
                                      nu prin `hidden`, ca cifra să nu sară lateral
                                      la fiecare trecere cu mouse-ul. */}
                                  <ChevronRight size={13} aria-hidden className={SAGEATA_RAND} />
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : branduri.length > 0 ? (
                      /* FĂRĂ SUBCATEGORII: brandurile categoriei.
                         Aici scria „Categoria nu are subcategorii — toate cele 28
                         produse sunt pe o singură pagină": o frază despre ce
                         lipsește, în locul unei liste. Brandurile umplu același
                         loc cu informație.

                         SUNT LINKURI SPRE PAGINA CATEGORIE + BRAND:
                         `/catalog/<categorie>/brand-<slug>`, o pagină proprie,
                         pregătită dinainte și indexabilă (vezi lib/pagini-brand.ts).
                         A fost `?brand=<slug>` până la trecerea pe site static, unde
                         un parametru citit pe server n-are cine să-l citească. Au
                         fost rânduri simple cât timp filtrul nu exista — un link
                         spre categoria întreagă ar fi promis o filtrare pe care
                         n-o făcea.

                         HOVER-UL e rețeta subcategoriilor din meniul din stânga al
                         paginii (app/catalog/page.tsx): o bară avo-600 de 2px pe
                         marginea rândului, iar numele și cifra trec pe bold avo-600.
                         Lățimea bold e rezervată dinainte cu `after:` +
                         `data-nume`, ca rândul să nu se lățească și să împingă
                         cifra când textul se îngroașă.

                         Un brand pe care lib/branduri.ts nu-l cunoaște n-are slug,
                         deci n-are filtru: rămâne rând simplu, fără link. */
                      <>
                        <p className={ETICHETA_LISTA}>Branduri</p>
                        <ul>
                          {branduri.map((b) => (
                            <li key={b.nume}>
                              {b.slug ? (
                                <Link
                                  href={`/catalog/${c.slug}/brand-${b.slug}`}
                                  className={RAND_LISTA}
                                >
                                  <span className={NUME_RAND}>{b.nume}</span>
                                  <span className="flex shrink-0 items-center gap-1.5">
                                    <span className={NUMAR_RAND}>{b.produse}</span>
                                    <ChevronRight size={13} aria-hidden className={SAGEATA_RAND} />
                                  </span>
                                </Link>
                              ) : (
                                /* Marcă necunoscută în lib/branduri.ts: n-are pagină,
                                   deci nu e link. Păstrează aceeași geometrie ca
                                   rândurile vecine — aceleași spații, aceeași coloană
                                   de cifre, plus locul gol al săgeții — ca lista să nu
                                   se clatine acolo unde un rând nu duce nicăieri. */
                                <span className="flex items-center justify-between gap-2 px-2.5 py-2">
                                  <span className="truncate text-[13px] font-medium text-fg">{b.nume}</span>
                                  <span className="flex shrink-0 items-center gap-1.5">
                                    <span className="min-w-6 text-right text-[12.5px] font-semibold text-muted tabular-nums">
                                      {b.produse}
                                    </span>
                                    <span aria-hidden className="w-[13px]" />
                                  </span>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>

                  {/* ── Dreapta: un produs real din categorie ──

                      FONDUL E `canvas`, TOKENUL SITE-ULUI, nu #EEF3F9 scris de
                      mână. Erau două griuri albăstrui aproape identice în
                      aceeași fereastră — fondul coloanei și caseta albă a pozei
                      — iar diferența dintre ele se citea ca o scăpare de
                      randare, nu ca două suprafețe. Pe `canvas` caseta albă se
                      desprinde clar, și coloana asta nu mai e singurul loc din
                      site cu o culoare numai a ei.

                      Capul are linie dedesubt, ca titlurile de secțiune din
                      pagină: același fel de a spune „aici începe ceva". */}
                  {promovat ? (
                    <div className="flex min-w-0 flex-1 flex-col border-l border-line bg-canvas p-4">
                      <p className="text-[10.5px] font-bold tracking-[0.08em] text-muted uppercase">
                        {promovat.motiv}
                      </p>
                      <div aria-hidden className="mt-2 h-px w-full bg-line" />

                      {/* ÎNĂLȚIME FIXĂ, 144px, nu `aspect-[4/3]`. Cu proporția,
                          poza avea ~204px în jumătatea de 272px, iar fereastra
                          întreagă trecea de 420px: pe un ecran de 900px butonul
                          „Vezi detalii" ieșea sub marginea de jos — măsurat la
                          Invertoare și Panouri. `object-contain` micșorează poza
                          fără s-o taie. */}
                      {/* FOTOGRAFIA PRIMEȘTE O CASĂ, nu mai plutește pe fond.
                          Stătea direct pe tenta albăstruie a coloanei, iar
                          produsul — alb sau gri deschis, cum sunt invertoarele
                          și acumulatorii — se topea în ea. Caseta albă cu contur
                          de 1px e aceeași rețetă ca zona foto a cardului de
                          produs (CardProdus.tsx): două locuri din site care arată
                          un produs pe fond colorat, aceeași soluție.

                          `mix-blend-multiply` rămâne: fotografiile din catalog au
                          fundal alb copt, iar pe alb multiply nu schimbă nimic —
                          dar dacă vreodată caseta capătă altă culoare, albul se
                          topește singur în ea. */}
                      <div className="relative mt-2 h-36 w-full overflow-hidden rounded-card border border-line bg-white p-2">
                        {promovat.p.imagine ? (
                          <Image
                            src={promovat.p.imagine.url}
                            alt={promovat.p.imagine.alt ?? promovat.p.nume}
                            fill
                            sizes="280px"
                            className="object-contain mix-blend-multiply"
                          />
                        ) : null}
                        <div className="absolute top-2 left-2 flex gap-1.5">
                          {promovat.p.oferta ? (
                            <span className={`${BADGE} ${BADGE_CARD} ${BADGE_OFERTA}`}>Ofertă</span>
                          ) : null}
                          {promovat.economie > 0 ? (
                            <span className={`${BADGE} ${BADGE_CARD} ${BADGE_ECONOMIE}`}>
                              −{formatEconomie(promovat.economie)} € / {promovat.p.unitate}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {sigla ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/branduri/color/${sigla.slug}.webp`}
                          alt={sigla.nume}
                          height={16}
                          className="mt-3 h-4 w-auto self-start"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}

                      <p className="mt-2 line-clamp-2 text-[14px] leading-snug font-bold text-gray-900">
                        {promovat.p.nume}
                      </p>

                      <p className="mt-2 flex items-baseline gap-1 leading-none whitespace-nowrap text-gray-900">
                        <span className="text-[24px] font-extrabold">{eur(promovat.p.pret ?? 0)}</span>
                        <span className="text-[15px] font-bold">€</span>
                        <span className="text-[12px] font-medium text-gray-600">/ {promovat.p.unitate}</span>
                      </p>
                      {promovat.p.pretVolum && promovat.p.prag ? (
                        <p className="mt-1 text-[12px] text-faint">
                          {eur(promovat.p.pretVolum)} € de la {promovat.p.prag}
                        </p>
                      ) : null}

                      {/* SĂGEATA ALUNECĂ 2px LA HOVER, ca la toate legăturile
                          care duc mai departe din site. Butonul era un
                          dreptunghi plin fără niciun semn de direcție — corect,
                          dar mut.

                          `mt-auto` în loc de `mt-3`: îl lipește de fundul
                          coloanei, deci butonul cade pe aceeași linie oricât de
                          lung ar fi numele produsului de deasupra. Cu `mt-3`
                          urca și cobora de la o categorie la alta. */}
                      <Link
                        href={`/catalog/produs/${promovat.p.slug}`}
                        className={`${BUTON_PLIN} group/btn mt-auto w-full`}
                      >
                        Vezi detalii
                        <ArrowRight
                          size={16}
                          aria-hidden
                          className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
                        />
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      </div>
    </nav>
  );
}
