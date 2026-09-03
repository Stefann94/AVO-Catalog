import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { incarcaPerioadaCatalog } from "@/lib/perioada";

import BannerB2B from "./BannerB2B";

/**
 * Imaginile sunt importate static, nu date ca șir de caractere.
 *
 * Așa Next le calculează la build un `blurDataURL` — o miniatură inline care
 * ține locul pozei cât se încarcă. Cu `src="/cat-panouri.jpg"` nu are de unde
 * s-o genereze, fiindcă nu vede fișierul la compilare, iar cardurile ar afișa
 * patru dreptunghiuri gri până sosesc imaginile.
 */
import imgPanouri from "../../public/cat-panouri.jpg";
import imgInvertoare from "../../public/cat-invertoare.jpg";
import imgStocare from "../../public/cat-stocare.jpg";
import imgMontaj from "../../public/cat-montaj.jpg";

/**
 * Gama de produse — categoriile, cu date agregate din catalog.
 *
 * Perioada de valabilitate vine din WooCommerce: importatorul o scrie pe fiecare
 * produs ca meta `_perioada_eticheta` / `_valabil_de` / `_valabil_pana`, iar
 * extensia din tools/wordpress o expune prin GraphQL. Se actualizează singură la
 * fiecare import lunar, fără atins codul.
 *
 * Cifrele pe categorie sunt încă din cele 172 de produse importate
 * (tools/catalog-import). La trecerea lor pe GraphQL se înlocuiesc cu
 * productCategories { count } + agregări de preț; markup-ul rămâne.
 *
 * "de la" apare DOAR unde e o ancoră onestă. La Sisteme de Montaj cel mai ieftin
 * produs e un suport de 1,87 € — inutil alături de "de la 54 €" — așa că acolo
 * arătăm acoperirea, nu prețul.
 */

