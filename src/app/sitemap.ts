import type { MetadataRoute } from "next";
import { CATEGORII_CUNOSCUTE, SUBCATEGORII_CUNOSCUTE } from "@/lib/categorii";
import { sluguriProduse } from "@/lib/produs";
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
 * catalogul, lichidarea, categoriile, subcategoriile și toate fișele.
 *
 * NU intră adresele cu `?brand=`, care sunt filtre, nici paginile care nu
 * există încă (contact, cerere de ofertă). O adresă care dă 404 într-un
 * sitemap e un semnal prost: îi spunem lui Google că nu știm ce e pe site-ul
 * nostru.
 *
 * `lastModified` e data build-ului. E cinstit: la fiecare publicare, conținutul
 * chiar e regenerat din WooCommerce. O dată inventată per produs ar fi o
 * minciună pe care Google o poate verifica.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const acum = new Date();
  const sluguri = await sluguriProduse();

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
    // Fișele sunt ținta reală a testului: căutările după cod exact de produs.
    ...sluguri.map((slug) => pagina(`/catalog/produs/${slug}`, 0.8, "weekly")),
  ];
}
