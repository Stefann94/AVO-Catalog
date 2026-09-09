import Link from "next/link";
import { incarcaBaraFiltre } from "@/lib/panou";
import { incarcaPerioadaCatalog } from "@/lib/perioada";
import { SUPRAFATA } from "./stiluri";

/**
 * Bara de filtre — cuprinsul catalogului, în stânga paginii.
 *
 * ─── UNDE ÎNCEPE ȘI UNDE SE OPREȘTE ───────────────────────────────────────
 *
 * Bara ține cât ține conținutul secțiunii „Gama de produse":
 *
 *   PORNEȘTE  de pe linia de sub titlul „Categoriile principale…"
 *   SE OPREȘTE cu 40px înainte de finalul secțiunii, nelipită de el
 *   ÎNTRE ELE  stă lipită de fereastră, nemișcată cât derulezi
 *
 * Toate trei ies din aceeași construcție, fără JavaScript:
 *
 *   un înveliș `absolute top-(--bara-sus) bottom-10` într-un părinte `relative`
 *   care cuprinde DOAR secțiunea „Gama de produse" (vezi app/page.tsx).
 *   `--bara-sus` e 184px, iar de unde iese scrie în app/globals.css;
 *
 *   panoul dinăuntru e `sticky` la înălțimea barei fixe plus 1,5rem, deci se
 *   lipește de fereastră fără s-o atingă, dar nu poate ieși din înveliș nici
 *   în sus, nici în jos.
 *
 * ─── CUM S-A AJUNS LA CELE DOUĂ CAPETE ────────────────────────────────────
 *
 * Sunt a treia variantă, iar primele două au picat pe pagina randată, nu pe
 * hârtie. Merită scrise, ca să nu fie reluate:
 *
 *   `top-28 bottom-0` ... pornea din dreptul titlului și se termina FIX pe
 *      marginea secțiunii. Măsurat la 1920×1080: 112px de gol deasupra
 *      panoului și 0 dedesubt. Panoul părea căzut, lipit de finalul secțiunii.
 *
 *   `top-14 bottom-14` ... aceiași 112px, împărțiți în două. Ieșea centrat
 *      perfect — 56px sus, 56px jos, măsurat — dar capătul de sus nu mai cădea
 *      pe nimic: plutea în padding-ul secțiunii, la 56px deasupra titlului.
 *
 * Ce a rămas leagă capătul de sus de o muchie care EXISTĂ în pagină: linia de
 * 1px de sub titlu. Bara începe de acolo, deci pare tăiată din aceeași
 * așezare, nu așezată peste ea. Jos rămân 40px de respiro.
 *
 * CAPĂTUL DE JOS DEPINDE DE PADDING-UL SECȚIUNII, și asta trebuie știut
 * înainte de a umbla la oricare dintre ele. `bottom-10` se măsoară de la
 * marginea secțiunii, iar GamaProduse are sub ultimul rând de conținut
 * `lg:pb-20`, adică 80px. Panoul se oprește deci la 40px sub conținut și la
 * 40px deasupra marginii — fix la mijlocul padding-ului. Dacă acel padding
 * scade, `bottom` trebuie să scadă odată cu el; altfel panoul ajunge lipit de
 * ultimul rând, adică exact în varianta respinsă mai sus. A fost `bottom-14`
 * cât timp padding-ul era `lg:py-28`.
 *
 * COSTUL, spus pe față: retragerea de 184px din capul secțiunii scurtează
 * panoul cu tot atât, iar zona derulabilă pierde exact cât pierde panoul.
 * Lista are ~935px de conținut, deci se derula și înainte — se derulează acum
 * mai mult, iar bara de derulare o arată. Dacă se dorește mai multă listă
 * vizibilă, pârghia nu e capătul de jos, ci colapsarea subcategoriilor.
 *
 * ─── DE CE NU `fixed` ─────────────────────────────────────────────────────
 *
 * A fost încercat, în mai multe feluri, și fiecare a picat pe același lucru:
 * `fixed` are o poziție constantă față de FEREASTRĂ și nu știe nimic despre
 * document, deci nu poate nici să înceapă la un titlu, nici să se oprească la
 * altul. Ori e pe ecran mereu — și atunci acoperă hero-ul și plutește peste
 * footer — ori i se adaugă JavaScript care o aprinde și o stinge, iar aprinsul
 * și stinsul sunt tot o formă de mișcare.
 *
 * `sticky` mărginit face exact ce se cerea, și o face din geometrie.
 *
 * ─── UNDE STĂ PE ORIZONTALĂ ───────────────────────────────────────────────
 *
 * Bara e centrată în marja liberă cât timp marja e strâmtă, și se ALIPEȘTE de
 * coloana de conținut de îndată ce marja se lărgește. Calculul e în
 * app/globals.css; motivul e aici, fiindcă e o decizie de desen, nu de cod.
 *
 * Centrarea singură arăta bine la 1920 — 34px până la fereastră, 34px până la
 * text — dar la 2560 lăsa bara la 194px de amândouă, măsurat pe pagina
 * randată. O listă care descrie catalogul, plutind singură într-un gol de
 * 194px, nu mai citește ca aparținând catalogului; citește ca un obiect uitat
 * acolo. De la 2040px în sus câștigă alipirea, iar distanța până la text rămâne
 * 64px, la orice lățime de ecran.
 *
 * ─── REGULA CARE A DECIS TOT RESTUL ───────────────────────────────────────
 *
 * Conținutul paginii nu se atinge. Nicio secțiune nu-și schimbă lățimea, nicio
 * grilă nu pierde o coloană. Bara încape în marja goală lăsată de containerul
 * centrat — sau nu apare deloc.
 *
 * Pragul e scris ca atare, nu luat din scara Tailwind: pragurile standard
 * (1280, 1536) n-au nicio legătură cu lățimea conținutului nostru.
 *
 * A FOST 1620px, unde marja e de 170px. Motivul scris atunci era că 170px e
 * „minimul la care o listă de categorii mai e citibilă". Măsurat pe pagina
 * randată, nu e: la 170px se rup pe două rânduri TOATE cele 16 etichete, de la
 * „Panouri Fotovoltaice" în jos. Cifrele, numărând câte etichete din 16 se rup:
 *
 *     170px (fereastră 1620) ... 16 din 16
 *     210px (fereastră 1700) ...  6 din 16
 *     240px (fereastră 1760) ...  2 din 16 — cele două nume lungi de tot
 *     300px (fereastră 1880) ...  0
 *
 * Pragul e acum 1760px, adică prima lățime la care bara arată a listă, nu a
 * bloc de text rupt. Sub el nu se pierde nimic: aceleași categorii sunt în
 * secțiunea de alături, cu fotografii. Cele două nume care încă se rup —
 * „Echipamente Conversie & Comutare" și „Monitorizare & Smart Devices" — au
 * peste 28 de caractere; un rând al doilea la ele e normal, nu e înghesuială.
 *
 * ─── TREI ETAJE, DIN CARE SE DERULEAZĂ UNUL SINGUR ────────────────────────
 *
 * Panoul e o coloană flex cu trei etaje: antetul, lista, nota de subsol.
 * Antetul și nota sunt `shrink-0`, lista e `flex-1 min-h-0 overflow-y-auto`.
 *
 * De-aici ies trei lucruri deodată, și toate trei au fost cerute:
 *
 *   ANTETUL NU SE MIȘCĂ NICIODATĂ. Nu e „lipit sus" prin `sticky`, ci pur și
 *   simplu în afara zonei care se derulează. Diferența se vede: un antet
 *   `sticky` mai poate fi împins de conținut în situații de margine, unul
 *   scos din zona derulabilă nu poate, fiindcă n-are cum.
 *
 *   NOTA DE PREȚ E PODEAUA. Fără ea, lista se termina cu o tăietură dreaptă în
 *   mijlocul unei subcategorii — muchia arăta ca o eroare de randare, nu ca
 *   marginea unei zone derulabile. Acum lista intră VIZIBIL pe sub o linie,
 *   ceea ce se citește ca „mai e".
 *
 *   BARA DE DERULARE ȚINE EXACT CÂT LISTA. Merge de sub antet până deasupra
 *   notei, nu de la un capăt la altul al panoului. Cu `overflow` pus pe tot
 *   panoul — cum era — bara nativă traversa și antetul, și nota, deși pe
 *   acolo nu se derulează nimic; o dungă care trece peste conținut fix minte
 *   despre ce anume se mișcă.
 *
 * `min-h-0` pe etajul din mijloc nu e ornament: un element flex are implicit
 * `min-height: auto`, adică refuză să scadă sub înălțimea conținutului. Fără
 * el, lista ar fi împins panoul peste plafonul lui de înălțime și nu s-ar fi
 * derulat NIMIC — cele trei etaje ar fi ieșit pur și simplu din secțiune.
 *
 * ─── CUM E DESENATĂ ───────────────────────────────────────────────────────
 *
 * Ca orice altă suprafață din site, nu ca un panou plutitor. Regula secțiunii
 * „Gama de produse" e că CONTURUL FACE MUNCA, NU UMBRA, iar bara o încălca:
 * avea `shadow-xl` și un contur mai închis decât al cardurilor de lângă ea, așa
 * că se citea ca un widget lipit peste pagină. Argumentul de atunci — că bara
 * chiar plutește peste conținutul care se derulează pe dedesubt — nu se
 * verifică pe pagina randată: bara stă în marja goală, iar pe sub ea nu trece
 * nimic. Acum folosește `SUPRAFATA`, aceeași rețetă ca panourile din fișa de
 * produs și ca ștampila „Prețuri valabile" de alături.
 *
 * PANOUL E ALB PESTE TOT. Antetul și nota erau pe #F8F9FA, adică exact culoarea
 * paginii de sub bară — două benzi care păreau găurite în panou, cu albul prins
 * la mijloc. Despărțirea o fac acum linii de 1px retrase cu 20px de la margini,
 * ca panoul să citească drept UN obiect cu rânduri înăuntru, nu ca un teanc de
 * trei cutii.
 *
 * SCARA DE CORP e 15 / 13 / 12 / 11 / 10, cinci trepte. Erau șapte, dintre care
 * patru cu jumătăți de pixel (13,5 · 12,5 · 11,5 · 10,5) care nu se deosebeau
 * între ele decât la măsurătoare.
 *
 * NU MAI E NICIUN `text-gray-400`. Regula scrisă în GamaProduse.tsx spune că pe
 * alb gray-500 e cea mai deschisă treaptă admisă, fiindcă gray-400 dă 2,60:1,
 * sub pragul AA — iar bara scria în gray-400 toate cifrele și nota de subsol.
 * Ierarhia vine acum din corp și din greutate, nu din ștergerea contrastului.
 *
 * A CĂZUT ȘI `tabular-nums`, de pe toate cifrele. Nu făcea nimic: Libre
 * Franklin n-are cifre de lățime egală (vezi app/layout.tsx), iar clasa fusese
 * deja scoasă din restul site-ului exact din motivul ăsta.
 *
 * Contraste (prag AA text normal 4,5:1):
 *   gray-900 #101828 pe alb ... 17,75 ✓  nume de categorie, titlul barei
 *   gray-600 #4A5565 pe alb .... 7,56 ✓  nume de subcategorie
 *   gray-500 #6A7282 pe alb .... 4,84 ✓  etichete, cifre, nota de subsol
 *   avo-700  #003B7D pe avo-50 . 10,06 ✓  numele și cifra, la hover
 *   gray-900 #101828 pe avo-50 . 16,73 ✓  vecinii rândului atins
 *
 * ─── CE ARATĂ ─────────────────────────────────────────────────────────────
 *
 * Structura catalogului, nu o listă inventată. Cele 36 de secțiuni din PDF-ul
 * lunar devin la import categorii și subcategorii WooCommerce, iar arborele de
 * acolo e reprodus aici întocmai: opt categorii, fiecare cu subcategoriile ei.
 * Distincțiile după care se cumpără — monofazat de trifazat, low-voltage de
 * high-voltage — sunt în subcategorii, deci fără ele bara ar fi arătat un
 * catalog mult mai sărac decât e.
 */

