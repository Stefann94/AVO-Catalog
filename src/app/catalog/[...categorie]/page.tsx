import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { CARD } from "@/components/stiluri";
import { fetchGraphQL } from "@/lib/graphql-client";
import { GET_CATEGORY_PAGE_QUERY } from "@/lib/queries";
import { CATEGORII_CUNOSCUTE, SUBCATEGORII_CUNOSCUTE, gasesteCategorie } from "@/lib/categorii";

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

export async function generateStaticParams() {
  return [
    ...CATEGORII_CUNOSCUTE.map((c) => ({ categorie: [c.slug] })),
    // Și cele două niveluri: /catalog/invertoare/hibride-trifazate. Fără ele
    // subcategoriile s-ar randa la cerere, deci prima vizită ar aștepta
    // răspunsul WordPress-ului, care vine în ~4 secunde.
    ...SUBCATEGORII_CUNOSCUTE.map((s) => ({ categorie: [s.parinte, s.slug] })),
  ];
}

export default async function PaginaCategorie({
  params,
}: {
  params: Promise<{ categorie: string[] }>;
}) {
  const { categorie } = await params;
  const slug = categorie[categorie.length - 1];
  const cunoscuta = gasesteCategorie(slug);

  const date = await fetchGraphQL(
    GET_CATEGORY_PAGE_QUERY,
    { slug, categorySlug: slug },
    { tags: ["produse"] }
  );

  const dinWoo = date?.productCategory ?? null;
  const produse: Produs[] = date?.products?.nodes ?? [];

  // Slug necunoscut atât în WooCommerce, cât și în lista canonică.
  if (!dinWoo && !cunoscuta) notFound();

  const nume = dinWoo?.name ?? cunoscuta!.nume;
  const descriere = dinWoo?.description ?? cunoscuta?.descriere ?? "";

  return (
    <div className="bg-slate-50 min-h-screen pt-28 sm:pt-32 pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-500 transition-colors hover:text-blue-600 mb-6"
        >
          <ArrowLeft size={15} className="shrink-0" />
          Catalog
        </Link>

        <h1 className="text-[26px] sm:text-[34px] md:text-[40px] font-extrabold text-slate-900 leading-tight">
          {nume}
        </h1>

        {descriere ? (
          <p
            className="mt-3 max-w-2xl text-slate-500 text-[15px] sm:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: descriere }}
          />
        ) : null}

        <div aria-hidden className="mt-6 sm:mt-8 h-px w-full bg-slate-900/[0.09]" />

        {produse.length === 0 ? (
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
              {produse.length} {produse.length === 1 ? "produs" : "produse"}
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {produse.map((p) => (
                <Link
                  key={p.id}
                  href={`/catalog/produs/${p.slug}`}
                  className={`${CARD} group flex flex-col p-3`}
                >
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    {p.image?.sourceUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image.sourceUrl}
                        alt={p.image.altText ?? p.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-[11px] text-slate-300">Fără imagine</span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 px-3 pt-4 pb-2">
                    <h2 className="h-11 text-[14px] font-bold text-slate-900 leading-snug line-clamp-2">
                      {p.name}
                    </h2>
                    <p className="h-4 mt-1 font-mono text-[10px] text-slate-400 truncate">
                      {p.sku ?? ""}
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-900/[0.07]">
                      <span className="text-[20px] font-extrabold text-slate-900 tabular-nums">
                        {p.price ?? "La cerere"}
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
