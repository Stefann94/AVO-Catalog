import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, Leaf } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.jpg"
            alt="Solar Panels at Sunset"
            fill
            priority
            className="object-cover object-center scale-105 animate-[slowZoom_20s_ease-in-out_infinite_alternate]"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/30 z-10" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 w-full px-6 lg:px-12 pt-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 backdrop-blur-md mb-6">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Catalog Echipamente B2B & B2C</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
              Soluții Solare <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Premium</span> pentru Viitor.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl font-light leading-relaxed">
              Explorează catalogul Avo Grup Invest. Panouri fotovoltaice, invertoare de ultimă generație și soluții de stocare la prețuri preferențiale pentru parteneri.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/catalog" className="px-8 py-4 bg-white text-slate-900 font-semibold rounded-full hover:bg-blue-50 hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-xl shadow-blue-900/20">
                Vezi Catalogul <ArrowRight size={18} />
              </Link>
              <Link href="/parteneri" className="px-8 py-4 bg-slate-800/60 backdrop-blur-md border border-slate-700 text-white font-semibold rounded-full hover:bg-slate-700/80 transition-all duration-300">
                Ofertă En-Gros
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="relative z-30 -mt-16 max-w-7xl mx-auto px-6 w-full">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-700">
          <div className="flex items-center gap-4 md:px-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Eficiență Maximă</h3>
              <p className="text-sm text-slate-400">Echipamente cu randament dovedit.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:px-4 pt-6 md:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Garanție Premium</h3>
              <p className="text-sm text-slate-400">Suport tehnic și garanție extinsă.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:px-4 pt-6 md:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Leaf size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Energie Verde</h3>
              <p className="text-sm text-slate-400">Sustenabilitate la standarde înalte.</p>
            </div>
          </div>
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
