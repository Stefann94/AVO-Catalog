import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FisaProdus from "@/components/produs/FisaProdus";
import { incarcaProdus, sluguriProduse } from "@/lib/produs";
import { incarcaPerioadaCatalog } from "@/lib/perioada";
import { NUME_SITE, urlAbsolut } from "@/lib/site";
import { curata, dataIso, disponibilitateSchema, jsonLd } from "@/lib/jsonld";

/**
 * Fișa de produs — ruta.
 *
 * Fișierul ăsta răspunde la trei întrebări și la niciuna în plus: ce pagini se
 * generează la build, ce scrie în `<head>` și de unde vin datele. CUM ARATĂ
 * pagina stă în components/produs/FisaProdus.tsx, împreună cu motivele
 * fiecărei decizii vizuale.
 *
 * Despărțirea nu e pedanterie. Aici era, până acum, și una și alta: ~230 de
 * linii de JSX cu panouri, culori de badge și praguri de contrast, amestecate
 * cu `generateStaticParams` și `generateMetadata`. Randarea s-a mutat într-o
 * componentă care primește un `Produs` și nu știe de unde vine, iar ruta a
 * rămas cu ce e într-adevăr treabă de rută.
 */

export const revalidate = 3600;

export async function generateStaticParams() {
  const sluguri = await sluguriProduse();
  return sluguri.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await incarcaProdus(slug);
  if (!p) return { title: "Produs negăsit — Avo Grup Invest" };

  // Descrierea se compune din ce există: catalogul n-are texte de produs, deci
  // o propoziție inventată ar fi singura variantă — și ar fi aceeași pe 172 de
  // pagini, ceea ce Google tratează ca duplicat.
  const bucati = [
    p.brand,
    p.cifra ? `${p.cifra.valoare} ${p.cifra.unitate}` : null,
    p.sku ? `cod ${p.sku}` : null,
    p.pret ? `${p.pret.toLocaleString("ro-RO")} € fără TVA` : null,
  ].filter(Boolean);

  const cale = `/catalog/produs/${slug}`;
  const descriere = bucati.length ? bucati.join(" · ") : p.nume;

  return {
    // Numele site-ului îl adaugă `title.template` din layout.
    title: p.nume,
    description: descriere,
    // Canonical absolut, ca varianta cu parametri (din reclame, din e-mail) să
    // trimită tot la adresa asta.
    alternates: { canonical: cale },
    openGraph: {
      type: "website",
      url: urlAbsolut(cale),
      title: p.nume,
      description: descriere,
      images: p.imagine ? [{ url: p.imagine.url, alt: p.imagine.alt ?? p.nume }] : undefined,
    },
  };
}

export default async function PaginaProdus({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Cele două pleacă odată: perioada nu depinde de produs, iar înlănțuite ar
  // aduna două drumuri până la WordPress în randarea paginii.
  const [p, perioada] = await Promise.all([
    incarcaProdus(slug),
    incarcaPerioadaCatalog(),
  ]);
  if (!p) notFound();

  const cale = `/catalog/produs/${slug}`;
  const caleCategorie = p.categorie ? `/catalog/${p.categorie.slug}` : "/catalog";

  /* ── Datele structurate ale fișei ─────────────────────────────────────────
     Aici se joacă testul. Căutările după cod exact („SUN-10K-SG05LP3-EU-SM2
     preț") sunt majoritatea căutărilor din domeniu, iar Google le răspunde cu
     pagina care declară explicit codul, prețul și disponibilitatea.

     Măsurat pe solarone.ro: fișele lor au availability și brand, dar NU au
     nici gtin, nici mpn. Noi avem codul producătorului pe fiecare produs, din
     catalog — îl declarăm ca `mpn` și ca `sku`.

     GTIN lipsește și la noi, fiindcă nu există nicăieri în date. Nu se
     inventează: un GTIN greșit e motiv de respingere în Merchant Center.

     `curata()` scoate orice câmp fără valoare, deci un produs fără preț sau
     fără disponibilitate produce o schemă mai scurtă, nu una cu câmpuri goale. */
  const schema = curata({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.nume,
        description: p.descriere,
        sku: p.sku,
        mpn: p.sku,
        image: p.imagine?.url,
        brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
        offers: p.pret
          ? {
              "@type": "Offer",
              url: urlAbsolut(cale),
              price: p.pret,
              priceCurrency: "EUR",
              // Catalogul e B2B: prețurile sunt fără TVA. Declarat explicit, ca
              // Google să nu presupună că e prețul final de raft.
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: p.pret,
                priceCurrency: "EUR",
                valueAddedTaxIncluded: false,
              },
              priceValidUntil: dataIso(perioada?.pana),
              availability: disponibilitateSchema(p.disponibilitate),
              seller: { "@type": "Organization", name: NUME_SITE },
            }
          : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Catalog", item: urlAbsolut("/catalog") },
          p.categorie
            ? {
                "@type": "ListItem",
                position: 2,
                name: p.categorie.nume,
                item: urlAbsolut(caleCategorie),
              }
            : undefined,
          {
            "@type": "ListItem",
            position: p.categorie ? 3 : 2,
            name: p.nume,
            item: urlAbsolut(cale),
          },
        ].filter(Boolean),
      },
    ],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      <FisaProdus p={p} perioada={perioada} />
    </>
  );
}
