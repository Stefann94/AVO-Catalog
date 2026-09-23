import type { Metadata } from "next";
import Link from "next/link";
import { BUTON_PLIN, SUPRAFATA } from "@/components/stiluri";
import { FIRMA, urlAbsolut } from "@/lib/site";

/**
 * Despre noi.
 *
 * ─── DE UNDE VINE TEXTUL ──────────────────────────────────────────────────
 *
 * Din pagina „Despre Noi" a site-ului actual (avogrupinvest.ro/despre-noi),
 * rescrisă ca structură, nu ca formulare nouă: misiunea, abordarea și mărcile
 * pentru care firma se declară distribuitor oficial sunt afirmațiile ei, deja
 * publicate. Nu s-a adăugat nicio cifră și nicio calitate pe care firma să nu
 * le spună deja despre sine — o pagină „Despre noi" inventată e exact genul
 * de text pe care un client îl verifică și un motor de căutare îl ignoră.
 *
 * Lista de mărci stă în lib/site.ts, ca să nu se desincronizeze de subsol.
 */

const TITLU = "Despre noi";
const DESCRIERE =
  "AVO Grup Invest: importator și distribuitor de echipamente fotovoltaice premium pentru proiecte rezidențiale, comerciale și industriale.";

export const metadata: Metadata = {
  title: TITLU,
  description: DESCRIERE,
  alternates: { canonical: "/despre-noi" },
  openGraph: { type: "website", url: urlAbsolut("/despre-noi"), title: TITLU, description: DESCRIERE },
};

export default function PaginaDespreNoi() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-[calc(var(--inaltime-navbar)+2rem)] lg:pt-[calc(var(--inaltime-navbar)+3rem)] pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <h1 className="max-w-4xl text-[26px] sm:text-[34px] lg:text-[40px] font-extrabold leading-tight text-gray-900">
          Importator și distribuitor de echipamente fotovoltaice premium
        </h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-gray-600">
          AVO Grup Invest este un partener în domeniul energiei regenerabile, specializat
          în importul și distribuția de echipamente fotovoltaice pentru proiecte
          rezidențiale, comerciale și industriale.
        </p>

        <div aria-hidden className="mt-5 sm:mt-7 h-px w-full bg-gray-200" />

        <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-8">
          <section className={`${SUPRAFATA} p-5 sm:p-7`}>
            <h2 className="text-[17px] font-bold text-gray-900">Misiunea</h2>
            <p className="mt-2.5 text-[14px] leading-relaxed text-gray-600">
              Să livrăm partenerilor noștri echipamente fotovoltaice selectate riguros,
              care asigură performanță, fiabilitate și eficiență pe termen lung.
            </p>
          </section>

          <section className={`${SUPRAFATA} p-5 sm:p-7`}>
            <h2 className="text-[17px] font-bold text-gray-900">Cu cine lucrăm</h2>
            <p className="mt-2.5 text-[14px] leading-relaxed text-gray-600">
              Cu integratori, instalatori și dezvoltatori, pe relații de durată, cu
              soluții adaptate fiecărui proiect — fiecare sistem fotovoltaic are
              particularitățile lui.
            </p>
          </section>

          <section className={`${SUPRAFATA} p-5 sm:p-7`}>
            <h2 className="text-[17px] font-bold text-gray-900">Disponibilitate</h2>
            <p className="mt-2.5 text-[14px] leading-relaxed text-gray-600">
              Importul și distribuția sunt gestionate astfel încât echipamentele să fie
              disponibile atunci când proiectul are nevoie de ele.
            </p>
          </section>
        </div>

        {/* Mărcile: afirmația e a firmei, preluată din pagina de contact a
            site-ului actual. Scrise ca text, nu ca sigle, ca să nu sugereze o
            aprobare vizuală din partea producătorilor. */}
        <section className={`${SUPRAFATA} mt-6 p-5 sm:p-7 lg:mt-8`}>
          <h2 className="text-[17px] font-bold text-gray-900">Distribuitor oficial</h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-gray-600">
            AVO Grup Invest este distribuitor oficial pentru{" "}
            {FIRMA.distribuitorOficial.slice(0, -1).join(", ")} și{" "}
            {FIRMA.distribuitorOficial.at(-1)}.
          </p>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-10">
          <Link href="/catalog" className={BUTON_PLIN}>
            Vezi catalogul
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-[14px] font-semibold text-gray-900 transition-colors hover:border-gray-400"
          >
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
