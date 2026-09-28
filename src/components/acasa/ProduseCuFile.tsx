import Link from "next/link";
import Image from "next/image";
import type { Produs } from "@/lib/produs";
import type { Oferta } from "@/lib/oferte";
import { dimensiuneTitluSectiune } from "../stiluri";

/* ══════════════════════════════════════════════════════════════════════════
   PRODUSE, PE FILE
   ──────────────────────────────────────────────────────────────────────────
   O singură secțiune care ține locul a două: „Ofertele lunii" e prima filă,
   iar restul sunt categoriile mari. Înainte, prima pagină avea grila de oferte
   ȘI un rând de carduri de categorii — iar categoriile erau deja în bara de
   sub banner. Trei blocuri pentru două informații.

   ─── DE CE FĂRĂ JAVASCRIPT ───────────────────────────────────────────────

   Filele sunt `<input type="radio">` ascunse plus `<label>`, iar schimbarea
   panoului se face în CSS, cu `:has()` (vezi app/globals.css, „FILE DE
   PRODUSE"). Componenta se randează pe server și nu trimite nicio linie de
   JavaScript în browser.

   Motivul e același pentru care bara de sus a fost mutată pe server: pe fișa
   de produs, firul principal era ocupat 772 ms cu execuție de JS, iar imaginea
   principală aștepta după el. O secțiune de prima pagină n-are voie să adauge
   la socoteala aia pentru ceva ce CSS-ul face singur.

   Radio plus label e și navigabil de la tastatură din construcție — săgețile
   schimbă fila, fără să scriem noi nimic.

   ─── CE NU E PE CARD ──────────────────────────────────────────────────────

   Fără stele, fără „în stoc", fără rate lunare — le au magazinele de retail,
   dar noi n-avem datele: zero recenzii, iar coloana de stoc e goală la toate
   cele 845 de produse din export. Un card care le-ar afișa ar inventa.

   În locul lor stă ce avem și ce chiar contează la un distribuitor: CODUL
   produsului, pe care instalatorul îl caută, și PREȚUL LA VOLUM, care e
   diferența față de un magazin obișnuit.
   ══════════════════════════════════════════════════════════════════════════ */

/** Forma minimă pe care o afișează cardul. O satisfac și `Produs`, și `Oferta`. */
type Articol = {
  slug?: string;
  sku: string;
  nume: string;
  brand?: string;
  imagine?: { url: string; alt?: string };
  pret?: number;
  pretVolum?: number;
  prag?: string;
  unitate: string;
};

/** Câte produse arată o filă. Cinci intră pe un rând la 1280px. */
const PE_FILA = 5;

/** Câte categorii devin file, pe lângă „Oferte". */
const FILE_CATEGORII = 5;

const euro = (n: number) =>
  n.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function Card({ a }: { a: Articol }) {
  const adresa = a.slug ? `/catalog/produs/${a.slug}` : "/catalog";
  return (
    <Link
      href={adresa}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md hover:shadow-gray-900/5"
    >
      {/* Zona de imagine are înălțime fixă: fără ea, cardurile de pe un rând
          ies de înălțimi diferite, după cât de înaltă e fiecare fotografie. */}
      <div className="relative flex h-40 items-center justify-center bg-slate-50 p-4">
        {a.imagine ? (
          <Image
            src={a.imagine.url}
            alt={a.imagine.alt ?? a.nume}
            width={180}
            height={128}
            sizes="180px"
            loading="lazy"
            className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-xs text-slate-400">Fără imagine</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {a.brand ? (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {a.brand}
          </span>
        ) : null}

        {/* Două rânduri fixe, ca titlurile lungi să nu împingă prețul în jos
            și să strice alinierea rândului. */}
        <span className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
          {a.nume}
        </span>

        <span className="font-mono text-[11px] text-slate-400">{a.sku}</span>

        <div className="mt-auto pt-3">
          {typeof a.pret === "number" && a.pret > 0 ? (
            <>
              <span className="text-lg font-extrabold text-avo-600">{euro(a.pret)} €</span>
              <span className="text-xs text-slate-500"> / {a.unitate}</span>
              {a.pretVolum && a.prag ? (
                <div className="text-xs text-slate-500">
                  {euro(a.pretVolum)} € de la {a.prag}
                </div>
              ) : null}
            </>
          ) : (
            <span className="text-sm font-semibold text-slate-600">Preț la cerere</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProduseCuFile({
  oferte = [],
  produse = [],
}: {
  oferte?: Oferta[];
  produse?: Produs[];
}) {
  /* Categoriile, ordonate după câte produse au. Cele mici n-ar umple un rând,
     iar o filă cu două carduri arată a greșeală, nu a alegere. */
  const dupaCategorie = new Map<string, { nume: string; slug: string; produse: Produs[] }>();
  for (const p of produse) {
    if (!p.categorie) continue;
    const intrare = dupaCategorie.get(p.categorie.slug) ?? {
      nume: p.categorie.nume,
      slug: p.categorie.slug,
      produse: [],
    };
    intrare.produse.push(p);
    dupaCategorie.set(p.categorie.slug, intrare);
  }

  const file: { eticheta: string; adresa: string; articole: Articol[] }[] = [];

  if (oferte.length) {
    file.push({ eticheta: "Oferte", adresa: "/catalog", articole: oferte.slice(0, PE_FILA) });
  }

  for (const c of [...dupaCategorie.values()]
    .filter((c) => c.produse.length >= PE_FILA)
    .sort((a, b) => b.produse.length - a.produse.length)
    .slice(0, FILE_CATEGORII)) {
    file.push({
      eticheta: c.nume,
      adresa: `/catalog/${c.slug}`,
      articole: c.produse.slice(0, PE_FILA),
    });
  }

  if (file.length === 0) return null;

  return (
    <section className="bg-white py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <h2 className={`${dimensiuneTitluSectiune} font-extrabold text-gray-900`}>Produse</h2>

        <div className="file-produse mt-6">
          {/* Radio-urile, ascunse. Ele țin starea; CSS-ul citește care e bifat. */}
          {file.map((f, i) => (
            <input
              key={f.eticheta}
              type="radio"
              name="file-produse"
              id={`fila-${i}`}
              defaultChecked={i === 0}
            />
          ))}

          {/* Rândul de file. `overflow-x-auto` fiindcă pe telefon șase etichete
              nu încap: acolo se trag cu degetul, nu se rup pe două rânduri. */}
          <div className="fara-bara-derulare flex gap-1 overflow-x-auto border-b border-gray-200">
            {file.map((f, i) => (
              <label
                key={f.eticheta}
                htmlFor={`fila-${i}`}
                className="shrink-0 cursor-pointer whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:text-gray-900"
              >
                {f.eticheta}
              </label>
            ))}
          </div>

          {file.map((f, i) => (
            <div key={f.eticheta} data-fila={i} className="pt-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                {f.articole.map((a) => (
                  <Card key={a.sku} a={a} />
                ))}
              </div>

              <div className="mt-6">
                <Link
                  href={f.adresa}
                  className="inline-flex h-11 items-center rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-900 transition-colors hover:border-avo-600 hover:text-avo-600"
                >
                  Vezi tot {f.eticheta.toLowerCase()}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
