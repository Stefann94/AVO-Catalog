import type { Metadata } from "next";
import HeroCatalog from "@/components/catalog/HeroCatalog";
import MeniuCategorii from "@/components/catalog/MeniuCategorii";
import { incarcaBaraFiltre } from "@/lib/panou";
import { incarcaToateProdusele } from "@/lib/produs";
import { incarcaOferte } from "@/lib/oferte";
import { incarcaPerioadaCatalog } from "@/lib/perioada";
import ProduseCuFile from "@/components/acasa/ProduseCuFile";
import Marci from "@/components/acasa/Marci";
import LichidareStoc from "@/components/LichidareStoc";
import ConditiiB2B from "@/components/ConditiiB2B";
import { urlAbsolut } from "@/lib/site";

/**
 * Pagina e prerandată static, iar perioada catalogului vine acum din WooCommerce.
 * Regenerarea periodică e ce face ca o schimbare făcută acolo să ajungă pe site
 * fără un nou deploy.
 *
 * Valoarea era 86400 (o zi), dar nu avea efect: Next reține cel mai scurt
 * interval dintre segment și interogările din el, iar `fetchGraphQL`
 * revalidează la o oră. Build-ul raporta deja `1h` pentru ruta asta. O
 * declarăm ca atare, ca să nu pară că pagina se împrospătează mai rar decât o
 * face.
 */
export const revalidate = 3600;

/**
 * Prima pagină avea titlul moștenit din layout, identic cu al catalogului și
 * al celor 27 de categorii. Acum are titlul ei, scris pentru ce caută lumea
 * („distribuitor panouri fotovoltaice”), și canonical propriu.
 *
 * `title.absolute` ocolește șablonul din layout: pe prima pagină, numele
 * firmei e deja în titlu, iar „… — Avo Grup Invest" l-ar repeta.
 */
export const metadata: Metadata = {
  title: {
    absolute: "Avo Grup Invest — distribuitor panouri fotovoltaice, invertoare și baterii",
  },
  description:
    "Distribuitor de echipamente fotovoltaice pentru instalatori și revânzători: panouri, invertoare hibride, acumulatori LiFePO4 și structuri de montaj, cu preț de distribuitor.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: urlAbsolut("/"),
    title: "Avo Grup Invest — distribuitor echipamente fotovoltaice",
    description:
      "Panouri, invertoare, acumulatori și structuri de montaj, la preț de distribuitor.",
  },
};

export default async function Home() {
  // În paralel: n-au nicio dependență între ele. Aceleași două încărcări pe care
  // le face și /catalog pentru același banner.
  const [perioada, oferte, bara, toateProdusele] = await Promise.all([
    incarcaPerioadaCatalog(),
    incarcaOferte(),
    incarcaBaraFiltre(),
    incarcaToateProdusele(),
  ]);

  return (
    /* ══════════════════════════════════════════════════════════════════════
       O SINGURĂ COLOANĂ, DE SUS PÂNĂ JOS
       ──────────────────────────────────────────────────────────────────────
       Fiecare secțiune de dedesubt își pune conținutul într-un `.coloana`
       (globals.css): 1200px lățime maximă, centrat, cu 16/24/32px de spațiu
       pe laturi. Fundalurile rămân pe toată lățimea ferestrei, conținutul nu.

       AICI AU STAT TREI COMPONENTE CARE TRĂIAU ÎN AFARA COLOANEI:

         BaraFiltre ..... cuprinsul catalogului, în marja din stânga
         BaraReclame .... coloana de reclame, în marja din dreapta
         ReclamaPytes ... reclama înaltă de lângă lichidare

       Se afișau doar de la 1760px în sus, așezate cu calcule din `100vw`.
       Ieșite pe 28.09.2026, odată cu trecerea la o singură coloană. Fișierele
       sunt în arhiva/componente/, cu tot cu motivul — vezi arhiva/README.md.
       ══════════════════════════════════════════════════════════════════════ */
    <div className="flex min-h-screen flex-col bg-slate-50 pt-(--inaltime-navbar)">
      {/* ── Bannerul: ofertele lunii ──
          Același component ca în capul paginii /catalog.

          A ÎNLOCUIT hero-ul cu videouri și banda de branduri, șterse la cerere.
          Ocupau un ecran întreg cu 3 MB de filmări de stoc care arătau case
          rezidențiale — un mesaj care nu spunea nimic despre distribuție — în
          timp ce bannerul ăsta arată marfă, coduri și prețuri reale.

          Amândouă rămân în istoricul git dacă vor fi vreodată nevoie. */}
      <HeroCatalog eticheta={perioada.eticheta} oferte={oferte} />

      {/* ── Rândul de categorii ──
          Același component ca pe /catalog, cu aceleași date. Prima pagină și
          catalogul au aceeași intrare în marfă. */}
      <MeniuCategorii categorii={bara.categorii} produse={toateProdusele} />

      {/* Produsele, pe file: „Oferte" plus cele mai mari categorii. */}
      <ProduseCuFile oferte={oferte} produse={toateProdusele} />

      {/* Lichidare de stoc — banda derulantă cu săgeți. */}
      <LichidareStoc />

      {/* Mărcile din catalog — perete de sigle cu numărul de produse. */}
      <Marci />

      {/* Condițiile B2B — ultima secțiune înainte de footer, și ultima din
          ordinea firească a paginii: întâi „ce acoperim", apoi „ce e bun luna
          asta", abia apoi „în ce condiții cumperi".

          Vine după prețuri, nu înaintea lor, fiindcă răspunde la o întrebare
          pe care cineva și-o pune DUPĂ ce a văzut o cifră: „ăsta e prețul meu
          sau se mai mișcă?". Pusă deasupra, ar explica reduceri la prețuri pe
          care vizitatorul nu le-a văzut încă. */}
      <ConditiiB2B />
    </div>
  );
}
