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
  },
};

export default nextConfig;
