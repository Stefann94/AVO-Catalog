import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageSearch, X } from "lucide-react";
import { CARD } from "@/components/stiluri";
import { fetchGraphQL } from "@/lib/graphql-client";
import { GET_CATEGORY_PAGE_QUERY } from "@/lib/queries";
import { CATEGORII_CUNOSCUTE, SUBCATEGORII_CUNOSCUTE, gasesteCategorie } from "@/lib/categorii";
import { incarcaToateProdusele } from "@/lib/produs";
import { BRANDURI, gasesteBrand } from "@/lib/branduri";

/**
 * Pagina de categorie, rută catch-all ca să acopere și ierarhia pe două
 * niveluri: /catalog/invertoare/hibride-trifazate.
 *
 * WooCommerce filtrează după ultimul segment, deci acela e slug-ul folosit
 * în query. Numele afișat vine din GraphQL când categoria există deja acolo,
 * altfel din lista canonică — astfel pagina e corectă și înainte de import,
 * în loc să dea 404.
 */

type Produs = {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  price?: string | null;
  stockStatus?: string | null;
  image?: { sourceUrl: string; altText?: string | null } | null;
};

/** „1.475 €", din numărul brut întors de WooCommerce. */
const eur = (p?: string | null) => {
  const n = Number(p);
  return Number.isFinite(n) && n > 0 ? `${n.toLocaleString("ro-RO")} €` : "La cerere";
};

export async function generateStaticParams() {
  return [
    ...CATEGORII_CUNOSCUTE.map((c) => ({ categorie: [c.slug] })),
    // Și cele două niveluri: /catalog/invertoare/hibride-trifazate. Fără ele
    // subcategoriile s-ar randa la cerere, deci prima vizită ar aștepta
    // răspunsul WordPress-ului, care vine în ~4 secunde.
    ...SUBCATEGORII_CUNOSCUTE.map((s) => ({ categorie: [s.parinte, s.slug] })),
  ];
}

/*
 * ─── FILTRUL PE BRAND: `?brand=<slug>` ────────────────────────────────────
 *
 * Există pentru ferestrele rândului de categorii de pe /catalog
 * (components/catalog/MeniuCategorii.tsx): la categoriile fără subcategorii,
 * fereastra listează brandurile, iar fiecare duce aici, filtrat.
 *
 * DE UNDE VIN PRODUSELE FILTRATE. Nu din GET_CATEGORY_PAGE_QUERY: aceea nu
 * cere brandul și se oprește la 48 de produse — la „Sisteme de Montaj", cu 51,
 * filtrul ar fi putut rata tocmai produsele căutate. Vin din harta tuturor
 * produselor (`incarcaToateProdusele`, lib/produs.ts), care are brandul și
 * categoria fiecăruia și e deja construită pentru fișele de produs. Brandul se
 * compară prin `gasesteBrand`, ca „Felicity" de pe produs să corespundă
 * slug-ului „felicity" din listă.
 *
 * COSTUL, asumat: citirea lui `searchParams` face pagina randată la cerere, nu
 * prerandată (vezi ghidul Next, file-conventions/page.md). Datele din
 * WordPress rămân în cache-ul lui `fetchGraphQL`, deci cererea nu mai așteaptă
 * WordPress-ul după prima vizită.
 */
