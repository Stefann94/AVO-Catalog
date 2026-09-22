import Image from "next/image";
import Link from "next/link";
import type { Oferta } from "@/lib/oferte";
import { gasesteBrand } from "@/lib/branduri";
import { BADGE, BADGE_CARD, BADGE_OFERTA } from "@/components/stiluri";

/**
 * Bannerul din capul paginii /catalog — ofertele lunii, ca reclamă.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CE A FOST ÎNAINTE
 * ──────────────────────────────────────────────────────────────────────────
 * Cinci plăci albe egale, alăturate — Canadian Solar, Deye, Felicity, Growatt,
 * Eastron —, lângă un titlu, un rând de condiții și siglele cu „+ încă 12
 * branduri". Totul real, dar se citea ca o listă, nu ca o reclamă: cinci
 * lucruri de aceeași mărime nu spun care contează. Rândul de condiții și
 * „+ încă 12" au căzut la cerere, iar plăcile au făcut loc unei compoziții.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CUM E ÎMPĂRȚIT
 * ──────────────────────────────────────────────────────────────────────────
 *   STÂNGA ~40%, fond închis, liniștit: eticheta lunii, titlul, un buton și
 *   siglele brandurilor din oferte. Nimic altceva, ca scrisul să se distingă.
 *
 *   DREAPTA ~60%, fond #EEF3F9, tăiat în diagonală: compoziția.
 *
 *   A trecut prin două variante. Întâi avo-50: fotografiile din WordPress sunt
 *   decupate pe ALB, iar poza produsului mare a apărut ca un pătrat alb lipit
 *   pe fond. Apoi alb pur: pătratul a dispărut, dar produsele albe — SE-F16,
 *   HOPE, Felicity, adică trei din cele patru oferte — nu se mai delimitau de
 *   fond.
 *
 *   Acum fondul e un gri-albăstrui foarte deschis, iar poza mare e
 *   `mix-blend-multiply`: albul ei se înmulțește cu fondul și ia culoarea lui,
 *   deci pătratul nu apare, iar produsul alb se vede ca obiect deschis pe un
 *   fond mai închis. Cardurile mici rămân albe, cu contur, și nu au nevoie de
 *   amestec. Pe o culoare mai puternică nu merge: ar fi nevoie de poze cu fundal
 *   transparent.
 *
 * Ierarhia din dreapta e fixă, ca aglomerația să nu se mute din stânga aici:
 *
 *   1 produs mare ....... oferta cu prețul cel mai mare — cea cu cea mai multă
 *                         greutate vizuală; în septembrie Deye SE-F16 C
 *   restul, mici ........ celelalte oferte, pe o coloană
 *   max. 2 pastile ...... informații din catalog, nu inventate
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DATELE
 * ──────────────────────────────────────────────────────────────────────────
 * `incarcaOferte()` din lib/oferte.ts — aceleași produse ca secțiunea
 * „Ofertele lunii" de pe prima pagină, adică pagina „OFERTELE LUNII" a
 * catalogului (`featured` în WooCommerce). Luna viitoare bannerul se schimbă
 * singur. Nu există listă scrisă aici.
 *
 * Pastilele sunt fraze din catalog: „Ofertele sunt valabile în limita
 * stocului" (pagina 2) și prețul de volum al produsului mare, cu pragul lui.
 * Fără termene de livrare, garanții sau „cel mai bun preț" — catalogul nu le
 * afirmă.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CULORI ȘI CONTRASTE (prag AA 4,5:1)
 * ──────────────────────────────────────────────────────────────────────────
 *   alb pe avo-950 #00153B ............ 17,9 ✓  titlul
 *   avo-300 pe avo-950 ................. 9,7 ✓  eticheta lunii
 *   avo-700 pe alb (butonul) .......... 10,9 ✓
 *   gray-900 pe #EEF3F9 ............... 15,9 ✓  numele și prețul produsului mare
 *   gray-600 pe #EEF3F9 ................ 6,8 ✓  „/ buc"
 *   gray-900 / gray-600 pe alb ... 17,8 / 7,6 ✓  pastilele și cardurile mici
 *   alb pe #DC2626 (OFERTĂ) ............ 4,8 ✓
 *
 * Suprafețe 12px, comenzi 8px, etichete 6px. La hover se schimbă doar
 * culoarea sau conturul, nimic nu se ridică.
 */

