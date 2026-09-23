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
      // Gazda WordPress după mutare. Vezi lib/wordpress.ts: `urlMedia()` aduce
      // aici orice adresă de fișier venită din WordPress, indiferent sub ce
      // nume și-l scrie el însuși în răspuns.
      {
        protocol: "https",
        hostname: "admin.avogrupinvest.ro",
        pathname: "/wp-content/uploads/**",
      },
      // Gazda de dinainte de mutare. Rămâne în listă cât timp `www` mai poate
      // servi fișiere: o scoatem abia după ce domeniul principal e al nostru
      // de-a binelea, ca o construcție pornită în timpul mutării să nu cadă pe
      // o imagine respinsă.
      {
        protocol: "https",
        hostname: "www.avogrupinvest.ro",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },

  /**
   * Build-ul apasă mai ușor pe WordPress.
   *
   * Implicit, Next pornește un lucrător la fiecare 25 de pagini — la 205 pagini
   * înseamnă 10 procese care interoghează WordPress-ul în aceeași secundă.
   * Găzduirea partajată răspunde în ~0,8 s la o interogare simplă și cedează
   * sub sarcina asta: un build a produs 566 de reîncercări și 490 de răspunsuri
   * 500, iar toate cele 172 de fișe au ieșit goale.
   *
   * `MinPagesPerWorker: 60` ... 3–4 lucrători în loc de 10.
   * `MaxConcurrency: 4` ....... câte pagini randează în paralel un lucrător.
   * `RetryCount: 2` ........... o pagină care a eșuat se reîncearcă, deci un
   *                             hopa trecător nu mai oprește build-ul. Ce
   *                             eșuează și după reîncercări ÎL OPREȘTE —
   *                             intenționat, vezi lib/graphql-client.ts.
   */
  experimental: {
    staticGenerationMinPagesPerWorker: 60,
    staticGenerationMaxConcurrency: 4,
    staticGenerationRetryCount: 2,
  },

  /**
   * Adresele site-ului de prezentare care se înlocuiește.
   *
   * ─── DE CE DOAR ȘAPTE ─────────────────────────────────────────────────
   *
   * Sitemap-ul vechi are 59 de adrese, dar 52 sunt paginile demo ale temei
   * WordPress: `air-freight`, `maritime-transport`, `typography`,
   * `coming-soon`, plus articole de umplutură („the-hidden-gems",
   * „art-deco-fair-2021"). Ele n-au echivalent aici, iar o redirecționare
   * către prima pagină ar fi tratată de Google drept „soft 404" — adică
   * exact același rezultat, dar cu un drum în plus și cu riscul ca omul să
   * ajungă pe o pagină care n-are legătură cu ce căuta.
   *
   * Pentru ele, 404 e răspunsul corect și cinstit: pagina chiar nu mai
   * există. Google le scoate din index de la sine.
   *
   * Redirecționăm doar unde există un echivalent real. `/contact`,
   * `/despre-noi` și `/cerere-oferta` nu apar în listă fiindcă adresele lor
   * rămân identice — paginile noi le preiau direct.
   */
  async redirects() {
    return [
      { source: "/prima-pagina", destination: "/", permanent: true },
      { source: "/distributie-echipamente-fotovoltaice", destination: "/catalog", permanent: true },
      { source: "/invertoare-stocare-energie", destination: "/catalog/invertoare", permanent: true },
      { source: "/panouri-fotovoltaice", destination: "/catalog/panouri-fotovoltaice", permanent: true },
      // Paginile de magazin ale WooCommerce-ului din spate. Catalogul nu are
      // coș, deci toate duc în același loc: lista de produse.
      { source: "/shop", destination: "/catalog", permanent: true },
      { source: "/cart", destination: "/catalog", permanent: true },
      { source: "/checkout", destination: "/catalog", permanent: true },
      { source: "/my-account", destination: "/catalog", permanent: true },
    ];
  },
};

export default nextConfig;
