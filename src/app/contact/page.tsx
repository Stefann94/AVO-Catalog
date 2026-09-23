import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone, Truck } from "lucide-react";
import { BUTON_PLIN, SUPRAFATA } from "@/components/stiluri";
import { FIRMA, urlAbsolut } from "@/lib/site";

/**
 * Pagina de contact.
 *
 * ─── DE CE EXISTĂ ─────────────────────────────────────────────────────────
 *
 * Era linkuită din bara de sus, din hero și din subsol — de pe fiecare pagină
 * a site-ului — și răspundea cu 404. Pentru un vizitator e drumul cel mai
 * scurt spre o comandă; pentru Google, un link intern rupt pe toate paginile.
 *
 * ─── DE CE N-ARE FORMULAR (ÎNCĂ) ──────────────────────────────────────────
 *
 * Un formular are nevoie de un server care trimite e-mailul. Site-ul e
 * generat static, iar WordPress-ul nu expune deocamdată nicio rută de
 * formular. Un formular care pare că trimite, dar nu trimite, e mai rău decât
 * lipsa lui: cererea clientului se pierde fără ca nimeni să afle.
 *
 * Până atunci, pagina dă exact drumurile care funcționează azi: telefon,
 * e-mail și adresa. Datele sunt aceleași cu cele din subsol și de pe site-ul
 * actual al firmei.
 */

const TITLU = "Contact";
const DESCRIERE =
  "Telefon, e-mail și adresa AVO Grup Invest, distribuitor de echipamente fotovoltaice din Piatra-Neamț.";

export const metadata: Metadata = {
  title: TITLU,
  description: DESCRIERE,
  alternates: { canonical: "/contact" },
  openGraph: { type: "website", url: urlAbsolut("/contact"), title: TITLU, description: DESCRIERE },
};

/** Un rând de contact: iconiță, etichetă, valoarea (link, când are sens). */
function Rand({
  icon: Icon,
  eticheta,
  valoare,
  href,
  detaliu,
}: {
  icon: typeof Phone;
  eticheta: string;
  valoare: string;
  href?: string;
  detaliu?: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-avo-50 text-avo-600">
        <Icon size={18} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
          {eticheta}
        </p>
        {href ? (
          <a
            href={href}
            className="mt-1 block text-[16px] font-semibold text-gray-900 break-words transition-colors hover:text-avo-700"
          >
            {valoare}
          </a>
        ) : (
          <p className="mt-1 text-[16px] font-semibold text-gray-900 break-words">{valoare}</p>
        )}
        {detaliu ? <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{detaliu}</p> : null}
      </div>
    </div>
  );
}

export default function PaginaContact() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-[calc(var(--inaltime-navbar)+2rem)] lg:pt-[calc(var(--inaltime-navbar)+3rem)] pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <h1 className="text-[26px] sm:text-[34px] lg:text-[40px] font-extrabold text-gray-900 leading-tight">
          {TITLU}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-600">
          Pentru oferte, disponibilitate și condiții de partener, scrie-ne sau sună.
          Răspundem în timpul programului de lucru.
        </p>

        <div aria-hidden className="mt-5 sm:mt-7 h-px w-full bg-gray-200" />

        <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Datele de contact, în ordinea în care sunt folosite. */}
          <div className={`${SUPRAFATA} lg:col-span-2 p-5 sm:p-7`}>
            <div className="grid gap-6 sm:grid-cols-2">
              <Rand
                icon={Phone}
                eticheta="Telefon"
                valoare={FIRMA.telefonAfisat}
                href={`tel:${FIRMA.telefon}`}
              />
              <Rand
                icon={Mail}
                eticheta="E-mail"
                valoare={FIRMA.email}
                href={`mailto:${FIRMA.email}`}
                detaliu="Cereri de ofertă, condiții comerciale, disponibilitate."
              />
              <Rand
                icon={Truck}
                eticheta="Logistică și transport"
                valoare={FIRMA.emailTransport}
                href={`mailto:${FIRMA.emailTransport}`}
                detaliu="Livrări, ridicări din depozit, documente de transport."
              />
              <Rand
                icon={MapPin}
                eticheta="Adresă"
                valoare={FIRMA.adresaText}
                href={FIRMA.harta}
              />
            </div>
          </div>

          {/* Ce urmează, pentru cine a ajuns aici din catalog. */}
          <aside className={`${SUPRAFATA} p-5 sm:p-7`}>
            <h2 className="text-[17px] font-bold text-gray-900">Ai un produs în minte?</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
              Scrie-ne codul produsului și cantitatea, iar răspunsul vine cu prețul
              aplicabil și cu disponibilitatea la momentul cererii.
            </p>
            <a
              href={`mailto:${FIRMA.email}?subject=${encodeURIComponent("Cerere ofertă")}`}
              className={`${BUTON_PLIN} mt-5 w-full`}
            >
              Trimite o cerere
            </a>
            <Link
              href="/catalog"
              className="mt-4 block text-center text-[13px] font-semibold text-avo-700 transition-colors hover:text-avo-800"
            >
              Vezi catalogul de produse
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