/**
 * Eticheta măruntă a unui bloc.
 *
 * E rețeta scrisă în GamaProduse.tsx pentru eticheta ștampilei „Prețuri
 * valabile", copiată caracter cu caracter — inclusiv `tracking-wider`, care
 * aici era `tracking-[0.08em]`. Diferența e de 0,03em, adică invizibilă; dar
 * scrisă ca valoare arbitrară arăta ca o a doua rețetă de etichetă, iar a doua
 * rețetă e felul în care un site ajunge cu șapte.
 *
 * `gray-500` pe alb dă 4,84 — peste pragul de 4,5 cerut pentru text normal,
 * deși e scrisă la 10px.
 */
function Eticheta({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-600">
      {children}
    </span>
  );
}

/**
 * „de" înaintea substantivului, după regula românească a numeralului.
 *
 * Se pune când ultimele două cifre sunt 00 sau 20–99: „172 DE produse", dar
 * „8 categorii" și „101 produse". Scrisă ca funcție, nu ghicită o dată în text,
 * fiindcă cifrele vin din WooCommerce și se schimbă lunar: la 19 produse un
 * „de" fix ar da „19 de produse", iar la 20 lipsa lui ar da „20 produse".
 *
 * Pragul `n >= 20` ține zeroul afară: 0 % 100 e tot 0, deci fără el ar ieși
 * „0 de produse".
 */
