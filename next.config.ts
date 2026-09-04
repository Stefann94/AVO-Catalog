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
     *
     * `qualities` rămâne nedeclarat intenționat: implicit e `[75]`, iar
     * nicăieri nu cerem altă calitate. Se declară doar când se folosește
     * `quality` cu altă valoare — altfel Next o respinge.
     */
    formats: ["image/avif", "image/webp"],

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