/* ══════════════════════════════════════════════════════════════════════════
   Limbajul vizual al secțiunii
   ──────────────────────────────────────────────────────────────────────────
   Trei reguli, aplicate fără excepție. Ele sunt ce desparte secțiunea de un
   șablon generic, așa că orice adăugare ulterioară trebuie să le respecte.

   1. RAMPA NEUTRĂ E `gray`, NU `slate`.
      Fundalul secțiunii (#F8F9FA), conturul cardurilor (#E5E7EB) și griul
      tehnic (#6A7282) sunt exact `gray-50/200/500` din Tailwind v4. Restul
      site-ului e pe `slate`; aici trecem pe `gray` fiindcă e un neutru curat,
      fără tenta rece a lui slate, iar conturul de 1px devine astfel discret,
      nu albăstrui.

   2. CONTUR, NU UMBRĂ.
      Nicio clasă `shadow-*` în toată secțiunea. Adâncimea vine dintr-un
      contur solid de 1px. Umbrele difuze mari sunt exact semnătura vizuală a
      șabloanelor generice; un contur crisp citește ca desen tehnic, ceea ce
      se potrivește cu ce vinde firma.

   3. UN SINGUR ACCENT: `avo-600` (#004A99), pe hue-ul siglei.
      Îl primesc numai elementele de decizie — prețul principal și săgeata de
      acțiune — plus conturul cardului la hover. Nimic altceva. Secțiunea
      avea albastru, emerald cu degrade, galben și cyan în concurență; niciunul
      nu însemna nimic.

      Nu e `blue-600` (#2563EB), albastrul implicit din Tailwind: acela bate în
      violet și e același cu al lui Apple și al oricărui SaaS. Dar nu e nici
      albastrul literal al siglei, care e prea deschis pentru o cifră de preț
      pe alb. Vezi globals.css pentru cum e construită scara, de ce treapta
      600 coboară sub sigla și de ce cromatica e ținută sus.

   Raza de colț e 8px (`rounded-lg`) peste tot. A fost 12px, aceeași cu a
   butoanelor din navbar, dar pe un card de 330px lățime colțul acela rotunjea
   prea mult desenul; la 8px cardul citește ca placă tehnică, nu ca widget.
   Divergența față de navbar e asumată: acolo elementele sunt mici și scunde,
   unde 12px e proporțional.

   O singură excepție: badge-ul cu numărul de produse, la 6px (`rounded-md`).
   Motivul e că raza plină pe un element de 32px înălțime dă aproape o pilulă,
   iar eticheta cerea un aspect mai pătrat, de plăcuță. Diferența e
   intenționată, nu o scăpare — orice alt element nou rămâne la 8px.

   4. CARDUL SPUNE TREI LUCRURI, NU ȘAPTE.
      Ce categorie e, câte produse are, de la cât pornește. Atât. Restul se
      află după clic, în pagina categoriei, unde e loc ca datele tehnice să
      fie complete, nu tăiate la două rânduri.

        titlu ..... 16px bold (700)  gray-900   pe bandă de sticlă, peste poză
        badge ..... 13px bold (700)  gray-900   colțul din dreapta-sus
        preț ...... 19px extrabold   avo-600    în pastilă, jos-stânga
        îndemn .... 13px semibold    alb        buton avo-600, închide cardul

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

      BANDA DE STICLĂ de sub titlu folosește rețeta din navbar, literal:
      `bg-slate-100/80 backdrop-blur-2xl backdrop-saturate-150`. Nu e un
      degrade negru peste poză, cum se face de obicei — un degrade ar
      întuneca fotografia exact în partea de jos, unde la trei din patru
      poze stă subiectul.

   Contraste verificate (prag WCAG AA, text normal 4.5:1):
     gray-900 #101828 pe alb ........ 17.75 ✓  (titluri de secțiune)
     gray-900 pe banda de sticlă ... 10.16 ✓  (titlu card, badge — vezi mai jos)
     gray-500 #6A7282 pe alb ......... 4.84 ✓  („DE LA", eticheta pastilei)
     avo-600  #004A99 pe alb ......... 8.61 ✓  (preț, săgeți, buton principal)
     alb pe avo-600 .................. 8.61 ✓  („Accesează", „Vezi catalogul")
     alb pe gray-900 #101828 ........ 17.75 ✓  (bannerul închis)
     avo-300 #92C1FF pe gray-900 ..... 9.54 ✓  (iconița de pe banner)

   CUM IESE 10,16 PE BANDA DE STICLĂ. Cifra nu e o mostră luată dintr-o
   captură, ci marginea de jos, calculată. `bg-slate-100/80` compune 80%
   slate-100 (#F1F5F9) cu 20% din fotografia de dedesubt; cazul cel mai rău
   e o fotografie complet neagră, care dă un fundal de rgb(193,196,199).
   Titlul gray-900 pe el măsoară 10,16:1. La capătul celălalt, pe o
   fotografie albă, banda devine chiar slate-100 și raportul urcă la 15,9:1.
   Deci orice poză s-ar pune vreodată în carduri, titlul rămâne peste pragul
   AA — nu depinde de norocul unei imagini.

   PENTRU TEXT NOU, gray-500 e cea mai deschisă treaptă admisă pe alb.
   gray-400 (#99A1AF) dă 2,60:1, sub pragul AA, oricât de secundar ar părea
   elementul; subordonarea se obține din dimensiune și greutate, nu din
   ștergerea contrastului.
   ══════════════════════════════════════════════════════════════════════════ */


type Categorie = {
  slug: string;
  nume: string;
  produse: number;
  deLa?: number;
  unitate?: string;
  /**
   * Ancora de jos pentru categoriile fără preț comparabil. Aceeași gramatică
   * cu a prețului (etichetă mică + cifră mare), dar cifra e a catalogului,
   * nu un preț — vezi comentariul de la randare pentru de ce.
   */
  statistica?: { eticheta: string; valoare: string };
  imagine: StaticImageData;
};

/**
 * DE UNDE VIN CIFRELE DIN FIȘE. Fiecare e verificabilă, niciuna nu e rotunjită
 * sau estimată. Sursa e src/lib/categorii.ts, prin însumarea subcategoriilor:
 *
 *   Invertoare — 18 hibride trifazate + 11 monofazate = 29 din 35.
 *   Stocare ---- acumulatori low-voltage 22 din 39.
 *   Montaj ----- cleme și accesorii 6 + șine și profile 3 = 9 din 51.
 *
 * Numărul de branduri de la panouri vine din src/lib/branduri.ts și închide
 * exact: Aiko 14 + Canadian 9 + Jinko 3 + Tongwei 1 + Ulica 1 = 28, adică
 * fix numărul de produse din categorie. Suma care închide e ce dovedește că
 * lista de branduri e completă, nu doar plauzibilă.
 *
 * Formularea „N din M" e intenționată peste tot unde există un întreg. „29
 * hibride" ar fi adevărat, dar nu spune nimic despre restul; „29 din 35"
 * spune și cât de specializat e catalogul — exact informația după care un
 * instalator decide dacă merită să deschidă categoria.
 */

