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
import ReclamaPytes from "@/components/ReclamaPytes";
import ConditiiB2B from "@/components/ConditiiB2B";
import BaraFiltre from "@/components/BaraFiltre";
import BaraReclame from "@/components/BaraReclame";
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
    /* `pt-(--inaltime-navbar)` e nou: hero-ul de dinainte era `fixed`-friendly,
       începea sub bară prin construcție. Bannerul nu, deci pagina își coboără
       singură conținutul, exact ca /catalog. */
    <div className="flex flex-col min-h-screen bg-slate-50 pt-(--inaltime-navbar)">
      {/* ── Bannerul: ofertele lunii ──
          Același component ca în capul paginii /catalog.

          A ÎNLOCUIT hero-ul cu videouri și banda de branduri, șterse la cerere.
          Ocupau un ecran întreg cu 3 MB de filmări de stoc care arătau case
          rezidențiale — un mesaj care nu spunea nimic despre distribuție — în
          timp ce bannerul ăsta arată marfă, coduri și prețuri reale.

          Amândouă rămân în istoricul git dacă vor fi vreodată nevoie. */}
      <HeroCatalog eticheta={perioada.eticheta} oferte={oferte} />

      {/* ── Rândul de categorii, cu subcategoriile la hover ──
          Același component ca pe /catalog, cu aceleași date. Prima pagină și
          catalogul au acum aceeași intrare în marfă: cine ajunge pe oricare
          dintre ele vede imediat cele nouă categorii, nu trebuie să caute. */}
      <MeniuCategorii categorii={bara.categorii} produse={toateProdusele} />

      {/*
        ÎNVELIȘUL CARE MĂRGINEȘTE BARA DE FILTRE.

        Cuprinde EXACT o secțiune, și de aici își ia bara ambele capete:
        pornește din dreptul titlului ei și se oprește unde se termină.

        E doar `relative` — fără lățime, fără padding, fără fundal. Secțiunea
        dinăuntru rămâne pe toată lățimea, cu marginile ei. Nimic nu se
        îngustează.

        AICI A FOST „Gama de produse", rândul de carduri de categorii. A ieșit
        pe 28.09.2026: bara de categorii de deasupra spune același lucru, mai
        compact, iar două navigări pe categorii una sub alta e exact ce făcea
        pagina să pară că se învârte în loc. Bara de filtre a rămas, acum
        mărginind secțiunea de produse.
      */}
      <div className="relative">
        {/* Cuprinsul catalogului, în marja liberă din stânga. Apare de la 1760px
            în sus, unde marja lăsată de `max-w-7xl` e destul de lată cât s-o
            țină fără să atingă conținutul. Calculul e în globals.css. */}
        <BaraFiltre />

        {/* Coloana de reclame, în marja liberă din dreapta — oglinda barei de
            filtre, cu aceleași variabile și același prag de 1760px. */}
        <BaraReclame />

        {/* Produsele, pe file: „Oferte" plus cele mai mari categorii.
            Ține locul a două secțiuni de dinainte — grila de oferte și
            cardurile de categorii — fără să trimită JavaScript în browser. */}
        <ProduseCuFile oferte={oferte} produse={toateProdusele} />
      </div>

      {/* Lichidare de stoc — banda derulantă cu săgeți. A fost „Ofertele
          lunii", cu o selecție calculată; acum arată secțiunile „LICHIDARE
          STOC" din catalog, cu același design. */}
      {/* `relative` e reperul reclamei înalte din marja dreaptă: se așază
          față de secțiunea de lichidare, nu față de toată pagina. Același
          tipar ca învelișul de mai sus, al barei de filtre. */}
      <div className="relative">
        <ReclamaPytes />
        <LichidareStoc />
      </div>

      {/* Mărcile din catalog — perete de sigle cu numărul de produse.
          A ÎNLOCUIT „Ofertele lunii", secțiune care arăta exact aceleași patru
          produse ca bannerul din capul paginii și ca prima filă de mai sus.
          Ofertele apar acum o singură dată, acolo. */}
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
