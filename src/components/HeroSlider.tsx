"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const slides = [
  {
    videoSrc: "/videos/deye.mp4",
    imageSrc: "/images/deye-inverter.png",
    badge: "Partener Oficial",
    title: "Distribuitor Autorizat Deye",
    subtitle: "Invertoare hibride și soluții de stocare de înaltă performanță pentru aplicații rezidențiale și industriale.",
    buttonText: "Vezi Produsele Deye",
    buttonLink: "/catalog",
    stats: [
      { value: "97.6%", label: "Eficiență", desc: "Randament maxim invertor.", accent: "bg-blue-500" },
      { value: "10 Ani", label: "Garanție", desc: "Standard de la producător.", accent: "bg-emerald-500" },
      { value: "IP65", label: "Protecție", desc: "Rezistență la praf și apă.", accent: "bg-cyan-500" }
    ]
  },
  {
    videoSrc: "/videos/aiko.mp4",
    imageSrc: "/images/aiko-panel.png",
    badge: "Top Performanță",
    title: "Eficiență Redefinită: Aiko Solar",
    subtitle: "Tehnologia ABC (All Back Contact) pentru cel mai mare randament la nivel global. Putere maximă pe m².",
    buttonText: "Descoperă Aiko",
    buttonLink: "/catalog",
    stats: [
      { value: "23.8%", label: "Randament", desc: "Cel mai mare la nivel global.", accent: "bg-blue-500" },
      { value: "15 Ani", label: "Garanție", desc: "Garanție directă produs Aiko.", accent: "bg-emerald-500" },
      { value: "<0.35%", label: "Degradare", desc: "Scădere de putere anuală.", accent: "bg-cyan-500" }
    ]
  },
  {
    videoSrc: "/videos/solar.mp4",
    imageSrc: "/images/solar-system.png",
    badge: "Parteneriat B2B",
    title: "Oferte Exclusive Pentru Parteneri",
    subtitle: "Beneficiați de prețuri preferențiale de importator, stocuri garantate și livrare prioritară.",
    buttonText: "Cere Ofertă B2B",
    buttonLink: "/cerere-oferta",
    stats: [
      { value: "5000+", label: "Stocuri", desc: "Echipamente disponibile imediat.", accent: "bg-blue-500" },
      { value: "24h", label: "Livrare", desc: "Din depozite naționale.", accent: "bg-emerald-500" },
      { value: "B2B", label: "Prețuri", desc: "Condiții de importator direct.", accent: "bg-cyan-500" }
    ]
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
    <section className="relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden bg-slate-900">
      {/* Videos */}
      {slides.map((slide, index) => (
        <div 
          key={index} 
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Fallback color while loading */}
          <div className="absolute inset-0 bg-slate-900"></div>
          
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-60"
          >
            <source src={slide.videoSrc} type="video/mp4" />
          </video>
        </div>
      ))}

      {/* Modern Gradient Overlays for better text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent"></div>
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-900/40"></div>

      {/* Content - Vertically Centered Text */}
      <div className="absolute inset-0 z-20 w-full max-w-[1800px] mx-auto px-6 lg:px-16 xl:px-24">
          
          {/* Top-Left Section: Vertically Centered Text & Buttons */}
          <div className="flex flex-col justify-center items-center sm:items-start text-center sm:text-left h-full max-w-3xl pt-20">
            <div className="flex flex-col w-full">
              
              {/* Badge Area - Removed by request */}
              
              
              {/* Text Area - Strict fixed height to guarantee ZERO layout shift (SEO & UX) */}
              <div className="h-[340px] sm:h-[300px] lg:h-[340px] flex flex-col justify-center items-center sm:items-start gap-4">
                <h1 
                  key={`title-${activeIndex}`}
                  className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-tight animate-[fadeInUp_0.5s_ease-out_forwards]"
                >
                  {slides[activeIndex].title}
                </h1>
                <p 
                  key={`subtitle-${activeIndex}`}
                  className="text-lg md:text-xl text-slate-300 font-light animate-[fadeInUp_0.5s_ease-out_0.2s_forwards] opacity-0"
                >
                  {slides[activeIndex].subtitle}
                </p>
              </div>

              {/* Action Area (Buttons & Dots) */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6 items-center sm:items-start w-full sm:w-auto px-2 sm:px-0">
                <Link href={slides[activeIndex].buttonLink} className="w-full max-w-[280px] sm:w-[280px] sm:max-w-none inline-flex justify-center items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all">
                  <span className="truncate">{slides[activeIndex].buttonText}</span>
                </Link>
                <Link href="/contact" className="w-full max-w-[280px] sm:w-[240px] sm:max-w-none inline-flex justify-center items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border border-white/20 transition-all hover:border-white/40">
                  Contactează-ne
                </Link>
              </div>

              {/* Dots Indicator */}
              <div className="flex justify-center sm:justify-start items-center gap-3 mt-8">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className="relative h-1.5 w-24 rounded-full overflow-hidden transition-all duration-500 bg-white/20 hover:bg-white/40"
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
          </div>

          {/* Bottom-Right Section: Features Horizontal Bar */}
          <div className="absolute bottom-16 right-6 lg:right-10 xl:right-10 hidden xl:grid grid-cols-3 gap-4 w-full max-w-3xl">
            {slides[activeIndex].stats.map((stat, idx) => {
              return (
                <div 
                  key={`stat-${activeIndex}-${idx}`} 
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-colors cursor-default animate-[fadeInUp_0.6s_ease-out_0.3s_forwards] opacity-0 flex items-center gap-4"
                  style={{ animationDelay: `${0.3 + (idx * 0.1)}s` }}
                >
                  <div className="min-w-[64px] px-2 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 text-white">
                    {stat.value}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1 leading-tight">{stat.label}</h3>
                    <p className="text-xs text-slate-400 leading-snug">{stat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
