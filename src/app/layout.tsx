import type { Metadata } from "next";
import { Libre_Franklin, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/**
 * Libre Franklin pentru tot textul site-ului.
 *
 * DE CE S-A SCHIMBAT. Înainte era DM Sans — geometric, cu „O" aproape
 * circular, ales ca să rimeze cu logotipul. Problema lui e că e printre cele
 * mai folosite fonturi din șabloanele de site: aducea exact senzația de
 * „generat", pe care întreg proiectul o evită deliberat.
 *
 * DE CE ĂSTA. Cerința a fost „foarte serios, dar aerisit, nu foarte lipite
 * literele". Libre Franklin e o reinterpretare a lui Franklin Gothic, fontul
 * ziarelor americane de la 1900 — de acolo îi vine seriozitatea, care e
 * editorială, nu tehnologică. Iar literele lui stau larg: măsurat pe 17
 * candidați, „o" minuscul are 60px la un corp de 100px, la egalitate cu Inter
 * și peste Geist, Public Sans sau Mulish, toate la 57–58px.
 *
 * Alternativa cea mai deschisă era Be Vietnam Pro (64px), dar seriozitatea lui
 * e corporativă, nu editorială. Inter avea aceleași cifre, dar e fontul
 * folosit azi de aproape orice produs SaaS — adică fix problema lui DM Sans.
 *
 * Fiind variabil (100–900), acceptă `font-extrabold` (800) pentru titluri,
 * spre deosebire de IBM Plex Sans, care se oprea la 700.
 *
 * CE PIERDEM. Libre Franklin nu are cifre de lățime egală, deci `tabular-nums`
 * n-are efect pe el. Nu e o regresie — nici DM Sans nu avea, iar clasa era
 * scoasă din cod tocmai fiindcă nu făcea nimic. Dacă vreodată prețurile
 * trebuie aliniate strict pe verticală într-un tabel, soluția e o coloană de
 * lățime fixă, nu fontul.
 *
 * IBM Plex Mono rămâne doar pentru SKU-urile din catalog: acolo chiar e nevoie
 * de cifre de lățime egală, iar un mono nu trebuie să semene cu sigla.
 *
 * Subsetul `latin-ext` e obligatoriu pentru diacriticele românești (ă, â, î,
 * ș, ț) — fără el ar cădea pe fontul de rezervă în mijlocul cuvintelor.
 * Verificat că ș și ț au virgulă dedesubt, nu sedilă, cum greșesc multe fonturi.
 */
const libreFranklin = Libre_Franklin({
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
      className={`${libreFranklin.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
