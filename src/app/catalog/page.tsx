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

export default async function CatalogPage() {
  const productsData = await fetchGraphQL(GET_ALL_PRODUCTS_QUERY, {}, { tags: ['produse'] });
  const categoriesData = await fetchGraphQL(GET_CATEGORIES_QUERY, {}, { tags: ['produse'] });

  const products: ProdusWoo[] = productsData?.products?.nodes || [];
  const categories: CategorieWoo[] = categoriesData?.productCategories?.nodes || [];

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 sticky top-32">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Categorii</h3>
            <div className="flex flex-col gap-3">
              {categories.map((cat) => (
                <Link key={cat.slug} href={`/catalog/${cat.slug}`} className="text-slate-600 hover:text-blue-600 flex justify-between items-center transition-colors">
                  <span>{cat.name}</span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{cat.count || 0}</span>
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
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Catalog Echipamente</h1>
            <p className="text-slate-500">Vizualizează portofoliul nostru complet de sisteme fotovoltaice.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-lg text-slate-500 font-medium mb-2">Nu există produse în baza de date WooCommerce momentan.</p>
                <p className="text-sm text-slate-400">Așteptăm finalizarea importului CSV...</p>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className={`${CARD} relative overflow-hidden group flex flex-col`}>
                  {/* Image Placeholder */}
                  <div className="h-48 bg-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image.sourceUrl} alt={product.image.altText || product.name} className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="text-slate-300 text-sm font-medium">Fără Imagine</span>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                      {product.productCategories?.nodes?.[0]?.name || 'Necategorizat'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-slate-900">
                          {product.price ? product.price : 'La cerere'}
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
