import Image from "next/image";
import { BRANDURI } from "@/lib/branduri";
import { dimensiuneTitluSectiune } from "../stiluri";

/* ══════════════════════════════════════════════════════════════════════════
   MĂRCILE DIN CATALOG
   ──────────────────────────────────────────────────────────────────────────
   Un perete de sigle cu numărul de produse sub fiecare. Structura e preluată
   din prototipul Projects/Solarone.ro; culorile și datele sunt ale noastre.

   ─── DE CE NU SUNT LINKURI ───────────────────────────────────────────────

   Paginile de marcă există, dar sunt PER CATEGORIE:
   /catalog/panouri-fotovoltaice/brand-canadian-solar. Nu există o pagină
   globală pe marcă, deci o siglă n-are o singură țintă firească — Deye are
   produse în trei categorii deodată.

   Am fi putut trimite toate cele 17 către /catalog. N-am făcut-o: 17 linkuri
   care duc în același loc sunt mai rele decât niciunul, și pentru om, și
   pentru Google, care le citește ca navigație fără sens.

   URMĂTORUL PAS FIRESC e o pagină /branduri/<slug> cu toate produsele mărcii,
   indiferent de categorie. Atunci secțiunea asta devine 17 linkuri interne
   reale, iar fiecare marcă primește o pagină pe care o poate indexa.

   ─── CE NU SCRIE AICI ────────────────────────────────────────────────────

   Prototipul are subtitlul „Stoc propriu, garanție și service asigurate de
   noi". Nu l-am copiat: n-avem date de stoc, iar despre garanție și service
   nu ne-a confirmat nimeni nimic. Subtitlul de mai jos spune doar ce se poate
   număra.
   ══════════════════════════════════════════════════════════════════════════ */

/** Siglele colorate, pentru fundal deschis. Cele albe sunt pentru fundal închis. */
const sigla = (slug: string) => `/branduri/color/${slug}.webp`;

const produse = (n: number) =>
  `${n} ${n === 1 ? "produs" : n % 100 >= 20 || n % 100 === 0 ? "de produse" : "produse"}`;

export default function Marci() {
  const marci = [...BRANDURI].filter((b) => b.produse > 0).sort((a, b) => b.produse - a.produse);
  if (marci.length === 0) return null;

  return (
    <section className="bg-canvas py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <h2 className={`${dimensiuneTitluSectiune} font-extrabold text-fg`}>
          Mărcile din catalog
        </h2>
        <p className="mt-2 text-sm text-muted">
          {marci.length} de mărci, fiecare cu produsele ei în catalogul lunii.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {marci.map((b) => (
            <div
              key={b.slug}
              className="flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface px-4 py-6"
            >
              {/*
                `<img>` prin next/image cu înălțime fixă și lățime automată:
                siglele au lățimi foarte diferite la aceeași înălțime — K2 e un
                pătrat, Dyness e un wordmark lung — iar aici contează doar
                înălțimea, ca rândul să arate aliniat.
              */}
              <div className="flex h-8 w-full items-center justify-center">
                <Image
                  src={sigla(b.slug)}
                  alt={b.nume}
                  width={140}
                  height={32}
                  sizes="140px"
                  loading="lazy"
                  className="max-h-8 w-auto max-w-[70%] object-contain"
                />
              </div>
              <span className="text-xs text-faint">{produse(b.produse)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
