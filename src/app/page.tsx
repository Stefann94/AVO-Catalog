import HeroSlider from "@/components/HeroSlider";
import BandaBranduri from "@/components/BandaBranduri";
import GamaProduse from "@/components/GamaProduse";
import OferteleLunii from "@/components/OferteleLunii";
import ConditiiB2B from "@/components/ConditiiB2B";
import BaraFiltre from "@/components/BaraFiltre";

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

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/*
        Hero-ul și plinta lui ocupă împreună exact un ecran, la prima
        deschidere și la reîncărcare.

        Unitatea e `svh`, nu `vh`. Pe telefon `100vh` înseamnă înălțimea
        ferestrei FĂRĂ barele browserului, deci la prima randare — când bara
        de adrese e vizibilă — banda ar cădea sub marginea de jos, exact ce
        trebuie evitat. `svh` e înălțimea cu barele vizibile, adică starea de
        la prima interacțiune. `dvh` s-ar recalcula în timp ce derulezi și ar
        face pagina să tresară sub deget.

        Hero-ul primește `flex-1`, banda `shrink-0`: banda își cere înălțimea
        ei, hero-ul ia tot restul, pe orice ecran.
      */}
      <div className="flex h-[100svh] flex-col">
        <HeroSlider />
        <BandaBranduri />
      </div>

      {/*
        ÎNVELIȘUL CARE MĂRGINEȘTE BARA DE FILTRE.

        Cuprinde EXACT o secțiune, „Gama de produse", și de aici își ia bara
        ambele capete: pornește din dreptul titlului „Categoriile principale…" și
        se oprește unde se termină secțiunea, adică înainte de „Ofertele lunii".

        E doar `relative` — fără lățime, fără padding, fără fundal. Secțiunea
        dinăuntru rămâne exact ce era, pe toată lățimea, cu aceeași grilă de
        patru coloane și aceleași margini. Nimic nu se îngustează.

        Dacă bara ar trebui vreodată să însoțească și secțiunile următoare,
        singura modificare e să le mutăm în acest `div`. Nimic altceva.
      */}
      <div className="relative">
        {/* Cuprinsul catalogului, în marja liberă din stânga. Apare de la 1760px
            în sus, unde marja lăsată de `max-w-7xl` e destul de lată cât s-o
            țină fără să atingă conținutul. Calculul e în globals.css. */}
        <BaraFiltre />

        {/* Gama de produse — categorii agregate din catalog, cu perioada din WooCommerce */}
        <GamaProduse />
      </div>

      {/* Ofertele lunii — produsele de pe coperta catalogului, sub gama de
          produse: întâi „ce acoperim", apoi „ce e bun luna asta". */}
      <OferteleLunii />

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
