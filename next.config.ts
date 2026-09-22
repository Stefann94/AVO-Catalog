import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Implicit Next servește doar WebP. Adăugat AVIF în față, fiindcă ordinea
     * din listă decide: se alege primul format pe care browserul îl acceptă,
     * iar cine nu cunoaște AVIF primește în continuare WebP.
     *
     * Pe fotografiile din cardurile de categorie diferența e reală — sunt
     * patru JPEG-uri de 106–231 KB, iar AVIF le duce tipic la jumătate față
     * de WebP la aceeași calitate vizuală.
     */
    formats: ["image/avif", "image/webp"],

    /**
     * Calitatea imaginilor servite. Implicit Next folosește 75; aici 60 pentru
     * tot site-ul și 45 pentru posterele din hero.
     *
     * Alese pe decupaje mărite, la 75/60/50/40 (AVIF, cu formula lui Next):
     *   60 ... nu se distinge de 75, iar fișierele scad cu ~33%
     *          (poster 35,7 → 23,5 KB; fotografie de categorie 18 → 12 KB);
     *   50 ... liniile celulelor de pe panouri încep să se încețoșeze, iar
     *          textul mic de pe produse (sigla Deye de pe baterie) se pătează;
     *   40 ... degradare vizibilă.
     * Posterele din hero merg la 45: sunt afișate la 60% opacitate, sub două
     * gradiente închise, unde diferența nu se vede.
     *
     * O imagine fără `quality` primește valoarea din listă cea mai apropiată
     * de 75, adică 60. Orice altă valoare cerută direct la /_next/image e
     * respinsă cu 400 — de aceea lista e închisă.
     */
    qualities: [45, 60],

    /**
     * Pozele de categorie încărcate în WooCommerce.
     *
     * `next/image` refuză orice adresă externă nedeclarată — altfel oricine ar
     * putea folosi optimizatorul nostru ca proxy pentru imagini străine. Lista
     * e restrânsă la calea în care WordPress își ține fișierele încărcate, nu la
     * tot domeniul: nimic din afara bibliotecii media nu poate trece pe aici.
     *
     * Cât timp o categorie n-are miniatură în WooCommerce, cardul folosește
     * fotografia din public/ — vezi lib/gama.ts.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.avogrupinvest.ro",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
