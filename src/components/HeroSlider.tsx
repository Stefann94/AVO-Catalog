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

          {/* Top-Left Section: Vertically Centered Text & Buttons

              `pt` e exact înălțimea barei fixe, din variabila definită în
              app/globals.css. Era `pt-20` (80px), o cifră care nu nimerea
              niciuna dintre cele trei înălțimi reale ale barei: la 1024 și mai
              sus conținutul urca cu 20–24px sub ea, deci „centrat pe verticală"
              însemna de fapt centrat în raport cu un capăt de sus greșit. */}
          <div className="flex flex-col justify-center items-center sm:items-start text-center sm:text-left h-full max-w-3xl pt-[var(--inaltime-navbar)]">
            <div className="flex flex-col w-full">

              {/* Badge Area - Removed by request */}


              {/* ── Zona de text ────────────────────────────────────────────
                  Înălțime FIXATĂ, ca trecerea de la un slide la altul să nu
                  miște butoanele de dedesubt: titlurile au 27–33 de caractere,
                  deci fără ea rândurile ar diferi de la un slide la altul.

                  Nu mai e o listă de cifre pe praguri de lățime, ci `clamp` pe
                  înălțimea ferestrei. Motivul e că mărimea de care are nevoie
                  blocul depinde de cât loc are pe VERTICALĂ, iar praguri pe
                  lățime nu văd asta: pe o fereastră de 600px înălțime, cei
                  340px rezervați plus butoanele și punctele nu mai încăpeau
                  deasupra benzii de branduri.

                    240px ... podeaua. La `lg`, titlul de 60px pe două rânduri
                              (150px) plus subtitlul pe două (64px) și spațiul
                              dintre ele (16px) cer 230px.
                    36svh ... cât ia în mod normal, adică 324px pe o fereastră
                              de 900px și 340px pe una de 1080.
                    340px ... plafonul de dinainte, păstrat: la 1920×1080
                              aspectul rămâne exact cel de azi.

                  `svh`, nu `vh` sau `dvh`, din același motiv ca la înălțimea
                  hero-ului din app/page.tsx: e singura care nu se recalculează
                  în timp ce derulezi pe telefon.

                  TEXTUL STĂ LA BAZA CUTIEI, nu la mijloc (`justify-end`, nu
                  `justify-center`). Rezerva nefolosită se duce atunci toată
                  deasupra titlului, unde oricum e cer liber, în loc să se
                  împartă în două și să lase o gaură între subtitlu și butoane.
                  Se vedea la lățimile unde titlul încape pe un rând: la 1150
                  rămâneau ~90px de gol exact acolo. Distanța de la subtitlu la
                  butoane e acum aceeași pe toate cele trei slide-uri. */}
              <div className="h-[clamp(240px,36svh,340px)] flex flex-col justify-end items-center sm:items-start gap-4">
                <h1
                  key={`title-${activeIndex}`}
                  /* Treapta de 60px la `lg` e nouă. Titlul sărea direct de la
                     48px la 72px, iar 72px pe o fereastră de 1024 însemna un
                     titlu care ocupă singur jumătate din hero, cu restul gol.
                     Cei 72px se întorc la 2xl, unde chiar e loc pentru ei. */
                  className="text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl font-extrabold text-white leading-tight animate-[fadeInUp_0.5s_ease-out_forwards]"
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

              {/* ── Cele trei cifre ale slide-ului ──────────────────────────
                  DOUĂ AȘEZĂRI, la două praguri, fiindcă rolul lor se schimbă
                  odată cu lățimea:

                    de la xl .... colț dreapta-jos, `absolute`. Măsurat: la 1280
                                  fișele încep la 472px de marginea din stânga,
                                  iar punctele se termină la 408px — nu se ating.
                                  Așa arată compoziția de azi la 1920.
                    la lg ....... în firul paginii, sub puncte. La 1024 aceleași
                                  fișe ar începe la 216px, adică peste punctele
                                  care țin până la 376px, și ar cădea exact pe
                                  ele și pe verticală. Sub coloană nu se calcă
                                  cu nimic.
                    sub lg ...... ascunse. Cele trei fișe pe un rând ar avea
                                  ~200px fiecare, cu descrieri pe patru rânduri.

                  ÎN AȘEZAREA DIN FIR CONTEAZĂ ȘI ÎNĂLȚIMEA, de-aia condiția e
                  scrisă ca o singură interogare cu două jumătăți, nu ca `lg:`.
                  Fișele stau în aceeași coloană cu titlul, butoanele și
                  punctele; pe o fereastră de 1150×620 coloana cerea 580px din
                  cei 562 rămași după banda de branduri, iar ce depășea intra
                  sub bandă. Peste 720px înălțime încape cu tot cu ele.

                  La `xl` pragul nu se aplică: acolo fișele sunt `absolute`,
                  deci nu mai împing coloana în jos, oricât ar fi de scundă
                  fereastra. Ambele variante scriu `display: grid`, deci nu se
                  contrazic acolo unde se suprapun.

                  ERA `hidden xl:grid`, deci între 1024 și 1279 hero-ul rămânea
                  cu jumătatea dreaptă și cu ultimii ~200px de sus în jos goi —
                  cel mai vizibil gol din pagină la lățimile alea.

                  `absolute` se ancorează în învelișul `absolute inset-0` de mai
                  sus, singurul părinte poziționat, nu în coloana asta. */}
              <div className="mt-8 hidden [@media(min-width:64rem)_and_(min-height:45rem)]:grid xl:grid grid-cols-3 gap-3 xl:gap-4 w-full max-w-3xl xl:absolute xl:bottom-16 xl:right-10 xl:mt-0">
                {slides[activeIndex].stats.map((stat, idx) => {
                  return (
                    <div
                      key={`stat-${activeIndex}-${idx}`}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 2xl:p-5 rounded-2xl 2xl:rounded-3xl hover:bg-white/10 transition-colors cursor-default animate-[fadeInUp_0.6s_ease-out_0.3s_forwards] opacity-0 flex items-center gap-3 2xl:gap-4 text-left"
                      style={{ animationDelay: `${0.3 + (idx * 0.1)}s` }}
                    >
                      <div className="min-w-[56px] 2xl:min-w-[64px] px-1.5 2xl:px-2 h-12 2xl:h-14 rounded-2xl flex items-center justify-center font-bold text-[15px] 2xl:text-lg shrink-0 text-white">
                        {stat.value}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-[13px] 2xl:text-sm mb-1 leading-tight">{stat.label}</h3>
                        <p className="text-[11px] 2xl:text-xs text-slate-400 leading-snug">{stat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