export default async function PaginaCategorie({
  params,
  searchParams,
}: {
  params: Promise<{ categorie: string[] }>;
  searchParams: Promise<{ [cheie: string]: string | string[] | undefined }>;
}) {
  const [{ categorie }, { brand: brandParam }] = await Promise.all([params, searchParams]);
  const slug = categorie[categorie.length - 1];
  const cunoscuta = gasesteCategorie(slug);

  // Un singur `?brand=`; o listă (`?brand=a&brand=b`) nu e un filtru pe care
  // îl oferim, deci se ignoră.
  const brandSlug = typeof brandParam === "string" && brandParam ? brandParam : undefined;
  const brand = brandSlug ? BRANDURI.find((b) => b.slug === brandSlug) : undefined;

  const [date, toateProdusele] = await Promise.all([
    fetchGraphQL(GET_CATEGORY_PAGE_QUERY, { slug, categorySlug: slug }, { tags: ["produse"] }),
    brandSlug ? incarcaToateProdusele() : Promise.resolve(null),
  ]);

  const dinWoo = date?.productCategory ?? null;
  const produse: Produs[] = date?.products?.nodes ?? [];

  // Slug necunoscut atât în WooCommerce, cât și în lista canonică.
  if (!dinWoo && !cunoscuta) notFound();

  const nume = dinWoo?.name ?? cunoscuta!.nume;
  const descriere = dinWoo?.description ?? cunoscuta?.descriere ?? "";

  // Cu filtru: produsele categoriei (sau subcategoriei) din harta completă, doar
  // ale brandului cerut, aduse la forma pe care o desenează grila de mai jos.
  const lista: Produs[] =
    brandSlug && toateProdusele
      ? toateProdusele
          .filter(
            (p) =>
              (p.categorie?.slug === slug || p.subcategorie?.slug === slug) &&
              gasesteBrand(p.brand)?.slug === brandSlug,
          )
          .map((p) => ({
            id: p.slug,
            name: p.nume,
            slug: p.slug,
            sku: p.sku,
            price: p.pret ? String(p.pret) : null,
            image: p.imagine ? { sourceUrl: p.imagine.url, altText: p.imagine.alt ?? null } : null,
          }))
      : produse;

  const numeBrand = brand?.nume ?? brandSlug;
  const caleCategorie = `/catalog/${categorie.join("/")}`;

  return (
    /* Înălțimea barei fixe vine din variabilă, nu dintr-o cifră proprie:
       `pt-28 sm:pt-32` nu nimerea niciuna dintre cele trei înălțimi reale ale
       navbarului. Motivul complet e în app/globals.css. */
    <div className="bg-slate-50 min-h-screen pt-[calc(var(--inaltime-navbar)+2rem)] lg:pt-[calc(var(--inaltime-navbar)+3rem)] pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-500 transition-colors hover:text-blue-600 mb-6"
        >
          <ArrowLeft size={15} className="shrink-0" />
          Catalog
        </Link>

        <h1 className="text-[22px] sm:text-[34px] md:text-[40px] font-extrabold text-slate-900 leading-tight">
          {nume}
        </h1>

        {descriere ? (
          <p
            className="mt-3 max-w-2xl text-slate-500 text-[15px] sm:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: descriere }}
          />
        ) : null}

        {/* ── Filtrul activ ──
            O etichetă cu numele brandului și „×": tot eticheta e linkul care
            scoate filtrul, înapoi la categoria întreagă. avo-600 cu alb (8,61 ✓),
            raza 6px a etichetelor; la hover doar se închide culoarea. */}
        {brandSlug ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-slate-500">Brand:</span>
            <Link
              href={caleCategorie}
              aria-label={`Scoate filtrul ${numeBrand}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-avo-600 px-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-avo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
            >
              {numeBrand}
              <X size={14} aria-hidden />
            </Link>
          </div>
        ) : null}

        <div aria-hidden className="mt-6 sm:mt-8 h-px w-full bg-slate-900/[0.09]" />

        {lista.length === 0 && brandSlug ? (
          /* Filtru fără rezultate — un brand scris greșit în adresă sau unul care
             nu mai are produse în categorie. Nu e starea „categorie goală", deci
             nu primește textul aceleia: spune ce s-a căutat și dă drumul înapoi. */
          <div className="mt-10 flex flex-col items-center text-center rounded-xl bg-white border border-gray-200 px-6 py-14">
            <span className="flex items-center justify-center h-12 w-12 rounded-lg bg-avo-50 text-avo-600 mb-5">
              <PackageSearch size={22} />
            </span>
            <p className="text-[15px] font-semibold text-gray-900 mb-1.5">
              Nu sunt produse {numeBrand} în această categorie
            </p>
            <Link
              href={caleCategorie}
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-avo-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-avo-700"
            >
              Vezi toate produsele din {nume}
            </Link>
          </div>
        ) : lista.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center rounded-2xl bg-white ring-1 ring-slate-900/[0.08] px-6 py-14">
            <span className="flex items-center justify-center h-12 w-12 rounded-xl bg-slate-100 text-slate-400 mb-5">
              <PackageSearch size={22} />
            </span>
            <p className="text-[15px] font-semibold text-slate-900 mb-1.5">
              Momentan nu sunt produse publicate în această categorie
            </p>
            <p className="max-w-md text-[13px] text-slate-500 leading-relaxed">
              Catalogul se actualizează lunar. Pentru disponibilitate și prețuri
              curente, trimite-ne o cerere de ofertă.
            </p>
            <Link
              href="/cerere-oferta"
              className="mt-6 inline-flex items-center justify-center h-11 px-6 rounded-xl bg-slate-900 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-blue-600"
            >
              Cere ofertă
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-6 text-[13px] text-slate-500">
              {lista.length} {lista.length === 1 ? "produs" : "produse"}
              {brandSlug ? <> {numeBrand}</> : null}
            </p>

            {/* PE TELEFON (sub `sm`) două carduri pe rând, ca pe prima pagină:
                cardul are acolo ~170px, deci poza devine pătrată, titlul 12px,
                prețul 16px. De la `sm` fiecare clasă e cea de dinainte. */}
            <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {lista.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/catalog/produs/${p.slug}`}
                  className={`${CARD} group flex flex-col p-2 sm:p-3`}
                >
                  {/* Plafon de înălțime peste proporție, aceeași idee ca la
                      cardurile de pe prima pagină (vezi CADRU_FOTO_CARD din
                      components/stiluri.ts), cu cifrele acestei grile: la `xl`
                      fotografia are 176px, iar în banda de două coloane, între
                      768 și 1024, cardul ajunge la 416px lățime și fotografia
                      la 260 — cu produsul tot atât de mic, doar cu mai mult gri
                      în jur. `max-h` o oprește la 200px. */}
                  <div className="relative aspect-square sm:aspect-[16/10] max-h-[200px] rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    {p.image?.sourceUrl ? (
                      /* `next/image`, nu `<img>`: fotografia originală din
                         WordPress venea întreagă, la rezoluția de upload, pe un
                         card de 170–280px. Prin optimizator vine AVIF, la
                         lățimea cardului. `sizes` urmează grila: 2 coloane
                         până la lg, 3 până la xl, apoi 4 carduri de ~280px.

                         Primul rând e în primul ecran și conține elementul LCP
                         al paginii (măsurat): primele patru se încarcă imediat,
                         primele două cu prioritate — pe telefon sunt singurele
                         vizibile. Restul, lazy. */
                      <Image
                        src={p.image.sourceUrl}
                        alt={p.image.altText ?? p.name}
                        fill
                        sizes="(max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 280px"
                        className="object-contain"
                        loading={i < 4 ? "eager" : "lazy"}
                        fetchPriority={i < 2 ? "high" : "auto"}
                      />
                    ) : (
                      <span className="text-[11px] text-slate-300">Fără imagine</span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 px-1 pt-2.5 pb-1 sm:px-3 sm:pt-4 sm:pb-2">
                    <h2 className="h-8 text-[12px] leading-4 sm:h-11 sm:text-[14px] sm:leading-snug font-bold text-slate-900 line-clamp-2">
                      {p.name}
                    </h2>
                    <p className="h-3.5 sm:h-4 mt-1 font-mono text-[9px] sm:text-[10px] text-slate-400 truncate">
                      {p.sku ?? ""}
                    </p>
                    <div className="mt-auto pt-2.5 sm:pt-4 border-t border-slate-900/[0.07]">
                      <span className="text-[16px] sm:text-[20px] font-extrabold text-slate-900 tabular-nums">
                        {eur(p.price)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