/** Adresa unei sigle, după numele brandului scris pe produs. */
function sigla(brand: string, varianta: "alb" | "color"): string | null {
  const b = gasesteBrand(brand);
  if (!b) return null;
  return varianta === "alb" ? `/branduri/${b.slug}.webp` : `/branduri/color/${b.slug}.webp`;
}

const eur = (n: number) => n.toLocaleString("ro-RO");

export default function HeroCatalog({
  eticheta,
  oferte = [],
}: {
  eticheta: string | null;
  oferte?: Oferta[];
}) {
  if (oferte.length === 0) return null;

  // Produsul mare: prețul cel mai mare. Restul, în ordinea din catalog.
  const principal = [...oferte].sort((a, b) => b.pret - a.pret)[0];
  const restul = oferte.filter((o) => o !== principal).slice(0, 3);

  // Brandurile ofertelor, fiecare o dată, în ordinea în care apar.
  const branduri = [...new Set(oferte.map((o) => o.brand).filter(Boolean))];

  const titlu =
    branduri.length > 1 ? `Ofertele lunii de la ${branduri.length} branduri` : "Ofertele lunii";

  return (
    <section className="relative overflow-hidden bg-avo-950">
      {/* ── Fondul deschis din dreapta, tăiat în diagonală ──
          Marginea lui stângă e calculată pe grila containerului, nu în procente
          din ecran: cade la 20px după coloana de text (jumătate din `gap-10`),
          iar diagonala o împinge încă 64px spre dreapta sus. Așa titlul nu
          atinge niciodată zona deschisă, la nicio lățime.
            `xl` ... containerul are 1184px, centrat: coloana de text se termină
                     la 50% − 592px + 470px.
            `lg` ... containerul e fereastra minus 96px de padding: cinci coloane
                     din douăsprezece, cu patru goluri de 40px între ele. */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 hidden bg-[#EEF3F9] [clip-path:polygon(64px_0,100%_0,100%_100%,0_100%)] lg:block lg:left-[calc(48px+(100vw-96px-440px)*5/12+180px)] xl:left-[calc(50%-592px+490px)]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-12 lg:py-10">
        {/* ══ STÂNGA: mesajul ══ */}
        <div className="lg:col-span-5">
          {eticheta ? (
            <p className="text-[12px] font-bold uppercase tracking-wider text-avo-300">
              Catalog {eticheta}
            </p>
          ) : null}

          {/* Cel mult două rânduri: vezi măsurătorile din istoricul fișierului
              — 470px la `xl`, 363px la `lg`, corpul ales pe lățime. */}
          <p className="mt-2 text-[30px] leading-tight font-extrabold text-balance text-white sm:text-[36px] lg:text-[32px] xl:text-[40px]">
            {titlu}
          </p>

          {/* Butonul duce la secțiunea „Ofertele lunii" de pe prima pagină:
              singurul loc unde ofertele stau toate împreună. Alb, nu avo-600:
              pe avo-950 un buton albastru ar avea sub 2:1 față de fond. */}
          <Link
            href="/#ofertele-lunii"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-[14px] font-semibold text-avo-700 transition-colors hover:bg-avo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Vezi ofertele
            <span aria-hidden>→</span>
          </Link>

          {/* Siglele brandurilor din oferte, albe. `<img>`, ca pe banda de sub
              hero-ul primei pagini: lățimi diferite, contează doar înălțimea. */}
          <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            {branduri.map((b) => {
              const src = sigla(b, "alb");
              return (
                <li key={b}>
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={b} height={20} className="h-4 w-auto opacity-80" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-[13px] font-bold text-white/80">{b}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* ══ DREAPTA: compoziția ══
            Sub `lg` nu există fondul diagonal, deci compoziția primește propriul
            panou deschis, cu colțuri de 12px. De la `lg` panoul e transparent și
            stă pe fondul diagonal. */}
        <div className="rounded-xl bg-[#EEF3F9] p-4 sm:p-5 lg:col-span-7 lg:rounded-none lg:bg-transparent lg:p-0 lg:pl-16">
          <div className="grid gap-4 sm:grid-cols-5 sm:gap-5">
            {/* ── Produsul mare ── */}
            <Link
              href={principal.slug ? `/catalog/produs/${principal.slug}` : `/catalog/${principal.categorie}`}
              className="group flex items-center gap-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-avo-600 sm:col-span-3"
            >
              <div className="relative aspect-square w-[45%] shrink-0">
                {principal.imagine ? (
                  <Image
                    src={principal.imagine.url}
                    alt={principal.imagine.alt ?? principal.nume}
                    fill
                    sizes="(max-width: 1024px) 40vw, 220px"
                    /* `mix-blend-multiply`: poza e decupată pe ALB, nu pe
                       transparent. Înmulțit cu fondul, albul devine #EEF3F9 și
                       pătratul dispare; umbrele și marginile produsului rămân,
                       fiindcă sunt mai închise decât fondul. */
                    className="object-contain mix-blend-multiply"
                    /* `priority` e depreciat în Next 16; documentația cere
                       loading="eager" + fetchPriority="high" pentru LCP. */
                    loading="eager"
                    fetchPriority="high"
                  />
                ) : null}
                <span className={`absolute top-0 left-0 ${BADGE} ${BADGE_CARD} ${BADGE_OFERTA}`}>Ofertă</span>
              </div>

              <div className="min-w-0">
                {(() => {
                  const src = sigla(principal.brand, "color");
                  return src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={principal.brand} height={20} className="h-5 w-auto max-w-full" loading="lazy" decoding="async" />
                  ) : null;
                })()}
                <p className="mt-2 text-[15px] leading-snug font-bold text-gray-900 transition-colors group-hover:text-avo-700">
                  {principal.nume}
                </p>
                {/* Pe un singur rând (`whitespace-nowrap`). La 1024 coloana are
                    ~150px și „/ buc" cădea sub „1.580 €", de-aia acolo cifra
                    scade la 26px. */}
                <p className="mt-2 flex items-baseline gap-1 leading-none whitespace-nowrap text-gray-900">
                  <span className="text-[30px] font-extrabold lg:text-[26px] xl:text-[30px]">{eur(principal.pret)}</span>
                  <span className="text-[18px] font-bold">€</span>
                  <span className="text-[12px] font-medium text-gray-600">/ {principal.unitate}</span>
                </p>

                {/* Cel mult două pastile, ambele fraze din catalog. */}
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {principal.pretVolum && principal.prag ? (
                    <li className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600">
                      {eur(principal.pretVolum)} € de la {principal.prag}
                    </li>
                  ) : null}
                  <li className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600">
                    În limita stocului
                  </li>
                </ul>
              </div>
            </Link>

            {/* ── Celelalte oferte ── */}
            <ul className="flex flex-col gap-2.5 sm:col-span-2">
              {restul.map((o) => {
                const src = sigla(o.brand, "color");
                return (
                  <li key={o.sku}>
                    <Link
                      href={o.slug ? `/catalog/produs/${o.slug}` : `/catalog/${o.categorie}`}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2 transition-colors hover:border-avo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
                    >
                      <div className="relative size-14 shrink-0">
                        {o.imagine ? (
                          <Image
                            src={o.imagine.url}
                            alt={o.imagine.alt ?? o.nume}
                            fill
                            sizes="56px"
                            className="object-contain"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={o.brand} height={14} className="h-3.5 w-auto max-w-full" loading="lazy" decoding="async" />
                        ) : (
                          <span className="text-[11px] font-bold text-gray-900">{o.brand}</span>
                        )}
                        <p className="mt-1 truncate font-mono text-[11px] text-gray-600">{o.sku}</p>
                        <p className="mt-0.5 text-[15px] leading-none font-extrabold text-gray-900">
                          {eur(o.pret)} €
                          <span className="ml-1 text-[11px] font-medium text-gray-600">/ {o.unitate}</span>
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
