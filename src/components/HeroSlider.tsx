"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, Leaf, Award } from "lucide-react";

const slides = [
  {
    videoSrc: "/videos/deye.mp4",
    imageSrc: "/images/deye-inverter.png",
    badge: "Partener Oficial",
    title: "Distribuitor Autorizat Deye",
    subtitle: "Invertoare hibride și soluții de stocare de înaltă performanță pentru aplicații rezidențiale și industriale.",
    buttonText: "Vezi Produsele Deye",
    buttonLink: "/catalog"
  },
  {
    videoSrc: "/videos/aiko.mp4",
    imageSrc: "/images/aiko-panel.png",
    badge: "Top Performanță",
    title: "Eficiență Redefinită: Aiko Solar",
    subtitle: "Tehnologia ABC (All Back Contact) pentru cel mai mare randament la nivel global. Putere maximă pe m².",
    buttonText: "Descoperă Aiko",
    buttonLink: "/catalog"
  },
  {
    videoSrc: "/videos/solar.mp4",
    imageSrc: "/images/solar-system.png",
    badge: "Calitate Garantată",
    title: "Sisteme Fotovoltaice Complete",
    subtitle: "Soluții integrate la cheie pentru eficiență energetică și independență maximă, la prețuri de importator.",
    buttonText: "Cere Ofertă B2B",
    buttonLink: "/cerere-oferta"
  }
];

export default function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 8000); // Change slide every 8 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden bg-slate-900">
      {/* Videos */}
      {slides.map((slide, index) => (
        <div 
          key={index} 
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out z-0 ${index === activeIndex ? "opacity-100" : "opacity-0"}`}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="object-cover object-center w-full h-full"
            src={slide.videoSrc}
          />
        </div>
      ))}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/30 z-10" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-[1800px] mx-auto px-6 lg:px-16 xl:px-24 pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Text */}
          <div className="lg:col-span-7 max-w-2xl">
            <div 
              key={`badge-${activeIndex}`}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/40 border border-slate-600/50 backdrop-blur-md mb-6 animate-[fadeInUp_0.5s_ease-out_forwards]"
            >
              <Award size={14} className="text-blue-400" />
              <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">{slides[activeIndex].badge}</span>
            </div>
            
            <div className="min-h-[220px]">
              <h1 
                key={`title-${activeIndex}`}
                className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6 animate-[fadeInUp_0.5s_ease-out_forwards]"
              >
                {slides[activeIndex].title}
              </h1>
              <p 
                key={`subtitle-${activeIndex}`}
                className="text-lg md:text-xl text-slate-300 mb-10 font-light animate-[fadeInUp_0.5s_ease-out_0.2s_forwards] opacity-0"
              >
                {slides[activeIndex].subtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={slides[activeIndex].buttonLink} className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
                {slides[activeIndex].buttonText} <ArrowRight size={18} />
              </Link>
              <Link href="/contact" className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border border-white/20 transition-all hover:border-white/40">
                Contactează-ne
              </Link>
            </div>

            {/* Dots Indicator */}
            <div className="flex items-center gap-3 mt-16">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-500 bg-white/20 ${index === activeIndex ? "w-24" : "w-8 hover:bg-white/40"}`}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {index === activeIndex && (
                    <div 
                      className="absolute top-0 left-0 h-full bg-blue-500" 
                      style={{ animation: "fillProgress 8s linear forwards" }} 
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Features Stack */}
          <div className="hidden lg:flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
            {/* Feature 1 */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-2xl flex items-center gap-4 hover:bg-slate-900/60 transition-colors cursor-default animate-[fadeInUp_0.6s_ease-out_0.3s_forwards] opacity-0">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Eficiență Maximă</h3>
                <p className="text-sm text-slate-400">Echipamente cu randament dovedit.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-2xl flex items-center gap-4 hover:bg-slate-900/60 transition-colors cursor-default animate-[fadeInUp_0.6s_ease-out_0.4s_forwards] opacity-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Garanție Premium</h3>
                <p className="text-sm text-slate-400">Suport tehnic și garanție extinsă.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-2xl flex items-center gap-4 hover:bg-slate-900/60 transition-colors cursor-default animate-[fadeInUp_0.6s_ease-out_0.5s_forwards] opacity-0">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Leaf size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Energie Verde</h3>
                <p className="text-sm text-slate-400">Sustenabilitate la standarde înalte.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