const CATEGORII: Categorie[] = [
  {
    slug: "panouri-fotovoltaice",
    nume: "Panouri Fotovoltaice",
    produse: 28,
    /* Panourile n-au subcategorii, deci al doilea rând nu poate fi o
       împărțire. Numărul de branduri e cea mai utilă alternativă reală: spune
       că nu ești legat de un singur furnizor, ceea ce la panouri — unde
       disponibilitatea variază de la lună la lună — chiar contează. */
    deLa: 54,
    unitate: "panou",
    imagine: imgPanouri,
  },
  {
    slug: "invertoare",
    nume: "Invertoare",
    produse: 35,
    deLa: 355,
    unitate: "buc",
    imagine: imgInvertoare,
  },
  {
    slug: "stocare-energie",
    nume: "Stocare Energie",
    produse: 39,
    deLa: 395,
    unitate: "buc",
    imagine: imgStocare,
  },
  {
    /**
     * Montajul nu are un preț de comparat — cel mai ieftin produs e o clemă de
     * 1,87 €, inutilă lângă „de la 54 €" — dar nici nu are voie să lase gol
     * slotul în care celelalte trei au o cifră: în grila de patru, absența
     * citește ca lipsă, nu ca decizie.
     *
     * Așa că primește o cifră adevărată, în aceeași gramatică: 28 din cele 51
     * de produse sunt K2 Systems (subcategoria K2, src/lib/categorii.ts). E
     * verificabil, e diferențiator — K2 e marcă germană de referință, iar
     * majoritatea catalogului de montaj e pe ea — și e exact genul de lucru
     * care dă un motiv de clic acolo unde prețul nu poate.
     *
     * Numitorul 51 e chiar numărul din badge-ul de pe fotografie, deci cele
     * două cifre ale cardului se explică una pe alta în loc să se repete.
     *
     * `interval` a fost „Structuri și componente" — un titlu, nu o dată, pus
     * exact în poziția în care celelalte carduri promit o măsurătoare.
     * Tipurile de acoperiș urcă aici fiindcă ele SUNT axa de selecție la
     * structuri; că e o axă categorială, nu numerică, nu contează — slotul
     * cere informația după care se alege, nu neapărat o cifră.
     */
    slug: "sisteme-de-montaj",
    nume: "Sisteme de Montaj",
    produse: 51,
    /* Singura categorie cu axă categorială, nu numerică: la structuri alegi
       după tipul de acoperiș, nu după o valoare. De-aia primul rând e în DM
       Sans, nu în mono.
       Al doilea rând răspunde la întrebarea care decide dacă mai cauți și în
       altă parte: vin și piesele mărunte, sau doar structura? Cine a comandat
       vreodată o structură fără cleme știe cât costă răspunsul greșit. */
    statistica: { eticheta: "K2 Systems", valoare: "28" },
    imagine: imgMontaj,
  },
];
const eur = (n: number) => n.toLocaleString("ro-RO");

