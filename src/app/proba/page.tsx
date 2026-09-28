import type { Metadata } from "next";
import { incarcaToateProdusele } from "@/lib/produs";
import { incarcaBaraFiltre } from "@/lib/panou";
import Antet from "@/components/proba/Antet";
import BaraCategorii from "@/components/proba/BaraCategorii";
import Hero from "@/components/proba/Hero";
import "@/components/proba/proba.css";

/* ══════════════════════════════════════════════════════════════════════════
   PAGINA DE PROBĂ
   ──────────────────────────────────────────────────────────────────────────
   Antetul, bara de categorii și hero-ul, refăcute după prototipul
   Projects/Solarone.ro. Stau aici, nu pe prima pagină, din două motive:

     1. Se compară. Deschizi /proba și / una lângă alta și vezi diferența,
        fără să fie nevoie să dai ceva înapoi dacă nu-ți place.
     2. Nimic nepregătit nu ajunge online. Când e bun, se mută în layout și
        în prima pagină — o modificare, un singur push. Contează, fiindcă
        fiecare publicare ține 18–25 de minute.

   `noindex`: e o pagină de lucru. Ar fi conținut dublat cu prima pagină, pe
   un site care tocmai a scăpat de o problemă de dublare (admin.avogrupinvest
   servea tot magazinul, indexabil).
   ══════════════════════════════════════════════════════════════════════════ */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Probă de design — Avo Grup Invest" },
  description: "Pagină de lucru: antet, bară de categorii și hero.",
  robots: { index: false, follow: false },
};

export default async function Proba() {
  const [produse, bara] = await Promise.all([incarcaToateProdusele(), incarcaBaraFiltre()]);

  const lichidare = bara.stari.find((s) => s.slug === "lichidare-stoc")?.produse ?? 0;

  return (
    /* `.pb` ține toate variabilele de culoare și ascunde bara veche. Tot ce e
       dedesubt e replica; nimic din ea nu scapă în restul site-ului. */
    <div className="pb">
      <Antet />
      <BaraCategorii categorii={bara.categorii} />
      <Hero produse={produse} lichidare={lichidare} />
    </div>
  );
}