function cuDe(n: number): string {
  return n >= 20 && (n % 100 === 0 || n % 100 >= 20) ? "de " : "";
}

export default async function BaraFiltre() {
  // Cele două pleacă odată: perioada nu depinde de bară, iar înlănțuite ar
  // aduna două drumuri până la WordPress în randare.
  const [{ stari, categorii }, perioada] = await Promise.all([
    incarcaBaraFiltre(),
    incarcaPerioadaCatalog(),
  ]);

  // Suma de pe categorii, nu de pe stările de stoc. Amândouă dau 172 azi, dar
  // una singură descrie lista de dedesubt — iar dacă vreodată nu se mai
  // potrivesc, cifra din subsol trebuie să fie cea a listei pe care o închide.
  const totalProduse = categorii.reduce((s, c) => s + c.produse, 0);

  return (
    <div
      /* Sus, pe linia de sub titlul secțiunii (`--bara-sus`, 184px, calculat în
         globals.css); jos, cu 56px înainte de finalul ei. Vezi capul fișierului
         pentru cele două variante încercate înainte și de ce au picat.

         Lățimea și poziția orizontală vin din variabilele din globals.css.

         `pointer-events-none` aici, `auto` pe panou: învelișul e o coloană
         înaltă cât secțiunea, iar fără asta ar înghiți clicurile din zona goală
         de sub panou. */
      className="pointer-events-none absolute top-(--bara-sus) bottom-10 left-(--bara-stanga) z-30 hidden w-(--bara-latime) min-[1760px]:block"
    >
      <aside
        aria-label="Cuprinsul catalogului"
        /*
         * `max-h` are DOUĂ plafoane, și amândouă sunt necesare:
         *
         *   `100%`  ... înălțimea învelișului, adică de la linia de sub titlu
         *               până la 56px de finalul secțiunii. Fără el, cele ~30 de
         *               rânduri ar fi ieșit pe sub marginea secțiunii și ar fi
         *               intrat peste „Ofertele lunii" — exact ce nu trebuie.
         *   `100vh - navbar - 3.5rem` ... înălțimea ferestrei minus tot ce e
         *               deasupra panoului: bara fixă de sus (variabila din
         *               globals.css), cei 1,5rem de decalaj ai lui `sticky` și
         *               2rem de aer rămas jos. Era scris `100vh - 10rem`, adică
         *               aceeași socoteală cu `top-32` băgat în cifră.
         *               Fără el, pe un ecran scund bara ar fi coborât sub
         *               marginea de jos, iar ultimele categorii ar fi fost
         *               inaccesibile: un element lipit de fereastră nu se
         *               derulează cu pagina.
         *
         * Câștigă cel mai mic dintre ele, de-aia `min()`.
         *
         * `overflow-hidden` ține colțurile: etajul din mijloc e un dreptunghi,
         * iar fără el marginea lui ar ieși peste raza panoului. Nu el face
         * derularea — aia e pe etajul din mijloc, ca bara nativă să înceapă sub
         * antet și să se oprească deasupra notei.
         */
        className={`${SUPRAFATA} pointer-events-auto sticky top-[calc(var(--inaltime-navbar)+1.5rem)] flex max-h-[min(100%,calc(100vh-var(--inaltime-navbar)-3.5rem))] flex-col overflow-hidden`}
      >
        {/* ── ETAJUL 1: antetul ──
            În afara zonei derulabile, deci nemișcat orice s-ar întâmpla în
            listă. Linia de despărțire e marginea lui de jos, adică exact muchia
            peste care alunecă lista.

            Titlul rămâne mic, cât o etichetă: bara e un instrument lateral, iar
            un titlu pe măsura celor din pagină ar fi concurat cu „Categoriile
            principale…" de la câțiva centimetri distanță. */}
        <div className="shrink-0 px-5 pt-4">
          <Eticheta>Catalog</Eticheta>
          {perioada.eticheta ? (
            <span className="mt-1.5 block text-[17px] leading-tight font-extrabold text-gray-900">
              {perioada.eticheta}
            </span>
          ) : null}
          {perioada.interval ? (
            <span className="mt-1 block text-[11px] text-gray-500">
              {perioada.interval}
            </span>
          ) : null}
          <div aria-hidden className="mt-4 h-px bg-gray-200" />
        </div>

        {/* ── ETAJUL 2: singurul care se derulează ──
            `min-h-0` e obligatoriu; vezi comentariul din capul fișierului. */}
        <div className="derulare-avo min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* ── Disponibilitate ──
              Primul bloc fiindcă e singurul atribut cu acoperire completă pe
              catalog: 172 din 172 de produse au o stare. Orice altă cifră din
              bară descrie o parte; asta descrie tot.

              Nu sunt linkuri: `/catalog/<ceva>` nu știe azi să filtreze după
              disponibilitate, iar un link către o pagină care ignoră filtrul e
              mai rău decât niciun link. Devin linkuri fără altă modificare aici
              în ziua în care paginile de catalog primesc filtrare pe atribute. */}
          <div className="px-5 pt-4 pb-4">
            <Eticheta>Disponibilitate</Eticheta>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {stari.map((s) => {
                /* Starea perisabilă e scrisă în gray-900, restul în gray-600.
                   Nu e o culoare nouă: e aceeași ierarhie de tonuri ca
                   badge-urile de pe fișa de produs (lib/produs.ts → TON), unde
                   „urgent" e tot gray-900. Un verde și un roșu ar fi rupt regula
                   de un singur accent pe care o ține tot site-ul, și ar fi cerut
                   fiecare propria verificare de contrast. */
                const urgent = s.slug === "lichidare-stoc";

                /* DOAR LICHIDAREA E LINK, și asta nu e o inconsecvență.
                   „În stoc" și „La comandă" descriu 157 din 172 de produse —
                   un link către ele ar duce la aproape tot catalogul, adică
                   la ceva ce butonul „Vezi catalogul complet" face deja.
                   Lichidarea descrie 15 produse care dispar la epuizare; aia
                   e o listă care merită pagina ei.

                   Rândul devine link cu ACELEAȘI clase de hover ca o categorie,
                   ca să nu inventăm un al doilea fel de rând apăsabil. */
                const continut = (
                  <>
                    <span
                      className={`text-[13px] leading-snug ${
                        urgent
                          ? "font-semibold text-gray-900 transition-colors group-hover:text-avo-700"
                          : "text-gray-600"
                      }`}
                    >
                      {s.eticheta}
                    </span>
                    <span
                      className={`shrink-0 rounded-md px-1.5 text-center text-[12px] font-bold ${
                        urgent ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.produse}
                    </span>
                  </>
                );

                return (
                  <li key={s.slug}>
                    {urgent ? (
                      <Link
                        href="/catalog/lichidare-stoc"
                        className="group -mx-2 flex items-baseline justify-between gap-3 rounded-md px-2 py-1 transition-colors hover:bg-avo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
                      >
                        {continut}
                      </Link>
                    ) : (
                      <span className="flex items-baseline justify-between gap-3">
                        {continut}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Linia dintre blocuri: retrasă cu 20px, cât padding-ul panoului.
              Dusă dintr-o margine în alta, ar fi tăiat panoul în felii și l-ar
              fi făcut să pară un teanc de cutii; retrasă, e un rând al aceluiași
              obiect. Singura linie care merge margine-în-margine e cea de
              deasupra notei de subsol, fiindcă aceea închide obiectul. */}
          <div aria-hidden className="mx-5 h-px bg-gray-200" />

          {/* ── Categoriile, cu subcategoriile lor ──
              Asta E structura catalogului. Vezi comentariul din capul
              fișierului pentru de ce nu doar cele opt de nivel 1. */}
          <div className="px-5 pt-4 pb-4">
            <Eticheta>Categorii</Eticheta>

            <ul className="mt-2.5 flex flex-col gap-3.5">
              {categorii.map((c) => (
                <li key={c.slug}>
                  {/* Rândul se lățește cu 8px în afara coloanei de text
                      (`-mx-2 px-2`), ca fundalul de hover să depășească literele
                      și să arate ca un rând, nu ca o etichetă lipită pe text.

                      Cifra se colorează odată cu numele. Lăsată gri, la hover
                      rândul se rupea în două: jumătatea din stânga albastră,
                      jumătatea din dreapta nu.

                      FUNDALUL DE HOVER E `avo-50`, NU UN GRI. A fost #F8F9FA
                      — adică exact culoarea paginii de sub panou, aceeași
                      greșeală pe care capul fișierului o descrie pentru antet
                      și notă: „două benzi care păreau găurite în panou". Un
                      rând care la hover ia culoarea paginii nu se aprinde, se
                      găurește.

                      Pe `avo-50` accentul apare NUMAI la interacțiune, nicăieri
                      în repaus — ceea ce e chiar regula site-ului: culoarea o
                      primesc elementele de decizie, iar un rând devine decizie
                      abia când e atins.

                      CIFRELE AU COLOANĂ PROPRIE, prin `min-w` plus aliniere la
                      dreapta. Erau lipite de marginea rândului, fiecare unde o
                      ducea lungimea numelui, deci de la 4 la 51 marginea din
                      stânga a cifrei sărea. Font-ul n-are cifre de lățime egală
                      (vezi app/layout.tsx), deci `tabular-nums` n-ar fi ajutat;
                      o lățime minimă, da. */}

                  <Link
                    href={`/catalog/${c.slug}`}
                    className="group -mx-2 flex items-baseline justify-between gap-3 rounded-md px-2 py-1 transition-colors hover:bg-avo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
                  >
                    <span className="text-[13px] leading-snug font-bold text-gray-900 transition-colors group-hover:text-avo-700">
                      {c.nume}
                    </span>
                    <span className="shrink-0 rounded-md bg-gray-100 px-1.5 text-center text-[12px] font-bold text-gray-600 transition-colors group-hover:bg-white group-hover:text-avo-700">
                      {c.produse}
                    </span>
                  </Link>

                  {/* Subcategoriile, retrase și mai mici.

                      Retragerea o face o linie verticală, nu un padding gol:
                      numele lungi se rup pe două rânduri, iar fără linie al
                      doilea rând ar începe din marginea din stânga și ierarhia
                      s-ar pierde exact acolo unde e mai greu de citit. */}
                  {c.subcategorii.length > 0 ? (
                    <ul className="mt-1 ml-2 flex flex-col border-l border-gray-200 pl-3">
                      {c.subcategorii.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/catalog/${c.slug}/${s.slug}`}
                            className="group -mx-1.5 flex items-baseline justify-between gap-3 rounded-md px-1.5 py-[3px] transition-colors hover:bg-avo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
                          >
                            <span className="text-[12px] leading-snug text-gray-600 transition-colors group-hover:text-avo-700">
                              {s.nume}
                            </span>
                            <span className="shrink-0 min-w-[2.25ch] text-right text-[11px] text-gray-500 transition-colors group-hover:text-avo-700">
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
          </div>
        </div>

        {/* ── ETAJUL 3: totalul ──
            Tot în afara zonei derulabile.

            AICI SCRIA NOTA DE TVA ȘI DEEE, iar problema ei nu era formularea:
            aceeași condiție e scrisă, cuvânt cu cuvânt, în subsolul secțiunii
            de alături — „Prețurile sunt exprimate în EUR, fără TVA. Taxa verde
            DEEE nu este inclusă (0,7 RON / kg)" — și a treia oară pe fiecare
            pagină a catalogului tipărit. Două exemplare vizibile simultan, la
            câțiva centimetri unul de altul, nu conving pe nimeni mai mult decât
            unul; doar ocupă podeaua barei cu ceva ce omul tocmai a citit.

            Pe deasupra, era o notă despre PREȚURI într-un panou care nu arată
            niciun preț. Bara arată câte produse sunt și unde stau.

            Totalul e ce spune un cuprins la final: cât ține cartea. Nu e scris
            nicăieri altundeva în pagină — cardurile dau cifre pe categorie,
            bara le dă pe fiecare rând, dar suma n-o dă nimeni — și răspunde la
            întrebarea pe care și-o pune cineva care se uită la o listă înainte
            s-o deschidă: cât e de mare?

            Se calculează din categoriile chiar afișate deasupra, nu dintr-o
            constantă: dacă WooCommerce întoarce altceva, cifra se mută odată cu
            lista, nu rămâne să mintă.

            Conturul de sus e singurul care merge dintr-o margine în alta a
            panoului. Liniile dintre blocuri sunt retrase cu 20px, fiindcă
            despart rânduri ale aceluiași obiect; asta închide obiectul. */}
        <p className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 text-[11px] leading-relaxed text-gray-500">
          <span className="font-semibold text-gray-900">
            {totalProduse} {cuDe(totalProduse)}produse
          </span>{" "}
          în {categorii.length} {cuDe(categorii.length)}categorii
        </p>
      </aside>
    </div>
  );
}
