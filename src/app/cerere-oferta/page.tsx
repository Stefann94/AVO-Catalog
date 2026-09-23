import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import FormularOferta from "@/components/FormularOferta";
import { SUPRAFATA } from "@/components/stiluri";
import { FIRMA, urlAbsolut } from "@/lib/site";

/**
 * Cerere de ofertă.
 *
 * A treia pagină din linkurile care răspundeau cu 404 — și cea mai costisitoare
 * dintre ele: butonul principal al hero-ului de pe prima pagină duce aici.
 * Fiecare vizitator care apăsa „Cere ofertă B2B" ajungea într-o pagină de
 * eroare.
 *
 * Cum funcționează formularul și de ce deschide e-mailul în loc să trimită
 * singur: vezi components/FormularOferta.tsx.
 */

const TITLU = "Cerere de ofertă";
const DESCRIERE =
  "Trimite lista de produse și cantitățile, iar răspunsul vine cu prețul aplicabil și disponibilitatea la momentul cererii.";

export const metadata: Metadata = {
  title: TITLU,
  description: DESCRIERE,
  alternates: { canonical: "/cerere-oferta" },
  openGraph: { type: "website", url: urlAbsolut("/cerere-oferta"), title: TITLU, description: DESCRIERE },
};

export default function PaginaCerereOferta() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-[calc(var(--inaltime-navbar)+2rem)] lg:pt-[calc(var(--inaltime-navbar)+3rem)] pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <h1 className="text-[26px] sm:text-[34px] lg:text-[40px] font-extrabold text-gray-900 leading-tight">
          {TITLU}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-600">
          Scrie-ne ce produse îți trebuie și în ce cantitate. Prețul de catalog e
          afișat pe fiecare fișă; oferta îl completează cu prețul aplicabil
          cantității cerute și cu disponibilitatea din acel moment.
        </p>

        <div aria-hidden className="mt-5 sm:mt-7 h-px w-full bg-gray-200" />

        <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div className={`${SUPRAFATA} lg:col-span-2 p-5 sm:p-7`}>
            <FormularOferta />
          </div>

          <aside className="flex flex-col gap-6">
            <div className={`${SUPRAFATA} p-5 sm:p-7`}>
              <h2 className="text-[17px] font-bold text-gray-900">Preferi direct?</h2>
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href={`tel:${FIRMA.telefon}`}
                  className="flex items-center gap-3 text-[15px] font-semibold text-gray-900 transition-colors hover:text-avo-700"
                >
                  <Phone size={17} className="shrink-0 text-avo-600" aria-hidden />
                  {FIRMA.telefonAfisat}
                </a>
                <a
                  href={`mailto:${FIRMA.email}`}
                  className="flex items-center gap-3 break-all text-[15px] font-semibold text-gray-900 transition-colors hover:text-avo-700"
                >
                  <Mail size={17} className="shrink-0 text-avo-600" aria-hidden />
                  {FIRMA.email}
                </a>
              </div>
            </div>

            <div className={`${SUPRAFATA} p-5 sm:p-7`}>
              <h2 className="text-[17px] font-bold text-gray-900">Ce grăbește răspunsul</h2>
              <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-gray-600">
                <li>codul produsului, de pe fișă;</li>
                <li>cantitatea — de ea depinde prețul;</li>
                <li>termenul până la care îți trebuie;</li>
                <li>localitatea de livrare.</li>
              </ul>
              <Link
                href="/catalog"
                className="mt-4 block text-[13px] font-semibold text-avo-700 transition-colors hover:text-avo-800"
              >
                Deschide catalogul
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
