import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FisaProdus from "@/components/produs/FisaProdus";
import { incarcaProdus, sluguriProduse } from "@/lib/produs";
import { incarcaPerioadaCatalog } from "@/lib/perioada";

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

  return {
    title: `${p.nume} — Avo Grup Invest`,
    description: bucati.length ? bucati.join(" · ") : p.nume,
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

  return <FisaProdus p={p} perioada={perioada} />;
}
