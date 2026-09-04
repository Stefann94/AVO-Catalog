import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BUTON_PLIN, SUPRAFATA } from "@/components/stiluri";
import { incarcaProdus, sluguriProduse, type Statut } from "@/lib/produs";
import { incarcaPerioadaCatalog } from "@/lib/perioada";

/**
 * Fișa de produs.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CE ÎNLOCUIEȘTE FOTOGRAFIA
 * ──────────────────────────────────────────────────────────────────────────
 * Catalogul nu are imagini de produs — coloana `Images` nici nu există în
 * CSV-ul de import. O fișă de produs construită pe modelul obișnuit, cu poza
 * mare în stânga și datele în dreapta, ar avea jumătate de ecran gol.
 *
 * Așa că structura e alta, și e cea corectă pentru un catalog tehnic: în locul
 * fotografiei stă CIFRA care definește produsul — 460 Wp, 16 kWh, 12 kW — pe
 * aceeași tentă `avo-50` ca zona vizuală a cardurilor de ofertă. Când produsul
 * n-are o astfel de cifră (jumătate din catalog: cleme, șuruburi, cabluri),
 * locul îl ia codul de model, pe mono. Aceeași gramatică ca pe carduri: lucrul
 * care identifică produsul, scris mare.
 *
 * TABELUL DE SPECIFICAȚII e conținutul principal al paginii, nu un supliment.
 * Într-un catalog fără poze și fără descrieri, atributele SUNT fișa.
 *
 * ─── LIMBAJUL VIZUAL ──────────────────────────────────────────────────────
 *
 * Nimic inventat aici. Totul vine din ce s-a stabilit deja:
 *
 *   suprafețe .... SUPRAFATA din components/stiluri.ts — 12px, contur gray-200
 *   butoane ...... BUTON_PLIN, aceeași rețetă ca peste tot
 *   fundal ....... #F8F9FA, ca la „Categoriile principale"
 *   rampa ........ gray, accentul avo-600
 *   SKU .......... mono, singurul loc unde cifrele de lățime egală contează
 *
 * Panourile folosesc SUPRAFATA, nu CARD: nu duc nicăieri, iar un contur care
 * se colorează la hover pe ceva ce nu e apăsabil e o promisiune falsă.
 *
 * ─── COLOANA DE PREȚ E LIPICIOASĂ ─────────────────────────────────────────
 *
 * `sticky` de la lg în sus. La un produs cu multe atribute, tabelul poate
 * depăși ecranul, iar prețul și butonul ar rămâne sus, în afara câmpului
 * vizual, exact când omul termină de citit datele și vrea să acționeze.
 * `top-28` ocolește navbar-ul fix.
 * ══════════════════════════════════════════════════════════════════════════
 */

export const revalidate = 3600;

export async function generateStaticParams() {
  const sluguri = await sluguriProduse();
  return sluguri.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await incarcaProdus(slug);
  if (!p) return { title: "Produs negăsit — Avo Grup Invest" };

  // Descrierea se compune din ce există: catalogul n-are texte de produs, deci
  // o propoziție inventată ar fi singura variantă — și ar fi aceeași pe 172 de
  // pagini, ceea ce Google tratează ca duplicat.
  const bucati = [
    p.brand,
    p.cifra ? `${p.cifra.valoare} ${p.cifra.unitate}` : null,
    p.sku ? `cod ${p.sku}` : null,
    p.pret ? `${p.pret.toLocaleString("ro-RO")} € fără TVA` : null,
  ].filter(Boolean);

  return {
    title: `${p.nume} — Avo Grup Invest`,
    description: bucati.length ? bucati.join(" · ") : p.nume,
  };
}

const eur = (n: number) => n.toLocaleString("ro-RO");

/**
 * Culorile badge-urilor.
 *
 * Stau aici, nu în baza de date. WooCommerce spune CE e adevărat — „ofertă
 * specială"; cum arată decide codul. Altfel cineva alege în administrare un
 * portocaliu care cade sub pragul de contrast și nimeni nu află.
 *
 * Contraste verificate (prag AA pentru text mic, 4,5:1):
 *   avo-700 #003B7D pe avo-50 #F0F6FF ... 10,03 ✓
 *   alb pe gray-900 #101828 ............. 17,75 ✓
 *   gray-700 #364153 pe gray-100 ........ 10,31 ✓
 */
