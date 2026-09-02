"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, User, ShoppingCart, ChevronDown, Award, Package, Menu, X, Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 flex flex-col shadow-sm">
      {/* Top Bar (Dark contrast) */}
      <div className="bg-slate-900 border-b border-slate-800 py-2 hidden lg:block">
        <div className="w-full px-6 lg:px-12 flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          
          {/* Left: Contact Info */}
          <div className="flex items-center gap-6 flex-1">
            <a href="tel:+40721233544" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={12} className="text-blue-400" /> +40.721.233.544
            </a>
            <a href="mailto:contact@avogrupinvest.ro" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail size={12} className="text-blue-400" /> contact@avogrupinvest.ro
            </a>
          </div>

          {/* Center: B2B Announcement */}
          <div className="hidden xl:flex flex-1 justify-center items-center">
            <Link href="/cerere-oferta" className="flex items-center hover:text-white transition-colors text-blue-400">
              <span className="tracking-wider whitespace-nowrap">CONDIȚII COMERCIALE PREFERENȚIALE PENTRU COMPANII ȘI DISTRIBUITORI</span>
            </Link>
          </div>

          {/* Right: Location/Contact Link */}
          <div className="flex-1 flex justify-end">
            <Link href="/contact" className="flex items-center gap-2 hover:text-white transition-colors">
              <MapPin size={12} className="text-blue-400" /> Formular Contact & Locații
            </Link>
          </div>

        </div>
      </div>

      {/* Main Navbar (Enhanced Frosted Glass) */}
      <div className="bg-slate-100/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-slate-200/50 py-3">
        <div className="w-full px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink min-w-0">
          <Image 
            src="/logo.png" 
            alt="Avo Grup Invest Logo" 
            width={400} 
            height={48} 
            className="h-8 sm:h-12 md:h-14 w-auto max-w-full object-contain drop-shadow-sm"
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/catalog" className="px-5 py-2.5 bg-slate-100/60 border border-slate-200/60 text-slate-700 hover:text-blue-600 hover:bg-white hover:shadow-md hover:shadow-blue-900/5 transition-all font-semibold text-sm rounded-xl">
            Catalog Produse
          </Link>
          
          <div className="relative group cursor-pointer">
            <div className="px-5 py-2.5 bg-slate-100/60 border border-slate-200/60 text-slate-700 hover:text-blue-600 hover:bg-white hover:shadow-md hover:shadow-blue-900/5 transition-all font-semibold text-sm flex items-center gap-2 rounded-xl">
              Parteneri B2B <ChevronDown size={14} className="group-hover:scale-125 group-hover:text-blue-500 group-hover:drop-shadow-md transition-all duration-300" />
            </div>
            {/* Dropdown B2B Wrapper (Hover Bridge) */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-8 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 group-hover:delay-0 delay-150 transform group-hover:translate-y-0 translate-y-2 z-50">
              {/* Visual Box */}
              <div className="w-64 bg-slate-100/95 backdrop-blur-3xl backdrop-saturate-200 border border-slate-200/50 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden">
                <div className="p-4 border-b border-slate-200/50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Statut Partener</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 text-sm text-yellow-600 font-medium p-3 hover:bg-white/80 border border-transparent hover:border-slate-300/60 hover:shadow-sm rounded-xl transition-all cursor-pointer">
                      <Award size={18} /> Cont Gold <span className="ml-auto text-xs bg-yellow-500/10 text-yellow-700 px-2 py-1 rounded-md">-10%</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-700 font-medium p-3 hover:bg-white/80 border border-transparent hover:border-slate-300/60 hover:shadow-sm rounded-xl transition-all cursor-pointer">
                      <Award size={18} className="text-slate-400" /> Cont Platinum <span className="ml-auto text-xs bg-slate-200/50 text-slate-600 px-2 py-1 rounded-md">-15%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-200/30 hover:bg-blue-50/50 transition-colors cursor-pointer group/link">
                  <Link href="/devino-partener" className="text-sm text-blue-600 font-bold flex items-center gap-1.5 justify-center">
                    Află cum devii partener <ArrowUpRight size={16} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Link href="/oferte-en-gros" className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 hover:text-emerald-800 hover:border-emerald-300 hover:from-emerald-100 hover:to-teal-100 hover:shadow-md hover:shadow-emerald-900/5 transition-all font-semibold text-sm rounded-xl">
            <Package size={16} className="group-hover:scale-110 transition-transform" /> Sisteme Complete
          </Link>
          
        </div>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-5">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Caută produse..." 
              className="bg-slate-100/60 border border-slate-200/60 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:bg-slate-50/80 focus:shadow-inner transition-all w-64"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/60 border border-slate-200/60 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-md hover:shadow-blue-900/5 transition-all font-semibold group">
              <User size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs uppercase tracking-wider">Cont B2B</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/60 border border-slate-200/60 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-md hover:shadow-blue-900/5 transition-all font-semibold relative group">
              <div className="relative">
                <ShoppingCart size={16} className="group-hover:scale-110 transition-transform" />
                <span className="absolute -top-2.5 -right-2.5 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">0</span>
              </div>
              <span className="text-xs uppercase tracking-wider ml-1">Coș</span>
            </button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden shrink-0 text-slate-800 p-2 bg-slate-100/80 rounded-xl border border-slate-200/60 hover:bg-white transition-colors ml-auto"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      </div>
      
      {/* Mobile Menu */}
      <div 
        className={`lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl overflow-hidden transition-all duration-300 ease-in-out origin-top ${
          isMobileMenuOpen ? "max-h-[500px] opacity-100 border-b" : "max-h-0 opacity-0 border-transparent"
        }`}
      >
        <div className="p-6 flex flex-col gap-4">
          <input 
              type="text" 
              placeholder="Caută produse..." 
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 w-full"
            />
          <Link href="/catalog" className="text-slate-700 text-lg py-2 border-b border-slate-100">Catalog Produse</Link>
          <Link href="/parteneri" className="text-slate-700 text-lg py-2 border-b border-slate-100 flex justify-between items-center">
            Parteneri B2B <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md">Gold / Platinum</span>
          </Link>
          <Link href="/oferte-en-gros" className="text-slate-700 text-lg py-2 border-b border-slate-100 flex items-center gap-2">
             <Package size={18} className="text-emerald-600"/> Oferte Palet & En-Gros
          </Link>
          <Link href="/cont" className="text-slate-700 text-lg py-2 border-b border-slate-100 flex items-center gap-2">
            <User size={18} /> Contul Meu
          </Link>
        </div>
      </div>
    </nav>
  );
}
