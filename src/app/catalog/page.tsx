import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_ALL_PRODUCTS_QUERY, GET_CATEGORIES_QUERY } from '@/lib/queries';
import Link from 'next/link';
import { BUTON_PLIN, CARD } from '@/components/stiluri';

/**
 * Forma datelor întoarse de GET_CATEGORIES_QUERY și GET_ALL_PRODUCTS_QUERY.
 *
 * Câmpurile sunt opționale pentru că GraphQL le poate omite: prețul lipsește
 * la produsele variabile, imaginea la cele fără poză. Declarate explicit, în
 * locul lui `any`, TypeScript prinde acum o greșeală de nume de câmp la
 * compilare, în loc să randeze `undefined` în pagină.
 */
type CategorieWoo = {
  name: string;
  slug: string;
  count?: number | null;
};

type ProdusWoo = {
  id: string;
  name: string;
  slug: string;
  price?: string | null;
  productCategories?: { nodes?: { name: string; slug: string }[] | null } | null;
  image?: { sourceUrl: string; altText?: string | null } | null;
};

// Catalogul se revalidează o dată pe oră, ca și restul interogărilor GraphQL.
export const revalidate = 3600;

/** „1.475 €", din numărul brut întors de WooCommerce. */
const eur = (p?: string | null) => {
  const n = Number(p);
  return Number.isFinite(n) && n > 0 ? `${n.toLocaleString("ro-RO")} €` : "La cerere";
};

export default async function CatalogPage() {
  const productsData = await fetchGraphQL(GET_ALL_PRODUCTS_QUERY, {}, { tags: ['produse'] });
  const categoriesData = await fetchGraphQL(GET_CATEGORIES_QUERY, {}, { tags: ['produse'] });

  const products: ProdusWoo[] = productsData?.products?.nodes || [];
  const categories: CategorieWoo[] = categoriesData?.productCategories?.nodes || [];

  return (
    /* Distanța de sus e înălțimea reală a barei fixe plus aerul secțiunii, nu
       un `pt-32` potrivit din ochi: bara are trei înălțimi, iar cifra fixă
       lăsa 7px la 1280 și 59px de gol la 900. Vezi app/globals.css. */
    <div className="min-h-screen bg-slate-50 pt-[calc(var(--inaltime-navbar)+2rem)] lg:pt-[calc(var(--inaltime-navbar)+3rem)] pb-16 sm:pb-24 px-4 sm:px-6 lg:px-12">
      {/* Coloana de categorii trece lângă grilă abia de la `lg`. La `md`, cum
          era, îi lua grilei 256px din 720 și rămâneau două carduri de ~200px,
          adică mai înghesuite decât pe un singur rând. */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12">

        {/* ── Categoriile ──────────────────────────────────────────────────
            DOUĂ FORME, fiindcă locul pe care îl are lista se schimbă complet.

            De la `lg` e coloana din stânga: 20 de categorii una sub alta,
            lipită de fereastră cât derulezi. Sub `lg` coloana nu mai are unde
            sta, iar aceeași listă verticală devine primul lucru din pagină —
            măsurat la 960px: 800px de nume de categorii înainte de PRIMUL
            produs. Cine deschidea catalogul pe o fereastră de laptop
            nemaximizată nu vedea niciun produs fără să deruleze.

            Sub `lg` aceleași linkuri sunt un rând de etichete care se rupe pe
            câte rânduri e nevoie: aceeași informație, ~120px în loc de 800.
            Nu se ascunde nimic și nu se adaugă niciun buton de desfășurat. */}
        <aside className="w-full lg:w-60 xl:w-64 shrink-0">
          <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200/60 lg:sticky lg:top-[calc(var(--inaltime-navbar)+1.5rem)]">
            <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6">Categorii</h3>
            <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalog/${cat.slug}`}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] text-slate-600 transition-colors hover:text-blue-600 lg:justify-between lg:gap-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:text-base"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-slate-400 lg:bg-slate-100 lg:text-slate-500 lg:px-2 lg:py-1 lg:rounded-full">{cat.count || 0}</span>
                </Link>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-slate-400">Nicio categorie găsită. Te rugăm să imporți produsele.</p>
              )}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="mb-8">
            <h1 className="text-[28px] sm:text-[34px] lg:text-4xl font-bold text-slate-900 mb-2 leading-tight">Catalog Echipamente</h1>
            <p className="text-[15px] sm:text-base text-slate-500">Vizualizează portofoliul nostru complet de sisteme fotovoltaice.</p>
          </div>

          {/* Trei coloane de la `lg`, ca pe pagina de categorie: cu lista de
              categorii alături, la 1024 ies carduri de ~205px, iar rândul de
              jos — preț plus butonul „Vezi" — cere 159px din cei 165 rămași
              după `p-5`. Încape, dar fără rezervă pentru un preț de patru
              cifre, de-aia rândul acela are voie să se rupă (vezi mai jos). */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {products.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-lg text-slate-500 font-medium mb-2">Nu există produse în baza de date WooCommerce momentan.</p>
                <p className="text-sm text-slate-400">Așteptăm finalizarea importului CSV...</p>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className={`${CARD} relative overflow-hidden group flex flex-col`}>
                  {/* Image Placeholder */}
                  <div className="h-44 xl:h-48 bg-slate-100 flex items-center justify-center p-4 xl:p-6 relative overflow-hidden">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image.sourceUrl} alt={product.image.altText || product.name} className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="text-slate-300 text-sm font-medium">Fără Imagine</span>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="p-5 xl:p-6 flex flex-col flex-1">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                      {product.productCategories?.nodes?.[0]?.name || 'Necategorizat'}
                    </span>
                    <h3 className="text-[17px] xl:text-lg font-bold text-slate-900 mb-2 leading-snug line-clamp-2">
                      {product.name}
                    </h3>

                    {/* `flex-wrap`: la trei coloane pe 1024 rândul are 165px, iar
                        un preț de patru cifre („1.475 €", 85px) lângă buton
                        cere 159. Marja e de 6px, deci un preț mai lung ar
                        împinge butonul în afara cardului. Cu voie de rupere,
                        butonul coboară pe rândul următor în loc să iasă —
                        singurul mod în care cardul rămâne întreg la ORICE preț,
                        nu doar la cele de azi. */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
                      <div>
                        <span className="text-[22px] xl:text-2xl font-bold text-slate-900">
                          {eur(product.price)}
                        </span>
                      </div>
                      <Link href={`/catalog/produs/${product.slug}`} className={`${BUTON_PLIN} after:absolute after:inset-0`}>
                        Vezi
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
