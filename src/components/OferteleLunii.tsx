import { incarcaPerioadaCatalog } from "@/lib/perioada";
import { incarcaCeleMaiBuneOferte, type Oferta } from "@/lib/oferte";
import type { CSSProperties } from "react";
import { dimensiuneTitluSectiune } from "./stiluri";
import BandaOferte from "./BandaOferte";
import CardOferta from "./oferte/CardOferta";

/**
 * Ofertele lunii — produsele de pe coperta catalogului.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DE CE ARATĂ AȘA
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Secțiunea nu inventează un limbaj propriu. Preia întocmai gramatica din
 * „Gama de produse", fiindcă stau una sub alta și orice diferență s-ar citi ca
 * scăpare, nu ca intenție:
 *
 *   masthead ..... titlu la stânga, ștampilă la dreapta, linie dedesubt
 *   grilă ........ 1 / 2 / 4 coloane, gap-4 sm:gap-5
 *   card ......... rounded-xl, contur gray-200, zonă vizuală sus + date jos
 *   badge ........ colțul din dreapta-sus al zonei vizuale
 *   preț ......... cifră 22px extrabold gray-900, unitatea 12px gray-500
 *   buton ........ h-10 px-5 rounded-full bg-avo-600
 *
 * ─── CE ȚINE LOCUL FOTOGRAFIEI ────────────────────────────────────────────
 *
 * Catalogul nu are imagini de produs — coloana Images nici nu există în CSV-ul
 * de import. Nu e o lipsă de acoperit cu un substituent gri: pentru cine
 * cumpără, cifra tehnică identifică produsul mai bine decât poza. Toate
 * panourile arată la fel într-o fotografie; „615 Wp" nu seamănă cu nimic
 * altceva.
 *
 * Așa că zona de sus păstrează proporția 4:3 a cardului de categorie, ca cele
 * două grile să aibă același ritm, dar e tipografică: cifra mare la mijloc,
 * brandul și SKU-ul pe o bandă jos — exact unde cardul de categorie își pune
 * titlul.
 *
 * Banda NU e sticla din „Gama de produse". backdrop-blur mediază ce se află sub
 * el; peste o culoare plată n-are ce media, deci ar fi ieșit o fâșie palidă cu
 * numele unui efect pe care nu-l produce. E o suprafață albă simplă, cu contur.
 *
 * ─── DE CE FONDUL E avo-50, NU GRI ────────────────────────────────────────
 *
 * Cardurile de categorie au fotografii, deci primesc culoare din ele. Astea
 * n-au nimic; pe alb ar fi patru dreptunghiuri goale. Tenta de brand dă zonei o
 * identitate fără să adauge un accent nou — e aceeași scară avo, treapta cea
 * mai deschisă.
 *
 * ─── DE CE NU EXISTĂ PREȚ TĂIAT ───────────────────────────────────────────
 *
 * Catalogul nu conține un preț anterior; „ofertele lunii" înseamnă că
 * furnizorul le-a pus pe copertă, nu că prețul a scăzut față de luna trecută.
 * Un preț tăiat ar fi o cifră inventată și s-ar vedea la prima comparație cu
 * PDF-ul. Ce e real și chiar contează pentru un cumpărător B2B e pragul de
 * volum — aceea e a doua cifră de pe card.
 *
 * ─── CULOAREA STĂRII ──────────────────────────────────────────────────────
 *
 * „Lichidare stoc" primește badge închis, nu portocaliu sau roșu. Urgența vine
 * din greutate și contrast, nu dintr-un al patrulea accent pe o pagină care are
 * deja trei în competiție. Produsele fără nimic special n-au badge deloc: un
 * badge „Ofertă" pe fiecare card ar repeta titlul secțiunii de patru ori.
 *
 * Contraste verificate (prag AA text normal 4,5:1):
 *   gray-900 #101828 pe avo-50 #F0F6FF ..... 16,33 ✓  cifra mare, brandul
 *   gray-600 #4A5565 pe avo-50 .............. 6,96 ✓  unitatea, SKU-ul
 *   gray-500 #6A7282 pe avo-50 .............. 4,46 ✗  SUB PRAG — nefolosit aici
 *   gray-500 pe alb ......................... 4,84 ✓  doar în corpul cardului
 *   alb pe gray-900 ........................ 17,75 ✓  badge-ul de lichidare
 *
 * gray-500 e cea mai deschisă treaptă admisă pe alb, dar NU pe tenta albastră:
 * pe avo-50 cade la 4,46. De-aia etichetele din zona colorată sunt gray-600,
 * iar cele din corpul alb rămân gray-500, ca în „Gama de produse".
 * ══════════════════════════════════════════════════════════════════════════
 */


