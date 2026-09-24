import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  /**
   * Site static: fișiere HTML, fără niciun program care să ruleze pe server.
   *
   * ─── DE CE ────────────────────────────────────────────────────────────
   *
   * Găzduirea pe care se mută site-ul, avogrupinvest.ro de la Hostico, n-are
   * Node. Dar motivul nu e doar constrângerea: măsurat, un fișier static de
   * acolo răspunde în 96 ms, față de 125 ms de pe Vercel. Serverul e în
   * România, ca și clienții. Iar paginile erau OaRICUM pregătite dinainte —
   * toate cele 218 se generează la construcție. Node-ul nu le construia la
   * cerere, doar le trimitea.
   *
   * ─── CE S-A MUTAT DIN CAUZA ASTA ──────────────────────────────────────
   *
   *   redirecționările ....... în public/.htaccess, unde le face serverul;
   *   filtrul `?brand=` ...... în pagini proprii, /catalog/x/brand-y
   *                            (vezi lib/pagini-brand.ts);
   *   /api/revalidate ........ șters. WordPress nu mai anunță site-ul; site-ul
   *                            se reconstruiește, iar reconstrucția ia datele
   *                            proaspete;
   *   fotografiile ........... pregătite după construcție, vezi mai jos.
   */
  output: "export",

  /**
   * Identificatorul construcției: același cod → același identificator.
   *
   * ─── CE PROBLEMĂ REZOLVĂ ──────────────────────────────────────────────
   *
   * Next pune în fiecare pagină un identificator al construcției, generat
   * aleatoriu de fiecare dată. Consecința se vede abia la publicare: toate
   * cele 1286 de fișiere de conținut — 215 pagini plus 1071 de încărcături de
   * navigare — par modificate la fiecare rulare, chiar dacă nimic nu s-a
   * schimbat.
   *
   * Măsurat: o publicare fără nicio modificare reală a urcat 17,8 minute.
   * Urcarea trimite doar ce s-a schimbat, dar totul „se schimbase".
   *
   * ─── DE CE AMPRENTA COMMIT-ULUI ───────────────────────────────────────
   *
   * Identificatorul TREBUIE să se schimbe când se schimbă codul — el e ce
   * împiedică un browser să amestece pagini vechi cu cod nou. Amprenta
   * commit-ului face exact asta: se schimbă la orice modificare de cod, și
   * rămâne aceeași când se schimbă doar un preț în WooCommerce.
   *
   * Așa, o modificare de preț urcă paginile acelui produs, nu tot site-ul.
   *
   * În afara publicării automate, `GITHUB_SHA` lipsește. Valoarea fixă de
   * rezervă e corectă acolo: pe calculatorul propriu nu există cache de
   * browser de păcălit, iar construcțiile trebuie să iasă identice ca să le
   * putem compara între ele.
   */
  generateBuildId: () => process.env.GITHUB_SHA ?? "dezvoltare",

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

    /*
     * ─── `inlineCss` A FOST ÎNCERCAT ȘI RESPINS. NU-L REPORNI. ───────────
     *
     * Ideea părea sigură: foaia de stil bloca desenarea 150 ms, iar lanțul
     * document → stil → font dura 597 ms. Pusă în pagină, cererea a doua
     * dispare. Documentația lui Next o recomandă exact pentru cazul nostru —
     * Tailwind, vizitatori noi, conexiuni lente.
     *
     * Măsurat însă pe site-ul viu, cu tools/masurare/masoara.mjs, mediana din
     * 3 rulări pe 4 pagini:
     *
     *                        fără        cu
     *     Performance ....... 83   →     77
     *     LCP ............... 3,91 s →   4,04 s
     *     FCP, prima pagină . 1,44 s →   2,05 s
     *     HTML, fișă ........ 77 KB  →   360 KB
     *
     * Cauza e în ultimul rând. Stilurile nu se scriu o dată, ci de DOUĂ ori:
     * 89 KB în `<style>` și încă o dată, cu escape, în datele React din
     * pagină — ~280 KB în plus la fiecare document, ~50 KB după comprimare.
     * Pe o rețea lentă, octeții ăia costă mai mult decât drumul economisit.
     *
     * `cssChunking` nu ajută: tot CSS-ul vine dintr-un singur fișier Tailwind
     * importat în layout, deci n-are ce să fie tăiat pe rute.
     *
     * Ar redeveni interesant doar dacă foaia de stil ar scădea mult sau dacă
     * Next ar înceta s-o mai repete în datele React. Până atunci, `<link>`-ul
     * separat e mai ieftin.
     */
  },

  /*
   * ─── REDIRECȚIONĂRILE NU MAI SUNT AICI ────────────────────────────────
   *
   * Erau opt reguli `redirects()`, pentru adresele site-ului de prezentare
   * care se înlocuiește. Într-un site static nu se aplică — `next build` o
   * spune răspicat: „rewrites, redirects, and headers are not applied when
   * exporting your application". Reguli lăsate aici ar fi arătat ca și cum
   * site-ul le face, fără să le facă.
   *
   * Sunt acum în public/.htaccess, cu aceleași adrese și cu explicația
   * pentru care sunt doar șapte, nu cele 59 din sitemap-ul vechi.
   */
};