export default async function GamaProduse() {
  /**
   * Perioada vine din încărcătorul comun din lib/perioada, nu dintr-un apel
   * propriu. Banda de sub hero cere aceeași valoare, iar interogarea e POST —
   * pe care Next nu o reunește automat, memoizarea lui fiind doar pentru GET.
   * `cache` din React face ca ambele componente să împartă o singură cerere,
   * iar rezerva scrisă în cod există într-un singur loc.
   */
  const perioada = await incarcaPerioadaCatalog();

  return (
    <section className="bg-[#F8F9FA] py-16 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* ── Masthead ───────────────────────────────────────── */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          {/* Ștampila trece lângă titlu abia de la xl: sub această lățime i-ar
              lăsa titlului ~574px, insuficient pentru un singur rând. */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 xl:gap-6">
            {/* Fără `tracking` negativ: aceeași spațiere ca titlul din hero.
                La un font geometric, strângerea literelor schimbă vizibil
                desenul și titlurile par a fi din fonturi diferite. */}
            <h2 className="text-[26px] sm:text-[34px] md:text-[40px] lg:text-[42px] font-extrabold text-gray-900 leading-tight sm:whitespace-nowrap">
              Gama de produse{perioada.eticheta ? ` ${perioada.eticheta}` : ""}
            </h2>

            {/* Ștampila e o dată tehnică, dar rămâne pe fontul global, ca tot
                restul secțiunii. Fără umbră: contur de 1px. */}
            {perioada.interval ? (
              <div className="inline-flex items-center gap-3 shrink-0 self-start xl:self-auto h-10 sm:h-11 px-4 rounded-lg bg-white border border-gray-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Prețuri valabile
                </span>
                <span aria-hidden className="h-4 w-px bg-gray-200" />
                <span className="text-xs sm:text-[13px] font-semibold text-gray-900 whitespace-nowrap">
                  {perioada.interval}
                </span>
              </div>
            ) : null}
          </div>

          <div aria-hidden className="mt-5 sm:mt-7 h-px w-full bg-gray-200" />

          <BannerB2B />
        </div>

        {/* ── Categorii ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {CATEGORII.map((c) => {
            return (
              <Link
                key={c.slug}
                href={`/catalog/${c.slug}`}
                /* Conturul e singurul lucru care se schimbă la hover: de la
                   gri de 1px la albastru de brand de 2px.

                   Al doilea pixel vine dintr-un `outline`, nu dintr-un
                   `border-2`. Motivul e că `border` intră în cutia
                   elementului: la 1px → 2px, zona de conținut s-ar strânge cu
                   2px, imaginea s-ar redimensiona și tot textul ar sări un
                   pixel la fiecare trecere a mouse-ului peste card. `outline`
                   se desenează în afara cutiei și nu influențează deloc
                   așezarea.

                   Outline-ul e prezent mereu, la 1px transparent, iar la hover
                   doar își schimbă culoarea. Dacă i-aș anima lățimea de la 0 la
                   1px, marginea ar „crește" sacadat; așa se schimbă doar
                   culoarea, lin, în aceeași tranziție cu border-ul.

                   Nu `ring`, care e box-shadow deghizat: secțiunea n-are nicio
                   umbră, iar regula rămâne curată. */
                className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 outline-1 outline-transparent bg-white transition-colors duration-200 hover:border-avo-600 hover:outline-avo-600"
              >
                {/* Imaginea merge până la marginea cardului, nu plutește într-o
                    ramă interioară: cu un card de 12px rază și 12px padding,
                    raza interioară corectă geometric ar fi 0, iar o poză cu
                    colțuri drepte într-o ramă rotunjită se vede prost. */}
                {/* `overflow-hidden` stă aici, nu doar pe card: fără el,
                    imaginea mărită la hover ar ieși peste colțurile rotunjite
                    ale ramei. */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <Image
                    src={c.imagine}
                    alt=""
                    fill
                    /* Cardul are cel mult ~296px la xl (7xl minus padding, în
                       4 coloane), deci 300px e limita reală, nu o presupunere.
                       Se cere cu 10% peste, fiindcă la hover imaginea e mărită
                       la 105% și altfel s-ar vedea ușor moale. */
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 330px"
                    placeholder="blur"
                    /* Tranziția stă pe element, nu pe starea de hover, ca
                       ieșirea din zoom să fie la fel de lină ca intrarea.
                       `ease-out` pornește repede și frânează la final —
                       senzația de mișcare condusă, nu de animație mecanică.
                       Se animă `transform`, singura proprietate pe care
                       browserul o rezolvă pe compozitor, fără redesenare. */
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />

                  {/* Sticlă mată, ca barele din navbar: alb semi-transparent,
                      blur puternic în spate și un plus de saturație, care e
                      ce face diferența dintre „sticlă" și „alb translucid".
                      Conturul alb foarte fin desenează muchia peste zonele
                      întunecate ale fotografiei.

                      `bg-white/70`, nu /60: peste cea mai închisă porțiune de
                      fotografie din cele patru, textul gray-900 dă 8,85:1, în
                      loc de 6,70:1. Ambele trec, dar imaginile se pot schimba. */}
                  <span className="absolute top-3 right-3 inline-flex items-center h-8 px-3 rounded-md bg-slate-100/80 backdrop-blur-2xl backdrop-saturate-150 border border-white/40 text-[13px] font-bold text-gray-900">
                    {c.produse} produse
                  </span>
                  {/* Banda cu titlul, așezată pe fotografie.

                      Rețeta de sticlă e copiată literal din navbar —
                      `bg-slate-100/80 backdrop-blur-2xl backdrop-saturate-150` —
                      nu aproximată. Saturația în plus e ce face diferența
                      dintre „sticlă" și „gri translucid": fără ea, culorile
                      fotografiei de dedesubt ies spălăcite și banda pare o
                      folie opacă.

                      Nu e un degrade negru peste poză, cum se face de obicei.
                      Un degrade ar întuneca fotografia tocmai în partea de jos,
                      unde la trei din patru poze stă subiectul; sticla o lasă
                      să se vadă întreagă, doar difuzată.

                      Titlul rămâne pe două rânduri maximum, cu înălțime fixă,
                      ca banda să aibă aceeași grosime pe toate cardurile —
                      altfel marginea de sus a benzii ar sări de la un card la
                      altul și grila și-ar pierde linia. */}
                  <div className="absolute inset-x-0 bottom-0 bg-slate-100/80 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/40 px-4 py-3">
                    <h3 className="text-[16px] font-bold text-gray-900 leading-tight truncate">
                      {c.nume}
                    </h3>
                  </div>
                </div>

                {/* Piciorul cardului: ancora de preț și îndemnul.

                    Fișa tehnică din mijloc a dispărut. Cardul spune acum trei
                    lucruri — ce categorie e, câte produse are, de la cât
                    pornește — iar restul se află după clic. Detaliile tehnice
                    nu decideau clicul; le acoperă pagina de categorie, unde e
                    loc să fie complete, nu tăiate la două rânduri.

                    „Accesează" nu e un `<button>` și nici un `<a>`: tot cardul
                    e deja un link, iar un element interactiv într-altul e
                    invalid și încurcă cititoarele de ecran. E un `<span>`
                    desenat ca buton, care reacționează la hover-ul cardului
                    întreg — deci și la clic oriunde pe card, nu doar pe el. */}
                <div className="flex items-stretch gap-2 p-3">
                  {c.deLa ? (
                    /* Prețul stă pe aceeași sticlă ca banda de sus. Aici
                       fotografia nu mai e dedesubt, deci translucidul se
                       citește ca un gri foarte deschis — exact rolul lui:
                       să despartă cifra de albul cardului fără o a doua ramă. */
                    <span className="inline-flex items-baseline gap-1 shrink-0 h-11 px-3.5 rounded-lg bg-slate-100/80 backdrop-blur-2xl backdrop-saturate-150 border border-slate-200/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        de la
                      </span>
                      <span className="text-[19px] font-extrabold text-avo-600 leading-none">
                        {eur(c.deLa)}
                      </span>
                      <span className="text-[12px] font-bold text-avo-600">€</span>
                      {/* Unitatea rămâne: „de la 54" fără ea nu spune dacă prețul
                          e pe panou sau pe bucată, adică e o cifră fără sens. */}
                      <span className="text-[10px] font-normal text-gray-500 whitespace-nowrap">/ {c.unitate}</span>
                    </span>
                  ) : c.statistica ? (
                    /* Montajul n-are preț de comparat — cel mai ieftin produs e
                       o clemă de 1,87 €, inutilă lângă „de la 54 €". Primește
                       în schimb cifra care chiar diferențiază categoria, în
                       aceeași pastilă și pe același loc, ca rândul de jos să
                       păstreze o linie comună pe toate cele patru carduri. */
                    <span className="inline-flex items-baseline gap-1 shrink-0 h-11 px-3.5 rounded-lg bg-slate-100/80 backdrop-blur-2xl backdrop-saturate-150 border border-slate-200/50">
                      <span className="text-[19px] font-extrabold text-avo-600 leading-none">
                        {c.statistica.valoare}
                      </span>
                      <span className="self-center text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                        {c.statistica.eticheta}
                      </span>
                    </span>
                  ) : null}

                  {/* Îndemnul ia toată lățimea rămasă, deci se termină exact la
                      marginea cardului: „se închide cardul cu un buton". */}
                  <span className="flex flex-1 min-w-0 items-center justify-center gap-1.5 h-11 px-3 rounded-lg bg-avo-600 text-[13px] font-semibold text-white transition-colors duration-200 group-hover:bg-avo-700">
                    Accesează
                    <ArrowUpRight
                      aria-hidden
                      size={16}
                      strokeWidth={2.5}
                      className="shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Subsol ─────────────────────────────────────────── */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
            Prețurile sunt exprimate în EUR, fără TVA. Taxa verde DEEE nu este inclusă
            (0,7 RON / kg). Disponibilitatea se confirmă la plasarea comenzii.
          </p>
          {/* Acțiunea principală a secțiunii, deci albastrul de brand — nu
              închis, ca să nu concureze cu bannerul. */}
          <Link
            href="/catalog"
            className="group inline-flex items-center justify-center gap-2 h-11 px-5 sm:px-6 w-full sm:w-auto shrink-0 rounded-lg bg-avo-600 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-avo-700"
          >
            Vezi catalogul complet
            <ArrowRight
              size={15}
              className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