export default async function OferteleLunii({
  oferte,
}: {
  /** Doar pentru situația în care lista vine din altă parte. Implicit, WooCommerce. */
  oferte?: Oferta[];
}) {
  // Cele două cereri pleacă odată, nu una după alta: n-au nicio dependență
  // între ele, iar înlănțuite ar aduna două drumuri până la WordPress în
  // timpul de randare al paginii.
  const [perioada, lista] = await Promise.all([
    incarcaPerioadaCatalog(),
    oferte ? Promise.resolve(oferte) : incarcaCeleMaiBuneOferte(),
  ]);

  // Fără oferte nu există secțiune. O grilă goală sub un titlu ar anunța ceva
  // ce nu livrează; în luna în care furnizorul nu pune nimic pe copertă,
  // secțiunea pur și simplu nu apare.
  if (lista.length === 0) return null;

  const titlu = `Ofertele lunii${perioada.eticheta ? ` ${perioada.eticheta}` : ""}`;

  /**
   * RITMUL DINTRE SECȚIUNI, la `lg`: 128px deasupra, 160px dedesubt.
   *
   * A fost 224px de fiecare parte — 112px de padding de la secțiunea vecină
   * plus 112px de aici — adică gol turnat peste o tăietură pe care culoarea o
   * face deja singură (#F8F9FA → alb, alb → slate-900).
   *
   * Referința pentru „prea mult" o dă secțiunea însăși: cel mai mare interval
   * DINĂUNTRUL ei e 48px, de la linia de sub titlu la grilă, iar între carduri
   * sunt 20px. Aerul dintre secțiuni era de 4,7 ori cel mai mare interval
   * intern; acum e de 2,7. Sub 2 ar începe să se atingă.
   *
   * DE CE 48px SUS ȘI 80px JOS, nu 64 și 64. Nu e preferință, e o constrângere:
   *
   *   DEASUPRA ... GamaProduse dă 80px, cât o lasă bara de filtre. Padding-ul
   *                ei de jos e ce mărginește panoul din stânga (`bottom-10` în
   *                BaraFiltre, măsurat de la marginea secțiunii); scăzut mai
   *                mult, panoul ajunge lipit de ultimul rând de conținut, adică
   *                exact eșecul descris în capul acelui fișier. Restul până la
   *                128 se pune aici: 48px.
   *   DEDESUBT ... 80 + 80. Tăietura de acolo nu mai e între două nuanțe
   *                deschise, ci spre slate-900; un salt de contrast atât de
   *                mare suportă, și cere, mai mult aer.
   *
   * PADDING-UL DE SUS AL LUI GAMAPRODUSE NU SE ATINGE, oricât ar tenta. Cei
   * 112px sunt scriși ca literal în `--bara-sus` din app/globals.css
   * (112 + 44 + 28 = 184px) și sunt ce ține bara ancorată pe linia de sub
   * titlu. Schimbat acolo fără variabilă, bara pornește din gol.
   *
   * SUB `lg` joncțiunea de deasupra rămâne 128px, din padding-uri simetrice de
   * 64; cea de dedesubt e 128px, respectiv 144px la `sm`. Nicăieri nu iese mai
   * strâmt decât la `lg`, deci nu e nevoie de praguri suplimentare.
   */
  return (
    <section className="bg-white py-16 lg:pt-12 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* ── Masthead ───────────────────────────────────────── */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 xl:gap-6">
            <div
              className="@container min-w-0 flex-1"
              /* CORPUL VINE DIN ETALONUL COMUN, nu din lungimea acestui titlu.
                 Vezi `dimensiuneTitluSectiune` în components/stiluri.ts.

                 ─── REȚETA DE DINAINTE, DACĂ TREBUIE ÎNTOARSĂ ───────────────
                 Era `dimensiuneTitlu(titlu)`, adică exact aceeași funcție, dar
                 hrănită cu titlul propriu. Fiindcă „Ofertele lunii Septembrie
                 2026" are doar 30 de caractere, socoteala ieșea peste plafon și
                 se oprea acolo: 42px, cutia h2 de 52px — măsurat pe pagina
                 randată la 1440px. Titlul de la „Gama de produse", cu 47 de
                 caractere, cobora la ~33px, cutie de 41px.

                 Ca să revii, un singur cuvânt:
                     dimensiuneTitluSectiune()  →  dimensiuneTitlu(titlu)
                 Clasele de pe `<h2>` n-au fost atinse și nu trebuie atinse:
                 fontul, grosimea (800) și culoarea au fost mereu identice cu
                 ale celuilalt titlu. Singura diferență a fost treapta de corp. */
              style={{ "--dim-titlu": dimensiuneTitluSectiune() } as CSSProperties}
            >
              <h2 className="text-[26px] sm:text-[length:var(--dim-titlu)] sm:whitespace-nowrap font-extrabold text-gray-900 leading-tight">
                {titlu}
              </h2>
            </div>

            {/* Aceeași ștampilă ca la „Gama de produse", cu altă etichetă:
                acolo răspunde la „de când sunt prețurile", aici la „cât mai țin
                ofertele". E aceeași valoare, citită o singură dată —
                incarcaPerioadaCatalog e memoizat cu cache din React. */}
            {perioada.interval ? (
              <div className="inline-flex items-center gap-3 shrink-0 self-start xl:self-auto h-10 sm:h-11 px-4 rounded-lg bg-white border border-gray-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Valabile
                </span>
                <span aria-hidden className="h-4 w-px bg-gray-200" />
                <span className="text-xs sm:text-[13px] font-semibold text-gray-900 whitespace-nowrap">
                  {perioada.interval}
                </span>
              </div>
            ) : null}
          </div>

          <p className="mt-4 max-w-2xl text-[14px] text-gray-500 leading-relaxed">
            Produsele cu cea mai mare economie la pragul de volum, din ediția
            curentă a catalogului. Selecția se reface la fiecare import.
          </p>

          <div aria-hidden className="mt-5 sm:mt-7 h-px w-full bg-gray-200" />
        </div>

        {/* ── Banda de oferte ────────────────────────────────────
            A FOST O GRILĂ DE PATRU. Grila era corectă cât timp secțiunea arăta
            exact patru produse — cele de pe coperta catalogului. Selecția e
            acum calculată din tot catalogul (vezi lib/oferte.ts), deci numărul
            variază de la o ediție la alta: pe catalogul curent sunt 15. O grilă
            de patru coloane cu 15 carduri ar fi însemnat patru rânduri, adică
            o secțiune de aproape trei ecrane pentru ceva ce e, ca rol, un
            rezumat.

            Lățimea cardului e 280px, adică exact cât avea în grila de patru
            coloane la `xl` — (1184 − 60) / 4. Banda nu introduce o a doua
            dimensiune de card; o poartă pe aceeași. */}
        <BandaOferte>
          {lista.map((o) => (
            <div key={o.sku} className="w-[280px] shrink-0 snap-start pr-5">
              <CardOferta o={o} />
            </div>
          ))}
        </BandaOferte>

        {/* ── Subsol ─────────────────────────────────────────── */}
        <p className="mt-8 sm:mt-10 max-w-2xl text-xs text-gray-500 leading-relaxed">
          Prețuri în EUR, fără TVA, valabile pentru perioada catalogului curent.
          Pragul de volum se aplică pe cantitatea comandată per produs.
          Disponibilitatea se confirmă la plasarea comenzii.
        </p>
      </div>
    </section>
  );
}