/**
 * ÎN DEZVOLTARE, `output: "export"` SE SCOATE.
 *
 * ─── CE SE ÎNTÂMPLA ───────────────────────────────────────────────────────
 *
 * Pe `npm run dev`, orice pagină cădea cu „Image Optimization using the
 * default loader is not compatible with `{ output: 'export' }`", aruncată din
 * bara de sus, de la sigla din `next/image`. Site-ul live mergea perfect, deci
 * arăta ca o ciudățenie — dar nu era.
 *
 * Sunt DOUĂ verificări diferite în Next 16.3.4, găsite în node_modules:
 *
 *   shared/lib/get-img-props.js:286 ... aruncă la RANDARE, dar numai dacă
 *                                       `NODE_ENV !== "production"` — adică
 *                                       numai pe serverul de dezvoltare;
 *   export/index.js:343 ............... aceeași verificare la export, dar
 *                                       SĂRITĂ când exportul e parte din
 *                                       `next build` (`options.buildExport`).
 *
 * De-aceea construcția trece și scoate adrese `/_next/image?url=…`, pe care
 * tools/imagini/pregateste-static.mjs le transformă apoi în AVIF. Doar
 * dezvoltarea era blocată.
 *
 * ─── DE CE NU `images.unoptimized: true` ──────────────────────────────────
 *
 * E soluția pe care o propune chiar mesajul de eroare, și ar fi stricat
 * construcția. Cu ea, Next scrie în pagini adresele brute ale fotografiilor,
 * nu `/_next/image?url=…` — iar unealta noastră exact pe acelea le caută. Ar fi
 * ieșit zero AVIF-uri, iar verificarea din workflow („cel puțin 1000 de
 * fotografii") ar fi oprit publicarea. Mesajul de eroare nu știe de ea.
 *
 * ─── DE CE `phase`, ȘI NU `NODE_ENV` ──────────────────────────────────────
 *
 * Ar fi mers și `process.env.NODE_ENV`, dar valoarea lui depinde de momentul
 * în care Next o pune față de citirea fișierului ăstuia. `phase` e argumentul
 * pe care Next îl dă anume pentru asta, deci nu depinde de nicio ordine.
 *
 * Construcția nu e atinsă: la `PHASE_PRODUCTION_BUILD` se întoarce exact
 * configurația de mai sus, cu `output: "export"` neschimbat.
 */
export default function configurare(faza: string): NextConfig {
  if (faza === PHASE_DEVELOPMENT_SERVER) {
    return { ...nextConfig, output: undefined };
  }
  return nextConfig;
}
