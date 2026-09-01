import Image from "next/image";
import HeroSlider from "@/components/HeroSlider";
import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, Leaf } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <HeroSlider />

      {/* Quick Categories Bar */}
      <section className="relative z-30 -mt-12 max-w-[1400px] mx-auto px-6 lg:px-16 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Quick Cat 1 */}
          <Link href="/catalog?cat=panouri" className="group bg-gradient-to-br from-blue-50/90 to-cyan-50/90 backdrop-blur-2xl border border-blue-100/60 p-3 rounded-2xl shadow-xl shadow-blue-900/5 hover:from-blue-100/90 hover:to-cyan-100/90 transition-all flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
              <Image src="/panel.jpg" alt="Panouri" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Panouri Solare</h3>
              <span className="text-xs text-slate-500 font-medium">Canadian & Aiko</span>
            </div>
          </Link>

          {/* Quick Cat 2 */}
          <Link href="/catalog?cat=invertoare" className="group bg-gradient-to-br from-blue-50/90 to-cyan-50/90 backdrop-blur-2xl border border-blue-100/60 p-3 rounded-2xl shadow-xl shadow-blue-900/5 hover:from-blue-100/90 hover:to-cyan-100/90 transition-all flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
              <Image src="/inverter.jpg" alt="Invertoare" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Invertoare</h3>
              <span className="text-xs text-slate-500 font-medium">Deye & Growatt</span>
            </div>
          </Link>

          {/* Quick Cat 3 */}
          <Link href="/catalog?cat=stocare" className="group bg-gradient-to-br from-blue-50/90 to-cyan-50/90 backdrop-blur-2xl border border-blue-100/60 p-3 rounded-2xl shadow-xl shadow-blue-900/5 hover:from-blue-100/90 hover:to-cyan-100/90 transition-all flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
              <Image src="/battery.jpg" alt="Acumulatori" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Acumulatori</h3>
              <span className="text-xs text-slate-500 font-medium">Stocare Energie</span>
            </div>
          </Link>

          {/* Quick Cat 4 */}
          <Link href="/catalog?cat=accesorii" className="group bg-gradient-to-br from-blue-50/90 to-cyan-50/90 backdrop-blur-2xl border border-blue-100/60 p-3 rounded-2xl shadow-xl shadow-blue-900/5 hover:from-blue-100/90 hover:to-cyan-100/90 transition-all flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 opacity-20"></div>
               <span className="text-blue-600 font-bold text-lg">+</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Accesorii</h3>
              <span className="text-xs text-slate-500 font-medium">Montaj & Cabluri</span>
            </div>
          </Link>

        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">Gama de Produse</h2>
            <p className="text-slate-500 max-w-xl">Soluții complete pentru orice proiect fotovoltaic, de la rezidențial la parcuri solare industriale.</p>
          </div>
          <Link href="/catalog" className="hidden md:flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 hover:gap-3 transition-all">
            Toate produsele <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <Link href="/catalog/panouri" className="group relative h-96 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 block">
            <Image src="/panel.jpg" alt="Panouri Fotovoltaice" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-8">
              <span className="text-blue-300 text-sm font-bold uppercase tracking-wider mb-2 block">Premium</span>
              <h3 className="text-2xl font-bold text-white mb-2">Panouri Fotovoltaice</h3>
              <p className="text-slate-300 text-sm mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">Tehnologie N-Type TOPCon și bifaciale de înaltă eficiență.</p>
              <div className="inline-flex items-center gap-2 text-white font-medium text-sm border border-white/30 rounded-full px-4 py-2 bg-white/10 backdrop-blur-sm group-hover:bg-white group-hover:text-slate-900 transition-colors">
                Vezi Modelele
              </div>
            </div>
          </Link>

          {/* Card 2 */}
          <Link href="/catalog/invertoare" className="group relative h-96 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 block md:-translate-y-8">
            <Image src="/inverter.jpg" alt="Invertoare" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-8">
              <span className="text-emerald-300 text-sm font-bold uppercase tracking-wider mb-2 block">Hibrid & On-Grid</span>
              <h3 className="text-2xl font-bold text-white mb-2">Invertoare Inteligente</h3>
              <p className="text-slate-300 text-sm mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">Management superior al energiei pentru independență totală.</p>
              <div className="inline-flex items-center gap-2 text-white font-medium text-sm border border-white/30 rounded-full px-4 py-2 bg-white/10 backdrop-blur-sm group-hover:bg-white group-hover:text-slate-900 transition-colors">
                Vezi Modelele
              </div>
            </div>
          </Link>

          {/* Card 3 */}
          <Link href="/catalog/stocare" className="group relative h-96 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 block">
            <Image src="/battery.jpg" alt="Stocare Energie" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-8">
              <span className="text-cyan-300 text-sm font-bold uppercase tracking-wider mb-2 block">High Voltage</span>
              <h3 className="text-2xl font-bold text-white mb-2">Sisteme de Stocare</h3>
              <p className="text-slate-300 text-sm mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">Acumulatori LiFePO4 siguri, scalabili și de lungă durată.</p>
              <div className="inline-flex items-center gap-2 text-white font-medium text-sm border border-white/30 rounded-full px-4 py-2 bg-white/10 backdrop-blur-sm group-hover:bg-white group-hover:text-slate-900 transition-colors">
                Vezi Modelele
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
