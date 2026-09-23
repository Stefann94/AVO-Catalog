import type { MetadataRoute } from "next";
import { urlAbsolut } from "@/lib/site";

/**
 * robots.txt.
 *
 * Deschis pentru tot ce e conținut, închis pentru ce nu e o pagină:
 *
 *   /api/ ......... rute de serviciu. N-au ce căuta în index.
 *   /*?brand= ..... adresa VECHE a filtrului pe brand, dinainte ca el să
 *                   devină pagină proprie (/catalog/invertoare/brand-deye).
 *                   Pe un site static nu mai există cine să citească
 *                   parametrul, deci o asemenea adresă ar servi categoria
 *                   ÎNTREAGĂ sub un nume care promite altceva — adică aceeași
 *                   pagină la două adrese. Regula o ține pe robot departe;
 *                   .htaccess o trimite mai departe, la adresa nouă.
 *
 * Sitemap-ul e declarat explicit: e al doilea loc, după Search Console, din
 * care Google îl poate găsi.
 */
/**
 * Fișier, nu rută — cerut de `output: "export"`. Același motiv ca la sitemap.
 */
export const dynamic = "force-static";

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
