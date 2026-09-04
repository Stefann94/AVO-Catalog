import HeroSlider from "@/components/HeroSlider";
import BandaBranduri from "@/components/BandaBranduri";
import GamaProduse from "@/components/GamaProduse";
import OferteleLunii from "@/components/OferteleLunii";

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

      {/* Gama de produse — categorii agregate din catalog, cu perioada din WooCommerce */}
      <GamaProduse />

      {/* Ofertele lunii — produsele de pe coperta catalogului, sub gama de
          produse: întâi „ce acoperim", apoi „ce e bun luna asta". */}
      <OferteleLunii />
    </div>
  );
}
