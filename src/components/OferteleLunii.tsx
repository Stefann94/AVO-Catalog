import Link from "next/link";
import { incarcaPerioadaCatalog } from "@/lib/perioada";
import { incarcaOferte, type Oferta } from "@/lib/oferte";
import { BUTON_PLIN, CARD } from "./stiluri";

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

const eur = (n: number) => n.toLocaleString("ro-RO");

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
    oferte ? Promise.resolve(oferte) : incarcaOferte(),
  ]);

  // Fără oferte nu există secțiune. O grilă goală sub un titlu ar anunța ceva
  // ce nu livrează; în luna în care furnizorul nu pune nimic pe copertă,
  // secțiunea pur și simplu nu apare.
  if (lista.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* ── Masthead ───────────────────────────────────────── */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 xl:gap-6">
            <h2 className="text-[26px] sm:text-[34px] md:text-[40px] lg:text-[42px] font-extrabold text-gray-900 leading-tight sm:whitespace-nowrap">
              Ofertele lunii{perioada.eticheta ? ` ${perioada.eticheta}` : ""}
            </h2>

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
            Produsele de pe coperta catalogului, cu prețul lunii curente. Se
            schimbă la fiecare ediție.
          </p>

          <div aria-hidden className="mt-5 sm:mt-7 h-px w-full bg-gray-200" />
        </div>

        {/* ── Oferte ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {lista.map((o) => (
            <article
              key={o.sku}
              className={`${CARD} group relative flex flex-col overflow-hidden`}
            >
              {/* Zona vizuală — aceeași proporție ca fotografia cardului de
                  categorie, ca cele două grile să aibă același ritm. */}
              <div className="relative aspect-[4/3] bg-avo-50">
                {/* Badge în exact poziția badge-ului „N produse". */}
                {o.disponibilitate === "Lichidare stoc" ? (
                  <span className="absolute top-3 right-3 z-10 inline-flex items-center h-7 px-2.5 rounded-md bg-gray-900 text-[11px] font-bold uppercase tracking-wide text-white">
                    Lichidare stoc
                  </span>
                ) : null}

                {/* Cifra care ține locul pozei. Baseline comun și leading-none:
                    unitatea stă lipită de cifră, ca într-o fișă tehnică, nu ca
                    două cuvinte alăturate. */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-10">
                  {o.spec ? (
                    <span className="flex items-baseline gap-1 text-gray-900">
                      <span className="text-[44px] sm:text-[52px] font-extrabold leading-none">
                        {o.spec.valoare}
                      </span>
                      <span className="text-[18px] font-bold text-gray-600">
                        {o.spec.unitate}
                      </span>
                    </span>
                  ) : (
                    /* Fără cifră, locul ei îl ia CODUL DE MODEL, pe mono.
                     *
                     * Verificat pe catalogul real: jumătate din produse n-au o
                     * cifră de titlu în date, iar dintre cele patru oferte ale
                     * lunii, două (SE-F16, HOPE 16.0LM-A1) n-o au — deși sunt,
                     * amândouă, acumulatori de 16 kWh. Cazul nu e marginal,
                     * deci varianta de rezervă trebuie să fie la fel de bună,
                     * nu o umplutură.
                     *
                     * Brandul ar fi fost alegerea greșită: apare deja pe banda
                     * de dedesubt, deci cardul l-ar fi spus de două ori, iar
                     * „Growatt" scris mare nu deosebește două produse Growatt.
                     * Codul de model chiar identifică — e ce se dictează la
                     * telefon și ce se caută în catalog.
                     *
                     * Gramatica rămâne una singură: lucrul care identifică
                     * produsul, scris mare. Se schimbă doar care e acela. */
                    <span className="text-center font-mono text-[26px] sm:text-[30px] font-semibold text-gray-900 leading-tight break-all">
                      {o.sku}
                    </span>
                  )}
                </div>

                {/* Banda de jos — poziția titlului din cardul de categorie.
                    Brandul identifică, SKU-ul e ce se dictează la telefon; de
                    aceea SKU-ul e pe mono, singurul loc din secțiune unde
                    cifrele de lățime egală chiar contează. */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-white bg-white/70 px-3 py-2">
                  <span className="truncate text-[13px] font-bold text-gray-900">
                    {o.brand}
                  </span>
                  {/* SKU-ul apare aici DOAR când sus stă o cifră. Când e el
                      însuși cifra de titlu, l-am scrie de două ori în același
                      pătrat, la 30px și la 11px distanță de câțiva pixeli. */}
                  {o.spec ? (
                    <span className="shrink-0 font-mono text-[11px] text-gray-600">
                      {o.sku}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* ── Corpul cardului ── */}
              <div className="flex flex-1 flex-col p-4">
                {/* Înălțime fixă pe două rânduri: denumirile din catalog au
                    lungimi foarte diferite, iar fără ea blocul de preț ar sta la
                    înălțimi diferite de la card la card. */}
                <h3 className="h-10 text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2">
                  {o.nume}
                </h3>

                <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                  <div className="flex shrink-0 flex-col justify-end">
                    <span className="flex items-baseline gap-1">
                      <span className="text-[22px] font-extrabold text-gray-900 leading-none">
                        {eur(o.pret)}
                      </span>
                      <span className="text-[16px] font-bold text-gray-900">€</span>
                      <span className="text-[12px] font-medium text-gray-500 whitespace-nowrap">
                        / {o.unitate}
                      </span>
                    </span>

                    {/* Pragul de volum e singura a doua cifră reală din catalog
                        și e exact ce deosebește un preț de distribuitor de unul
                        de magazin. Lipsește la produsele fără coloana a doua. */}
                    {o.pretVolum && o.prag ? (
                      <span className="mt-1 text-[12px] font-medium text-gray-500 whitespace-nowrap">
                        {eur(o.pretVolum)} € de la {o.prag}
                      </span>
                    ) : null}
                  </div>

                  {/* Ținta e categoria, nu produsul: /catalog/produs/<slug> nu
                      există încă. Când apare fișa de produs, se schimbă doar
                      calea. */}
                  <Link
                    href={`/catalog/${o.categorie}`}
                    className={`${BUTON_PLIN} after:absolute after:inset-0`}
                  >
                    Vezi
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

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
