import type { MetadataRoute } from "next";
import { urlAbsolut } from "@/lib/site";

/**
 * robots.txt.
 *
 * Deschis pentru tot ce e conținut, închis pentru ce nu e o pagină:
 *
 *   /api/ ......... rute de serviciu (revalidarea). N-au ce căuta în index.
 *   /*?brand= ..... filtrul de brand e o VARIANTĂ a paginii de categorie, cu
 *                   aceleași produse. Indexată separat, ar concura cu pagina
 *                   curată pentru aceleași cuvinte. Are și `noindex` în pagină
 *                   (vezi ruta de categorie); aici economisim și drumul
 *                   robotului până acolo.
 *
 * Sitemap-ul e declarat explicit: e al doilea loc, după Search Console, din
 * care Google îl poate găsi.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/*?brand="],
      },
    ],
    sitemap: urlAbsolut("/sitemap.xml"),
    host: urlAbsolut("/").replace(/\/$/, ""),
  };
}
