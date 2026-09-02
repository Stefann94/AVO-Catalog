import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/**
 * DM Sans pentru text și titluri — sans geometric, cu „O" aproape circular,
 * ales ca să rimeze cu logotipul AVO grup Invest, care e tot geometric.
 * Font variabil, deci avem greutăți până la 900 fără fișiere suplimentare.
 *
 * IBM Plex Mono rămâne pentru SKU-uri, coduri și date: un mono nu trebuie să
 * semene cu sigla, trebuie să fie lizibil și cu cifre de lățime egală.
 *
 * Fiind variabil, DM Sans acceptă `font-extrabold` (800) — spre deosebire de
 * IBM Plex Sans, care se oprea la 700 și obliga titlurile la o greutate mai mică.
 *
 * Subsetul `latin-ext` e obligatoriu pentru diacriticele românești (ă, â, î, ș, ț) —
 * fără el ar cădea pe fontul de rezervă în mijlocul cuvintelor.
 */
const dmSans = DM_Sans({
  variable: "--font-sans-app",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/**
 * `preload: false` intenționat.
 *
 * Cu preîncărcarea implicită, cele trei greutăți pe două subseturi generau șase
 * `<link rel="preload" as="font">` în fiecare pagină, iar browserul le raporta
 * pe toate ca „preloaded but not used within a few seconds from the window's
 * load event": fontul mono apare doar în câteva etichete mici (intervalul de
 * preț din „Gama de produse" și SKU-urile din catalog), toate sub prima
 * vizualizare. Preîncărcarea lor ocupa banda în fereastra critică și concura cu
 * resursele care chiar decid LCP-ul.
 *
 * Fișierele se descarcă în continuare, în momentul în care fontul e folosit —
 * randarea paginii rămâne identică.
 */
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-app",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Avo Grup Invest - Catalog",
  description: "Catalog de produse Avo Grup Invest",
};

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${dmSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
