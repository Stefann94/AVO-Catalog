import HeroSlider from "@/components/HeroSlider";
import GamaProduse from "@/components/GamaProduse";

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
      <HeroSlider />

      {/* Gama de produse — categorii agregate din catalog, cu perioada din WooCommerce */}
      <GamaProduse />
    </div>
  );
}
