import HeroSlider from "@/components/HeroSlider";
import GamaProduse from "@/components/GamaProduse";

/**
 * Pagina e prerandată static, deci `new Date()` din eticheta de perioadă s-ar
 * îngheța la momentul build-ului. Regenerarea zilnică ține luna corectă fără
 * să renunțăm la randarea statică.
 */
export const revalidate = 86400;

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <HeroSlider />

      {/* Gama de produse — categorii cu date agregate din catalogul Solar One 09.2026 */}
      <GamaProduse />
    </div>
  );
}