const TON: Record<Statut["ton"], string> = {
  oferta: "bg-avo-50 text-avo-700 ring-1 ring-inset ring-avo-200",
  urgent: "bg-gray-900 text-white",
  neutru: "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200",
};

function Badge({ statut }: { statut: Statut }) {
  return (
    <span
      className={`inline-flex items-center h-7 px-2.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${TON[statut.ton]}`}
    >
      {statut.eticheta}
    </span>
  );
}

export default async function PaginaProdus({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Cele două pleacă odată: perioada nu depinde de produs, iar înlănțuite ar
  // aduna două drumuri până la WordPress în randarea paginii.
  const [p, perioada] = await Promise.all([incarcaProdus(slug), incarcaPerioadaCatalog()]);
  if (!p) notFound();

  const caleCategorie = p.categorie ? `/catalog/${p.categorie.slug}` : "/catalog";

  return (
    <div className="bg-[#F8F9FA] pt-28 sm:pt-32 pb-16 sm:pb-24">
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
                <li aria-hidden className="text-gray-300">
                  /
                </li>
                <li>
                  <Link
                    href={caleCategorie}
                    className="font-medium transition-colors hover:text-avo-700"
                  >
                    {p.categorie.nume}
                  </Link>
                </li>
              </>
            ) : null}
            {p.subcategorie ? (
              <>
                <li aria-hidden className="text-gray-300">
                  /
                </li>
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

        {/* ── Antetul, pe toată lățimea ──────────────────────────
            Titlul nu stă în coloana din stânga, ci deasupra amândurora.
            Denumirile din catalog sunt lungi — „FELICITY FLB48314TG1-H —
            16 kWh, cu încălzire, IP65" are 51 de caractere — iar strânse pe
            două treimi de lățime ar cădea pe trei rânduri lângă un panou care
            stă gol.

            Codul de produs urcă la dreapta, pe același rând. E prima informație
            pe care o caută cineva care sună să comande, iar acolo se găsește
            fără să derulezi. */}
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="min-w-0">
            {p.statuturi.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {p.statuturi.map((s) => (
                  <Badge key={s.eticheta} statut={s} />
                ))}
              </div>
            ) : null}

            <h1 className="text-[24px] sm:text-[30px] lg:text-[34px] font-extrabold text-gray-900 leading-tight text-balance">
              {p.nume}
            </h1>
          </div>

          {p.sku ? (
            <p className="flex shrink-0 items-center gap-2 text-[13px] text-gray-500 lg:pt-1">
              <span className="font-medium">Cod produs</span>
              <span aria-hidden className="h-3 w-px bg-gray-200" />
              {/* Mono: codul se dictează la telefon și se caută în catalog,
                  deci cifrele de lățime egală chiar contează. */}
              <span className="font-mono font-semibold text-gray-900">{p.sku}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Coloana de conținut ──────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Identitatea vizuală a produsului */}
            <div className={`${SUPRAFATA} overflow-hidden`}>
              {/* Zona vizuală — aceeași tentă ca pe cardurile de ofertă, ca
                  drumul de la card la fișă să se vadă ca o continuare. */}
              <div className="relative flex flex-col items-center justify-center bg-avo-50 px-6 py-14 sm:py-20">
                {p.cifra ? (
                  <span className="flex items-baseline gap-1.5 text-gray-900">
                    <span className="text-[64px] sm:text-[80px] font-extrabold leading-none">
                      {p.cifra.valoare}
                    </span>
                    <span className="text-[24px] sm:text-[28px] font-bold text-gray-600">
                      {p.cifra.unitate}
                    </span>
                  </span>
                ) : p.ancora ? (
                  <span
                    className={`text-center text-gray-900 leading-tight ${
                      p.ancora.mono
                        ? "font-mono text-[28px] sm:text-[36px] font-semibold break-all"
                        : "text-[30px] sm:text-[40px] font-extrabold text-balance"
                    }`}
                  >
                    {p.ancora.text}
                  </span>
                ) : null}
                {/* Brandul nu se repetă dacă e chiar el ancora de deasupra. */}
                {p.brand && p.ancora?.text !== p.brand ? (
                  <span className="mt-4 text-[13px] font-bold uppercase tracking-wider text-gray-600">
                    {p.brand}
                  </span>
                ) : null}
              </div>

              {/* Descrierea apare doar dacă există. Pe tot catalogul de acum e
                  goală — PDF-ul e o listă de prețuri, nu fișe tehnice — iar un
                  panou alb gol sub imagine ar arăta ca o eroare. */}
              {p.descriere ? (
                <div className="border-t border-gray-200 p-5 sm:p-6">
                  <p className="max-w-2xl text-[15px] text-gray-600 leading-relaxed">
                    {p.descriere}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Specificații — conținutul principal, nu un supliment */}
            {p.specificatii.length > 0 ? (
              <section className={`${SUPRAFATA} p-5 sm:p-6`}>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
                  Specificații tehnice
                </h2>
                {/* `dl` în grilă, nu `table`: sunt perechi etichetă–valoare, nu
                    un tabel cu mai multe coloane. Pe telefon cad una sub alta. */}
                <dl className="mt-4 divide-y divide-gray-100">
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

          {/* ── Coloana de preț ──────────────────────────────── */}
          <aside className="lg:col-span-1">
            <div className={`${SUPRAFATA} p-5 sm:p-6 lg:sticky lg:top-28`}>
              {p.pret ? (
                <>
                  <span className="text-[12px] font-medium text-gray-500">Preț de catalog</span>
                  <p className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[34px] font-extrabold text-gray-900 leading-none">
                      {eur(p.pret)}
                    </span>
                    <span className="text-[20px] font-bold text-gray-900">€</span>
                    <span className="text-[13px] font-medium text-gray-500">/ {p.unitate}</span>
                  </p>

                  {/* Pragul de volum e a doua cifră reală din catalog și e fix
                      ce deosebește un preț de distribuitor de unul de magazin.
                      Îl are jumătate din catalog — 88 din 172 de produse. */}
                  {p.pretVolum && p.prag ? (
                    <p className="mt-3 flex items-baseline gap-1.5 rounded-lg bg-avo-50 px-3 py-2.5">
                      <span className="text-[18px] font-extrabold text-avo-700 leading-none">
                        {eur(p.pretVolum)} €
                      </span>
                      <span className="text-[12px] font-medium text-gray-600">
                        de la {p.prag}
                      </span>
                    </p>
                  ) : null}

                  {p.pretContainer ? (
                    <p className="mt-2 text-[12px] text-gray-500">
                      Comenzi container: preț {p.pretContainer}.
                    </p>
                  ) : null}

                  {/* VALABILITATEA STĂ LÂNGĂ PREȚ, nu într-o ștampilă de sus.
                      Aici e momentul în care contează: omul se uită la cifră și
                      cântărește dacă să sune. Data răspunde la „până când ține",
                      nu la „din când" — cine e pe pagină azi știe deja că a
                      început, iar un interval întreg l-ar pune să extragă
                      singur partea care îl interesează.

                      „În limita stocului disponibil" nu e o formulă de
                      acoperire: catalogul chiar nu garantează stocul, iar
                      subsolul spune deja că disponibilitatea se confirmă la
                      comandă. Aici e doar mai aproape de decizie. */}
                  {perioada.pana ? (
                    <p className="mt-3 text-[12px] text-gray-500 leading-relaxed">
                      Preț valabil până la {perioada.pana}, în limita stocului
                      disponibil.
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="text-[12px] font-medium text-gray-500">Preț</span>
                  <p className="mt-1 text-[24px] font-extrabold text-gray-900 leading-tight">
                    La cerere
                  </p>
                </>
              )}

              {p.disponibilitate ? (
                <p className="mt-4 flex items-center gap-2 text-[13px]">
                  <span className="font-medium text-gray-500">Disponibilitate</span>
                  <span aria-hidden className="h-3 w-px bg-gray-200" />
                  <span className="font-semibold text-gray-900">{p.disponibilitate}</span>
                </p>
              ) : null}

              <div aria-hidden className="my-5 h-px w-full bg-gray-200" />

              <Link href="/cerere-oferta" className={`${BUTON_PLIN} w-full`}>
                Cere ofertă
              </Link>

              <Link
                href={caleCategorie}
                className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-[14px] font-semibold text-gray-800 transition-colors duration-200 hover:border-avo-600 hover:text-avo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
              >
                Vezi toată categoria
              </Link>

              <p className="mt-5 text-xs text-gray-500 leading-relaxed">
                Preț în EUR, fără TVA. Taxa verde DEEE nu este inclusă (0,7 RON / kg).
                Disponibilitatea se confirmă la plasarea comenzii.
                {p.sursaCatalog ? ` Sursa prețului: ${p.sursaCatalog}.` : ""}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
