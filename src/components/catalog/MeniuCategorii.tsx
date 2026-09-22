import Image from "next/image";
import Link from "next/link";
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
    <nav aria-label="Categorii principale" className="relative z-40 hidden bg-avo-900 lg:block">
      <ul className="mx-auto grid max-w-7xl auto-cols-fr grid-flow-col gap-2 px-12 py-3">
        {categorii.map((c, i) => {
          const promovat = produsPromovat(c.slug, produse);
          const sigla = promovat?.p.brand ? gasesteBrand(promovat.p.brand) : undefined;
          const branduri = c.subcategorii.length === 0 ? branduriDin(c.slug, produse) : [];

          return (
            <li key={c.slug} className="group relative">
              <Link
                href={`/catalog/${c.slug}`}
                className="flex h-14 items-center justify-center rounded-lg bg-avo-800 px-2 text-center text-[12px] leading-tight font-semibold text-white transition-colors group-hover:bg-avo-600 group-focus-within:bg-avo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white xl:text-[13px]"
              >
                {c.nume}
              </Link>

              <div
                className={`invisible absolute top-full z-50 pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${
                  i >= categorii.length / 2 ? "right-0" : "left-0"
                }`}
              >
                {/* RAMA: 5px avo-600 (a fost 3px, îngroșată la cerere — la 3px
                    se citea încă drept contur, nu drept ramă), nu conturul de
                    1px gray-200 al
                    suprafețelor (`SUPRAFATA`). Cu acela, fereastra albă peste
                    pagina tot albă se citea ca o bucată de pagină desprinsă, nu
                    ca un meniu deschis.

                    Culoarea e aceeași cu a butonului aprins de deasupra
                    (`group-hover:bg-avo-600`), deci butonul și fereastra se
                    citesc ca un singur obiect: ce ai atins și ce s-a deschis.
                    Contrast 8,61 pe alb, peste pragul de 3:1 pentru elemente
                    negrafice; față de banda avo-900 se desparte prin luminozitate.

                    Fără umbră mare: conturul face delimitarea, regula site-ului.
                    `overflow-hidden` taie fondul coloanei din dreapta pe raza
                    interioară (12 − 5 = 7px), deci rama rămâne întreagă în
                    colțuri. `w-[560px]` include rama (border-box), deci
                    fereastra nu s-a lățit; conținutul a cedat 4px. */}
                <div className="flex w-[560px] overflow-hidden rounded-xl border-[5px] border-avo-600 bg-white">

                  {/* ── Stânga: categoria și subcategoriile ── */}
                  <div className="w-[248px] shrink-0 p-2">
                    <Link
                      href={`/catalog/${c.slug}`}
                      className="flex items-baseline justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-avo-50 focus-visible:outline-2 focus-visible:outline-avo-600"
                    >
                      <span className="text-[13px] font-bold text-gray-900">Toate produsele</span>
                      <span className="shrink-0 rounded-md bg-gray-100 px-1.5 text-[12px] font-bold text-gray-600">
                        {c.produse}
                      </span>
                    </Link>

                    {c.subcategorii.length > 0 ? (
                      <>
                        <div aria-hidden className="mx-2.5 my-1 h-px bg-gray-200" />
                        <ul>
                          {c.subcategorii.map((s) => (
                            <li key={s.slug}>
                              <Link
                                href={`/catalog/${c.slug}/${s.slug}`}
                                className="group/rand flex items-baseline justify-between gap-3 rounded-md px-2.5 py-1.5 transition-colors hover:bg-avo-50 focus-visible:outline-2 focus-visible:outline-avo-600"
                              >
                                <span className="text-[13px] text-gray-700 transition-colors group-hover/rand:text-avo-700">
                                  {s.nume}
                                </span>
                                <span className="shrink-0 text-[12px] text-gray-500 transition-colors group-hover/rand:text-avo-700">
                                  {s.produse}
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

                         SUNT LINKURI SPRE FILTRUL PE BRAND: pagina categoriei cu
                         `?brand=<slug>`, care arată doar produsele acelui brand
                         (vezi app/catalog/[...categorie]/page.tsx). Au fost rânduri
                         simple cât timp filtrul nu exista — un link spre categoria
                         întreagă ar fi promis o filtrare pe care n-o făcea.

                         HOVER-UL e rețeta subcategoriilor din meniul din stânga al
                         paginii (app/catalog/page.tsx): o bară avo-600 de 2px pe
                         marginea rândului, iar numele și cifra trec pe bold avo-600.
                         Lățimea bold e rezervată dinainte cu `after:` +
                         `data-nume`, ca rândul să nu se lățească și să împingă
                         cifra când textul se îngroașă.

                         Un brand pe care lib/branduri.ts nu-l cunoaște n-are slug,
                         deci n-are filtru: rămâne rând simplu, fără link. */
                      <>
                        <div aria-hidden className="mx-2.5 my-1 h-px bg-gray-200" />
                        <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Branduri
                        </p>
                        <ul>
                          {branduri.map((b) => (
                            <li key={b.nume}>
                              {b.slug ? (
                                <Link
                                  href={`/catalog/${c.slug}?brand=${b.slug}`}
                                  className="group/brand relative flex items-baseline justify-between gap-3 rounded-md px-2.5 py-1.5 transition-colors before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-transparent before:transition-colors hover:before:bg-avo-600 focus-visible:outline-2 focus-visible:outline-avo-600"
                                >
                                  <span
                                    data-nume={b.nume}
                                    className="grid text-[13px] text-gray-700 transition-colors after:invisible after:h-0 after:overflow-hidden after:font-bold after:content-[attr(data-nume)] group-hover/brand:font-bold group-hover/brand:text-avo-600"
                                  >
                                    {b.nume}
                                  </span>
                                  <span className="shrink-0 text-[12px] text-gray-500 transition-colors group-hover/brand:font-bold group-hover/brand:text-avo-600">
                                    {b.produse}
                                  </span>
                                </Link>
                              ) : (
                                <span className="flex items-baseline justify-between gap-3 px-2.5 py-1.5">
                                  <span className="text-[13px] text-gray-700">{b.nume}</span>
                                  <span className="shrink-0 text-[12px] text-gray-500">{b.produse}</span>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>

                  {/* ── Dreapta: un produs real din categorie ── */}
                  {promovat ? (
                    <div className="flex min-w-0 flex-1 flex-col border-l border-gray-200 bg-[#EEF3F9] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                        {promovat.motiv}
                      </p>

                      {/* ÎNĂLȚIME FIXĂ, 144px, nu `aspect-[4/3]`. Cu proporția,
                          poza avea ~204px în jumătatea de 272px, iar fereastra
                          întreagă trecea de 420px: pe un ecran de 900px butonul
                          „Vezi detalii" ieșea sub marginea de jos — măsurat la
                          Invertoare și Panouri. `object-contain` micșorează poza
                          fără s-o taie. */}
                      <div className="relative mt-2 h-36 w-full">
                        {promovat.p.imagine ? (
                          <Image
                            src={promovat.p.imagine.url}
                            alt={promovat.p.imagine.alt ?? promovat.p.nume}
                            fill
                            sizes="280px"
                            className="object-contain mix-blend-multiply"
                          />
                        ) : null}
                        <div className="absolute top-0 left-0 flex gap-1.5">
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
                          src={`/branduri/color/${sigla.slug}.png`}
                          alt={sigla.nume}
                          height={16}
                          className="mt-3 h-4 w-auto self-start"
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
                        <p className="mt-1 text-[12px] text-gray-600">
                          {eur(promovat.p.pretVolum)} € de la {promovat.p.prag}
                        </p>
                      ) : null}

                      <Link
                        href={`/catalog/produs/${promovat.p.slug}`}
                        className={`${BUTON_PLIN} mt-3 w-full`}
                      >
                        Vezi detalii
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
