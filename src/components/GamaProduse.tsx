import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { incarcaPerioadaCatalog } from "@/lib/perioada";
import { SUBCATEGORII_CUNOSCUTE, caleSubcategorie } from "@/lib/categorii";
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

   4. TREI NIVELURI ÎN CARD, fiecare cu un rol.
      Ierarhia se face din greutate, dimensiune și închidere, în ordinea în
      care se citește cardul:

        1. titlu ......... 17px  bold (700)     gray-900   ancora de scanare
        2. fișa tehnică .. 13px  medium (500)   gray-700   datele de decizie
        3. ancoră ........ 28px  extrabold      avo-600    singura culoare

      Etichetele fișei, marcajul „DE LA" și unitatea „/ buc" stau în afara
      scării: sunt marcaje, nu conținut. Toate la 10–11px, medium, gray-500 —
      majusculele și spațierea le identifică deja ca etichete, deci bold-ul
      peste ele era o a treia insistență pe același lucru.

      NIVELUL 2 A FOST O DESCRIERE ÎN PROZĂ, apoi un rând de sigle. Ambele au
      căzut, din motive diferite.

      Proza scria, de pildă, „N-Type TOPCon · 14 modele bifaciale". Problema
      ei, verificată în src/lib/categorii.ts: enumerările cu punct median
      sugerau paritate acolo unde catalogul n-o are. „Hibride, on-grid și
      off-grid" acoperea 29 / 4 / 2 produse; „low și high voltage", 22 / 4;
      „acoperiș plat, țiglă, tablă trapezoidală", 6 / 1 / 7. Cineva care intra
      pe promisiunea „off-grid" sau „țiglă" găsea două, respectiv un singur
      SKU — clic irosit, cea mai scumpă formă de dezamăgire într-un catalog.
      În plus, jumătate din fapte nu decideau nimic: „LiFePO4" e implicit la
      orice acumulator în 2026, iar raportul 14/28 modele bifaciale nu schimbă
      nicio comandă.

      Siglele rezolvau onestitatea, dar aduceau prea multă greutate vizuală
      într-un card de 281px: trei imagini plus o pastilă, peste o fotografie
      care are deja un badge. Cardul devenise aglomerat.

      FIȘA TEHNICĂ le înlocuiește pe amândouă. Două perechi etichetă/valoare,
      cu exact aceleași cifre pe care le-ar fi comunicat proza — dar spuse
      complet: nu „hibride, on-grid și off-grid", ci „29 din 35 hibride". E
      forma în care informația chiar ajută la decizie, fiindcă arată unde e
      adâncimea, nu doar ce există.

      FIȘA S-A SCRIS O VREME ÎN MONO, cu valorile în gray-900 semibold. N-a
      ținut. Într-un card de 281px, a doua familie de fonturi nu citește ca
      precizie, ci ca o bucată lipită din alt document — iar greutatea de pe
      valori le scotea înaintea titlului, adică fix pe dos față de ordinea în
      care trebuie citit cardul. Aceeași concluzie ca prima oară când monoul
      fusese scos din același loc.

      Acum tot cardul stă pe DM Sans, iar diferența dintre niveluri o fac
      numai dimensiunea, greutatea și închiderea. Alinierea pe verticală între
      carduri rămâne, fiindcă o dă coloana fixă de etichete, nu fontul.

   Contraste verificate (prag WCAG AA, text normal 4.5:1):
     gray-900 #101828 pe alb ........ 17.75 ✓  (titlu card)
     gray-700 #364153 pe alb ........ 10.30 ✓  (specificație tehnică)
     gray-500 #6A7282 pe alb ......... 4.84 ✓  („DE LA", unitate, etichete)
     avo-600  #004A99 pe alb ......... 8.61 ✓  (preț, săgeți, buton principal)
     alb pe avo-600 .................. 8.61 ✓  („Vezi catalogul complet")
     alb pe gray-900 #101828 ........ 17.75 ✓  (bannerul închis)
     avo-300 #92C1FF pe gray-900 ..... 9.54 ✓  (iconița de pe banner)

   DE CE UNITATEA „/ buc" NU E gray-400. Ar fi treapta firească pentru un
   element subordonat, dar gray-400 (#99A1AF) dă 2,60:1 pe alb — sub pragul
   AA de 4,5:1, la un text de 11px. „/ buc" nu e decorativ: spune dacă
   prețul e pe bucată sau pe panou, adică schimbă sensul cifrei de lângă el.
   Subordonarea vine din dimensiune (11px față de 28px) și greutate (400
   față de 800), care o obțin oricum, fără să sacrifice lizibilitatea.
   Pentru orice text nou se aplică aceeași regulă: gray-500 e cea mai
   deschisă treaptă admisă pe alb.
   ══════════════════════════════════════════════════════════════════════════ */

/** Un rând din fișa tehnică a cardului. */
type Specificatie = { eticheta: string; valoare: string };

type Categorie = {
  slug: string;
  nume: string;
  produse: number;
  /** Exact două rânduri. Trei au făcut cardul greu, unul singur nu spune destul. */
  specificatii: [Specificatie, Specificatie];
  deLa?: number;
  unitate?: string;
  /**
   * Ancora de jos pentru categoriile fără preț comparabil. Aceeași gramatică
   * cu a prețului (etichetă + cifră mare + unitate mică), dar în gray-900:
   * accentul albastru rămâne rezervat cifrelor pe care le compari între ele.
   */
  statistica?: { eticheta: string; valoare: string; unitate: string };
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
    specificatii: [
      { eticheta: "Putere", valoare: "410 – 770 Wp" },
      { eticheta: "Branduri", valoare: "5" },
    ],
    deLa: 54,
    unitate: "panou",
    imagine: imgPanouri,
  },
  {
    slug: "invertoare",
    nume: "Invertoare",
    produse: 35,
    specificatii: [
      { eticheta: "Putere", valoare: "3,6 – 125 kW" },
      { eticheta: "Hibride", valoare: "29 din 35" },
    ],
    deLa: 355,
    unitate: "buc",
    imagine: imgInvertoare,
  },
  {
    slug: "stocare-energie",
    nume: "Stocare Energie",
    produse: 39,
    specificatii: [
      { eticheta: "Capacitate", valoare: "4 – 241,5 kWh" },
      { eticheta: "Low-voltage", valoare: "22 din 39" },
    ],
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
    specificatii: [
      { eticheta: "Acoperiș", valoare: "Metalic, plat, țiglă" },
      { eticheta: "Componente", valoare: "9 din 51" },
    ],
    statistica: { eticheta: "K2 Systems", valoare: "28", unitate: "din 51 produse" },
    imagine: imgMontaj,
  },
];

const SECUNDARE = [
  { slug: "monitorizare-smart-devices", nume: "Monitorizare & Smart Devices", produse: 8 },
  { slug: "statii-de-incarcare-auto", nume: "Stații de Încărcare Auto", produse: 4 },
  { slug: "accesorii", nume: "Accesorii", produse: 4 },
  { slug: "echipamente-conversie-comutare", nume: "Echipamente Conversie & Comutare", produse: 3 },
];

/**
 * Subcategoriile arătate sub carduri.
 *
 * Ordinea e după numărul de produse din catalog, fiindcă ăsta e singurul
 * criteriu pe care îl avem: nu există date de vânzări nicăieri în proiect.
 * „Popular" înseamnă aici „cu cel mai mult de ales", nu „cel mai cerut" —
 * K2 Systems iese prima pentru că șinele și clemele au multe coduri, nu
 * pentru că s-ar vinde cel mai mult. Când apar date reale de comenzi,
 * criteriul se schimbă aici, într-un singur loc.
 *
 * Se opresc la 8: sunt 19 subcategorii în total, iar afișate toate ar
 * deveni o listă, nu o bandă de acces rapid. Ultimele 11 au între 1 și 4
 * produse și se ajunge la ele din pagina categoriei-părinte.
 */
const SUBCATEGORII_POPULARE = [...SUBCATEGORII_CUNOSCUTE]
  .sort((a, b) => b.produse - a.produse)
  .slice(0, 8);

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

            {/* Ștampila e o dată tehnică, dar rămâne în DM Sans, ca tot
                restul secțiunii. Fără umbră: contur de 1px. */}
            {perioada.interval ? (
              <div className="inline-flex items-center gap-3 shrink-0 self-start xl:self-auto h-10 sm:h-11 px-4 rounded-lg bg-white border border-gray-200">
                <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-gray-500">
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
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
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
                  <span className="absolute top-3 right-3 inline-flex items-center h-8 px-3 rounded-md bg-white/70 backdrop-blur-lg backdrop-saturate-150 border border-white/40 text-[13px] font-bold text-gray-900">
                    {c.produse} produse
                  </span>
                </div>

                {/* Conținut */}
                <div className="flex flex-col flex-1 p-5">
                  {/* NIVEL 1 — titlul.
                      Bold (700) și gray-900, aproape negru. E ancora după care
                      se scanează grila: ochiul trebuie să prindă categoria
                      înaintea oricărei cifre. Crescut de la 16px la 17px, cu
                      `h-12` în loc de `h-11`, ca două rânduri să încapă în
                      continuare fără să taie descendentele. */}
                  <h3 className="h-12 text-[17px] font-bold text-gray-900 leading-snug line-clamp-2">
                    {c.nume}
                  </h3>

                  {/* NIVEL 2 — fișa tehnică.

                      Două perechi etichetă/valoare, aliniate pe o coloană
                      comună de etichete. Muchia verticală pe care o creează
                      coloana e ce transformă două rânduri de text într-un
                      tabel: fără ea ar fi tot proză, doar scrisă mai scurt.

                      Lățimea coloanei e 80px, măsurată pe cea mai lungă
                      etichetă („Low-voltage"), plus rezervă. Fixă, nu `auto`,
                      ca valorile să înceapă în același loc pe toate cele patru
                      carduri — altfel fiecare card ar avea alt punct de
                      pornire și grila și-ar pierde ordinea.

                      NIMIC AICI NU E MONOSPAȚIAT. O a doua familie de fonturi
                      într-un card de 281px nu citește ca precizie, ci ca o
                      bucată lipită din alt document: cifrele ieșeau din
                      tiparul cardului și trăgeau ochiul înaintea titlului.
                      Aceeași concluzie ca data trecută, când monoul fusese
                      scos din același loc. Alinierea pe verticală rămâne
                      oricum, fiindcă o dă coloana de etichete, nu fontul. */}
                  <dl className="mt-3 space-y-2">
                    {c.specificatii.map((s) => (
                      <div key={s.eticheta} className="flex items-baseline gap-3">
                        {/* Eticheta e medium (500), nu bold. Majusculele și
                            spațierea spun deja „etichetă"; bold-ul peste ele
                            era a treia insistență pe același lucru și scotea
                            rândul în față mai tare decât titlul. */}
                        <dt className="w-20 shrink-0 text-[10px] font-medium uppercase tracking-[0.06em] text-gray-500 leading-tight">
                          {s.eticheta}
                        </dt>
                        {/* Valoarea e gray-700 medium, nu gray-900 semibold.
                            Fișa e nivelul al doilea al cardului: trebuie să se
                            citească limpede, nu să concureze titlul. */}
                        <dd className="min-w-0 truncate text-[13px] font-medium text-gray-700 leading-tight">
                          {s.valoare}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Linia interioară e mai deschisă decât conturul cardului
                      (gray-100 față de gray-200), ca să separe fără să pară
                      o a doua margine. */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between gap-3 min-h-[56px]">
                    <div className="min-w-0">
                      {c.deLa ? (
                        <>
                          {/* MARCAJ TEHNIC — „DE LA".
                              Bold (700) în loc de medium, cu spațiere de
                              0,05em. Bold-ul la 10px nu îngroașă, ci
                              densifică: eticheta citește ca marcaj de fișă
                              tehnică, nu ca text mărunt uitat acolo. */}
                          <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-gray-500 mb-1.5">
                            de la
                          </div>
                          {/* `items-baseline`, nu `items-center`: „€" și
                              „/ buc" stau pe linia de bază a cifrei. Centrate
                              pe înălțimea ei ar pluti la mijlocul lui 28px și
                              ar rupe rândul optic. */}
                          <div className="flex items-baseline gap-1">
                            <span className="text-[28px] sm:text-[30px] font-extrabold text-avo-600 leading-none">
                              {eur(c.deLa)}
                            </span>
                            <span className="text-base font-bold text-avo-600">€</span>
                            {/* Unitatea: greutate normală, mai mică decât
                                prețul. Subordonarea o dau dimensiunea și
                                greutatea, nu o culoare prea deschisă — vezi
                                nota despre gray-400 din capul fișierului. */}
                            <span className="ml-1.5 text-[11px] font-normal text-gray-500 truncate">
                              / {c.unitate}
                            </span>
                          </div>
                        </>
                      ) : c.statistica ? (
                        /* Aceeași construcție ca prețul — etichetă de 10px,
                           cifră mare, unitate mică pe linia de bază — dar în
                           gray-900, nu în avo-600. Albastrul înseamnă „cifră
                           pe care o compari cu alt furnizor"; asta e o măsură
                           a catalogului, nu un preț, și n-are voie să pretindă
                           altceva.

                           Poziția e însă identică, iar asta e tot rostul:
                           rândul de jos al grilei își păstrează linia de bază
                           optică pe toate cele patru carduri. */
                        <>
                          <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-gray-500 mb-1.5">
                            {c.statistica.eticheta}
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[28px] sm:text-[30px] font-extrabold text-gray-900 leading-none">
                              {c.statistica.valoare}
                            </span>
                            <span className="ml-1.5 text-[11px] font-normal text-gray-500 truncate">
                              {c.statistica.unitate}
                            </span>
                          </div>
                        </>
                      ) : null}
                    </div>

                    {/* Săgeata de acțiune, mărită de la 16px la 24px: la
                        dimensiunea veche citea ca ornament, nu ca îndemn.

                        Se deplasează 2px dreapta-sus la hover, în direcția în
                        care arată — mișcarea confirmă că duce undeva. Se
                        deplasează doar pictograma, nu și pastila din spate:
                        altfel s-ar muta tot blocul și ar părea că sare cardul.
                        Pastila e cu 8px mai mare decât săgeata pe fiecare
                        latură, deci cei 2px rămân bine în interior. */}
                    <span
                      aria-hidden
                      className="flex items-center justify-center h-10 w-10 shrink-0 rounded-lg text-avo-600 transition-colors duration-200 group-hover:bg-avo-50"
                    >
                      <ArrowUpRight
                        size={24}
                        strokeWidth={2.25}
                        className="transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Mergi direct la ────────────────────────────────
            Două grupuri, în același bloc, fiindcă din perspectiva cuiva care
            caută ceva anume sunt același lucru: o destinație îngustă. Că una e
            subcategorie în WooCommerce și cealaltă categorie de nivel 1 e un
            detaliu de implementare, nu un concept pentru vizitator. Sunt
            despărțite doar de o etichetă, ca ierarhia să rămână citibilă.

            Cele patru carduri de deasupra acoperă 153 din 172 de produse, dar
            trimit în categorii mari. Aici sunt destinațiile precise: 137 de
            produse stau în subcategorii care, până acum, n-aveau nicio cale
            de acces din pagina de start. */}
        <div className="mt-8 sm:mt-10">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Subcategorii cu cele mai multe produse
          </h3>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {SUBCATEGORII_POPULARE.map((s) => (
              <Link
                key={s.slug}
                href={caleSubcategorie(s)}
                className="group inline-flex items-center gap-2.5 h-10 pl-4 pr-3 rounded-lg bg-white border border-gray-200 outline-1 outline-transparent text-[13px] font-semibold text-gray-700 transition-colors duration-200 hover:border-avo-600 hover:outline-avo-600 hover:text-avo-600"
              >
                {s.nume}
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md bg-gray-100 text-[11px] font-semibold text-gray-600 transition-colors duration-200 group-hover:bg-avo-50 group-hover:text-avo-600">
                  {s.produse}
                </span>
              </Link>
            ))}
          </div>

          <h3 className="mt-6 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Restul categoriilor
          </h3>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {SECUNDARE.map((s) => (
              <Link
                key={s.slug}
                href={`/catalog/${s.slug}`}
                className="group inline-flex items-center gap-2.5 h-10 pl-4 pr-3 rounded-lg bg-white border border-gray-200 outline-1 outline-transparent text-[13px] font-semibold text-gray-700 transition-colors duration-200 hover:border-avo-600 hover:outline-avo-600 hover:text-avo-600"
              >
                {s.nume}
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md bg-gray-100 text-[11px] font-semibold text-gray-600 transition-colors duration-200 group-hover:bg-avo-50 group-hover:text-avo-600">
                  {s.produse}
                </span>
              </Link>
            ))}
          </div>
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
