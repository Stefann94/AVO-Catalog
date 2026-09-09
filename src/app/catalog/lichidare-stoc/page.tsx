import Link from "next/link";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { BUTON_PLIN, dimensiuneTitluSectiune } from "@/components/stiluri";
import CardOferta from "@/components/oferte/CardOferta";
import { incarcaLichidareStoc } from "@/lib/oferte";
import { incarcaPerioadaCatalog } from "@/lib/perioada";
import type { CSSProperties } from "react";

/**
 * Lichidare de stoc — pagina celor 15 produse.
 *
 * ─── DE CE EXISTĂ ─────────────────────────────────────────────────────────
 *
 * Bara de filtre din stânga arăta „Lichidare stoc — 15" îngroșat, cu pastilă
 * închisă, adică marcat ca fiind cel mai important rând din tot panoul. Și nu
 * ducea nicăieri. Era singura cifră din site care chema la clic fără să aibă
 * unde duce, iar comentariul din BaraFiltre.tsx explica de ce: nu exista o
 * pagină care să filtreze după disponibilitate. Acum există.
 *
 * ─── DE CE E RUTĂ PROPRIE, NU UN FILTRU PE `/catalog` ─────────────────────
 *
 * `/catalog/lichidare-stoc` e un segment static, iar Next îi dă precedență în
 * fața rutei `[...categorie]` de alături — deci nu se ciocnesc, deși arată ca
 * o categorie. Alegerea nu e doar tehnică: o pagină cu adresă proprie se poate
 * da mai departe pe WhatsApp unui client, se poate pune în newsletter și se
 * indexează. Un filtru trecut prin query string n-ar fi făcut niciuna.
 *
 * ─── DE CE FOLOSEȘTE CARDUL DE LA „OFERTELE LUNII" ────────────────────────
 *
 * Fiindcă e același obiect: produs cu preț, preț de volum și stare de stoc.
 * Cardul acela are deja badge-ul „Lichidare stoc" desenat pe fotografie —
 * ceea ce pe pagina asta e redundant, dar inofensiv, și mult mai ieftin decât
 * un al doilea desen de card. Site-ul are deja două desene pentru același
 * produs, între cele două pagini de catalog; nu adăugăm al treilea.
 */

export const revalidate = 3600;

export const metadata = {
  title: "Lichidare de stoc — Avo Grup Invest",
  description:
    "Produsele scoase la lichidare din catalogul curent, cu prețul de listă și pragul de volum.",
};

const TITLU = "Lichidare de stoc";

export default async function PaginaLichidareStoc() {
  // Cele două pleacă odată: n-au nicio dependență între ele.
  const [lista, perioada] = await Promise.all([
    incarcaLichidareStoc(),
    incarcaPerioadaCatalog(),
  ]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-[calc(var(--inaltime-navbar)+2rem)] lg:pt-[calc(var(--inaltime-navbar)+3rem)] pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <Link
          href="/catalog"
          className="mb-6 inline-flex items-center gap-2 text-[13px] font-semibold text-gray-600 transition-colors hover:text-avo-700"
        >
          <ArrowLeft size={15} className="shrink-0" />
          Catalog
        </Link>

        {/* Masthead-ul e cel al secțiunilor de pe prima pagină: titlu la stânga,
            ștampila perioadei la dreapta, linie de 1px dedesubt. Nu e o alegere
            de stil, e ce face ca pagina să citească drept parte din aceeași
            publicație, nu ca un listing lipit alături. */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 xl:gap-6">
          <div
            className="@container min-w-0 flex-1"
            style={{ "--dim-titlu": dimensiuneTitluSectiune() } as CSSProperties}
          >
            <h1 className="text-[26px] sm:text-[length:var(--dim-titlu)] font-extrabold text-gray-900 leading-tight">
              {TITLU}
            </h1>
          </div>

          {perioada.interval ? (
            <div className="inline-flex items-center gap-3 shrink-0 self-start xl:self-auto h-10 sm:h-11 px-4 rounded-lg bg-white border border-gray-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                Prețuri valabile
              </span>
              <span aria-hidden className="h-4 w-px bg-gray-200" />
              <span className="text-xs sm:text-[13px] font-semibold text-gray-900 whitespace-nowrap">
                {perioada.interval}
              </span>
            </div>
          ) : null}
        </div>

        <p className="mt-4 max-w-2xl text-[14px] text-gray-600 leading-relaxed">
          Produse scoase la lichidare din ediția curentă a catalogului. Cantitățile
          sunt limitate, iar disponibilitatea se confirmă la plasarea comenzii.
        </p>

        <div aria-hidden className="mt-5 sm:mt-7 h-px w-full bg-gray-200" />

        {lista.length === 0 ? (
          /* Fără produse nu inventăm o pagină goală cu un titlu promițător.
             Starea goală spune ce s-a întâmplat și oferă drumul înapoi. */
          <div className="mt-10 flex flex-col items-center rounded-xl bg-white px-6 py-14 text-center ring-1 ring-gray-200">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-avo-50 text-avo-600">
              <PackageSearch size={22} />
            </span>
            <p className="mb-1.5 text-[15px] font-semibold text-gray-900">
              Nu sunt produse la lichidare în ediția curentă
            </p>
            <p className="max-w-md text-[13px] leading-relaxed text-gray-600">
              Lista se reface la fiecare catalog lunar. Până atunci, restul
              produselor sunt în catalogul complet.
            </p>
            <Link href="/catalog" className={`${BUTON_PLIN} mt-6`}>
              Vezi catalogul complet
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-6 text-[13px] text-gray-600">
              {lista.length} {lista.length === 1 ? "produs" : "produse"}
            </p>

            {/* Aceeași grilă ca la „Ofertele lunii" pe lățimi mari, dar cu patru
                coloane de la `xl` în loc de bandă derulantă: aici lista e
                destinația, nu un rezumat, deci se vede toată deodată. */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
              {lista.map((o) => (
                <CardOferta key={o.sku} o={o} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
