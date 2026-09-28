import type { Metadata } from "next";
import { Libre_Franklin, IBM_Plex_Mono, Archivo } from "next/font/google";
import "./globals.css";
import { FIRMA, NUME_SITE, SITE_URL, urlAbsolut } from "@/lib/site";
import { curata, jsonLd } from "@/lib/jsonld";

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

/**
 * Archivo Expanded, numai pentru titlurile de secțiune.
 *
 * ─── DE CE UN AL DOILEA FONT ──────────────────────────────────────────────
 *
 * Libre Franklin e o grotescă bună de text, dar la 42px arată ca orice alt
 * titlu de pe internet. Un site care se compară cu altul are nevoie să fie
 * recunoscut dintr-o privire, iar litera e primul lucru care se vede — înainte
 * de culoare și de așezare.
 *
 * ─── DE CE TOCMAI ASTA ────────────────────────────────────────────────────
 *
 * Comparate pe textul real al site-ului: Archivo Expanded, Archivo, Bricolage
 * Grotesque, Space Grotesk, Chivo, Familjen Grotesk, Oswald, Anton, Sora.
 *
 *   LĂȚIMEA e ce o deosebește. E o grotescă întinsă, adică exact forma pe care
 *   o au capetele de catalog tipărit și plăcuțele de pe utilaje. Se potrivește
 *   cu ce vindem, fără să fie un font „de caracter" care obosește.
 *
 *   NU SEAMĂNĂ CU ROBOTO, fontul de pe site-ul cu care ne comparăm. Oswald și
 *   Anton se deosebeau și ele, dar sunt înguste și grele — citesc a afiș de
 *   concert, nu a distribuitor. Familjen și Archivo simplu erau prea aproape
 *   de ce avem deja.
 *
 *   DIACRITICELE SUNT CORECTE: ș și ț cu virgulă dedesubt, nu cu sedilă.
 *   Verificat pe „Stații de Încărcare Auto" și „Șine și Profile", cele mai
 *   lungi nume de categorie din catalog.
 *
 * ─── LĂȚIME NORMALĂ, NU EXTINSĂ ───────────────────────────────────────────
 *
 * Prima încercare a fost varianta lată, la `font-stretch: 125%`. Două motive
 * pentru care n-a rămas:
 *
 *   SE VEDEA PREA LAT. La 42px, un titlu de trei cuvinte ocupa jumătate din
 *   coloană și trăgea ochiul de la marfă.
 *
 *   COSTA 172 KB. Google servește „Archivo Expanded" ca familie separată, pe
 *   care next/font/google n-o are în listă — importul se oprea cu „Unknown
 *   font". Singura cale era Archivo variabil cu `axes: ["wdth"]`, adică toată
 *   plaja de lățimi 62–125 ȘI toate greutățile, pe două subseturi: 88 + 84 KB,
 *   pentru un singur titlu.
 *
 * Archivo la lățime normală, o singură greutate, păstrează ce conta: litera e
 * altfel decât Libre Franklin — `a` cu coadă dreaptă, `g` cu o singură buclă,
 * deschideri mai strânse — deci titlurile se recunosc, fără să strige.
 *
 * DACĂ SE VREA TOTUȘI MAI LAT, e nevoie de `axes: ["wdth"]` aici și de
 * `font-stretch` în `titlu-sectiune` din globals.css. Plata e cea de sus.
 *
 * ─── CE COSTĂ ACUM ────────────────────────────────────────────────────────
 *
 * `preload: false`: titlurile de secțiune sunt toate sub prima vizualizare,
 * iar o preîncărcare le-ar pune să concureze cu fotografia care decide LCP-ul.
 * Aceeași socoteală ca la fontul mono.
 *
 * `display: swap`: până sosește, titlul se vede cu Libre Franklin.
 */
const archivo = Archivo({
  variable: "--font-titlu-app",
  subsets: ["latin", "latin-ext"],
  weight: ["800"],
  display: "swap",
  preload: false,
});

/**
 * Ce moștenește fiecare pagină în `<head>`.
 *
 * `metadataBase` e obligatoriu ca adresele relative (canonical, imagini Open
 * Graph) să devină absolute. Fără el, Next dă eroare la build pentru orice
 * canonical relativ, iar rețelele sociale nu pot rezolva imaginea.
 *
 * `title.template` pune numele site-ului după titlul fiecărei pagini, o
 * singură dată, în loc să fie scris de mână în fiecare `generateMetadata`.
 * `default` e pentru paginile fără titlu propriu.
 *
 * Titlul și descrierea de aici NU mai sunt „Catalog de produse Avo Grup
 * Invest": aceeași pereche apărea pe prima pagină, pe /catalog și pe toate
 * cele 27 de pagini de categorie. Google tratează asta ca pagini
 * nediferențiate și alege singur care merită arătată.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${NUME_SITE} — distribuitor echipamente fotovoltaice`,
    template: `%s — ${NUME_SITE}`,
  },
  description: FIRMA.descriere,
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: NUME_SITE,
  },
  // Implicit Google indexează oricum; scris explicit, ca o schimbare viitoare
  // să fie o decizie, nu o omisiune.
  robots: { index: true, follow: true },
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
      className={`${libreFranklin.variable} ${plexMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {/* Cine e firma, o singură dată pe site. Google leagă de ea toate
            paginile și o folosește în panoul de cunoștințe. Doar date care
            există și pe pagină: nimic inventat. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(
            curata({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: FIRMA.nume,
              description: FIRMA.descriere,
              url: SITE_URL,
              logo: urlAbsolut("/logo.png"),
              telephone: FIRMA.telefon,
              email: FIRMA.email,
              address: {
                "@type": "PostalAddress",
                streetAddress: FIRMA.adresa.strada,
                addressLocality: FIRMA.adresa.oras,
                addressRegion: FIRMA.adresa.judet,
                addressCountry: FIRMA.adresa.tara,
              },
            }),
          )}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
