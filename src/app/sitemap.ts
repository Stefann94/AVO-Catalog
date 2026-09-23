import type { MetadataRoute } from "next";
import { CATEGORII_CUNOSCUTE, SUBCATEGORII_CUNOSCUTE } from "@/lib/categorii";
import { sluguriProduse } from "@/lib/produs";
import { caleBrand, paginiBrand } from "@/lib/pagini-brand";
import { urlAbsolut } from "@/lib/site";

/**
 * sitemap.xml, generat din catalogul real.
 *
 * ─── DE CE E PRIMUL LUCRU DE FĂCUT PENTRU GOOGLE ──────────────────────────
 *
 * Un site nou nu are linkuri din exterior, deci Google n-are pe unde să ajungă
 * la fișele de produs. Sitemap-ul e lista pe care i-o dăm noi: „astea sunt
 * paginile, atâtea sunt, aici încep". Fără el, indexarea celor ~172 de fișe ar
 * depinde de plimbarea robotului prin meniuri.
 *
 * ─── CE INTRĂ ȘI CE NU ────────────────────────────────────────────────────
 *
 * Intră doar pagini care pot fi indexate și care răspund cu 200: prima pagină,
 * catalogul, lichidarea, categoriile, subcategoriile, paginile de brand și
 * toate fișele.
 *
 * Paginile de brand au intrat odată cu trecerea lor de la `?brand=deye`, un
 * filtru `noindex`, la adrese proprii — vezi lib/pagini-brand.ts. Înainte erau
 * excluse pe bună dreptate: o adresă marcată „nu indexa" n-are ce căuta în
 * lista pe care i-o dăm lui Google.
 *
 * NU intră paginile care nu există. O adresă care dă 404 într-un sitemap e un
 * semnal prost: îi spunem lui Google că nu știm ce e pe site-ul nostru.
 *
 * `lastModified` e data build-ului. E cinstit: la fiecare publicare, conținutul
 * chiar e regenerat din WooCommerce. O dată inventată per produs ar fi o
 * minciună pe care Google o poate verifica.
 */
/**
 * Fișier, nu rută.
 *
 * `force-static` e cerut de `output: "export"`: acolo nu există server care să
 * reconstruiască ceva la o oră, iar Next refuză să construiască fără să-i spui
 * explicit că fișierul se scrie o dată, la construcție. Aici scria
 * `revalidate = 3600`, care presupunea un server.
 */
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const acum = new Date();
  const [sluguri, branduri] = await Promise.all([sluguriProduse(), paginiBrand()]);

  const pagina = (
    cale: string,
    prioritate: number,
    frecventa: "daily" | "weekly" | "monthly",
  ) => ({
    url: urlAbsolut(cale),
    lastModified: acum,
    changeFrequency: frecventa,
    priority: prioritate,
  });

  return [
    pagina("/", 1, "weekly"),
    pagina("/catalog", 0.9, "daily"),
    pagina("/despre-noi", 0.5, "monthly"),
    pagina("/cerere-oferta", 0.6, "monthly"),
    pagina("/contact", 0.5, "monthly"),
    pagina("/catalog/lichidare-stoc", 0.7, "daily"),
    ...CATEGORII_CUNOSCUTE.map((c) => pagina(`/catalog/${c.slug}`, 0.8, "weekly")),
    ...SUBCATEGORII_CUNOSCUTE.map((s) =>
      pagina(`/catalog/${s.parinte}/${s.slug}`, 0.7, "weekly"),
    ),
    // Categorie + brand: „invertoare Deye". Prioritate 0,6 — sub categoria
    // întreagă, fiindcă răspund la o căutare mai îngustă, dar peste nimic:
    // fiecare are produse reale.
    ...branduri.map((b) => pagina(caleBrand(b.categorie, b.brand), 0.6, "weekly")),
    // Fișele sunt ținta reală a testului: căutările după cod exact de produs.
    ...sluguri.map((slug) => pagina(`/catalog/produs/${slug}`, 0.8, "weekly")),
  ];
}
