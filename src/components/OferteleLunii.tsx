import { incarcaPerioadaCatalog } from "@/lib/perioada";
import { incarcaOferte } from "@/lib/oferte";
import type { CSSProperties } from "react";
import { dimensiuneTitluSectiune } from "./stiluri";
import CardOferta from "./oferte/CardOferta";

/**
 * Ofertele lunii — produsele de pe pagina „OFERTELE LUNII" a catalogului.
 *
 * ─── DE CE E O SECȚIUNE NOUĂ ──────────────────────────────────────────────
 *
 * Numele ăsta l-a purtat banda derulantă de deasupra, care arăta o selecție
 * calculată de noi (cea mai mare economie la prețul de volum). Banda a devenit
 * „Lichidare de stoc" (LichidareStoc.tsx), iar ofertele au coborât aici cu o
 * secțiune, luate de unde le pune furnizorul: pagina 2 a catalogului, patru
 * produse marcate „OFERTĂ". Importatorul le trimite în WooCommerce cu
 * `Is featured? = 1`, iar `incarcaOferte()` le citește de acolo.
 *
 * ─── DE CE E ATÂT DE SIMPLĂ ───────────────────────────────────────────────
 *
 * Deocamdată doar titlu și produse, la cerere. Fără subtitlu, ștampilă de
 * perioadă sau subsol — se adaugă când se decide ce spun. Ce există nu
 * inventează nimic: titlul, grila și cardul sunt ale secțiunilor vecine.
 *
 *   titlu ..... aceeași rețetă ca la „Gama de produse" și „Lichidare de stoc":
 *               corpul din etalonul comun, 800, gray-900
 *   grilă ..... 1 / 2 / 4 coloane, gap-4 sm:gap-5 — patru produse încap pe un
 *               rând, deci o bandă cu săgeți n-ar avea ce derula
 *   card ...... CardOferta, același ca în bandă și pe pagina de lichidare
 *
 * ─── SPAȚIEREA ────────────────────────────────────────────────────────────
 *
 * Fără padding sus. Deasupra stă banda de lichidare, tot pe alb, cu 64/80px
 * dedesubt; un padding propriu aici ar fi dublat golul dintre două secțiuni pe
 * care nu le desparte nicio culoare. Jos rămâne rețeta benzii (64 / 80px),
 * fiindcă dedesubt vine tăietura spre fundalul închis al condițiilor B2B.
 */
export default async function OferteleLunii() {
  // În paralel: n-au nicio dependență între ele. Perioada e memoizată cu
  // `cache`, deci aceeași cerere pe care o face și banda de deasupra.
  const [perioada, lista] = await Promise.all([
    incarcaPerioadaCatalog(),
    incarcaOferte(),
  ]);

  // Fără oferte, fără secțiune: un titlu peste o grilă goală n-ar livra nimic.
  if (lista.length === 0) return null;

  const titlu = `Ofertele lunii${perioada.eticheta ? ` ${perioada.eticheta}` : ""}`;

  return (
    /* `id` pentru butonul „Vezi ofertele" din bannerul paginii /catalog
       (components/catalog/HeroCatalog.tsx). `scroll-mt` coboară oprirea sub
       bara fixă, altfel titlul ar ajunge ascuns sub ea. */
    <section id="ofertele-lunii" className="scroll-mt-(--inaltime-navbar) bg-white pb-16 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div
          className="@container mb-8 sm:mb-10"
          style={{ "--dim-titlu": dimensiuneTitluSectiune() } as CSSProperties}
        >
          <h2 className="text-[26px] sm:text-[length:var(--dim-titlu)] sm:whitespace-nowrap font-extrabold text-gray-900 leading-tight">
            {titlu}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-5">
          {lista.map((o) => (
            <CardOferta key={o.sku} o={o} oferta />
          ))}
        </div>
      </div>
    </section>
  );
}
