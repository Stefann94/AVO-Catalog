"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import logo from "../../public/logo.png";
import { Search, User, ShoppingCart, ChevronDown, Award, Package, Menu, X, Phone, Mail, MapPin } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CELE PATRU STĂRI ALE BAREI
   ──────────────────────────────────────────────────────────────────────────
   Bara nu are o formă „de desktop" și una „de telefon", ci patru, fiindcă
   lățimile la care se folosește chiar sunt patru. Măsurat pe pagina randată,
   la 1920, elementele au aceste lățimi naturale:

       sigla ..................... 276px (la `h-12`; 253px la `h-11`)
       Catalog Produse ........... 151px
       Parteneri B2B ............. 155px
       Sisteme Industriale ....... 190px
       Cont B2B .................. 125px
       Coș ........................ 91px
       câmpul de căutare ......... 256px

   Adunate cu spațiile dintre ele și cu `lg:px-12`, forma completă cere 1428px.
   ACOLO ERA PROBLEMA: bara o cerea de la 1280 în sus, iar între 1280 și 1440
   nu încăpea — butoanele se strângeau, textul din ele se rupea pe două rânduri
   și bara creștea de la 107px la 121px. Sub 1280 se preda de tot: tot meniul,
   căutarea, contul și coșul dispăreau într-un hamburger, deși pe un ecran de
   1279px e loc de aproape toate.

   Formele, în ordinea în care apar pe măsură ce fereastra crește:

     sub lg (1024) ... sigla și hamburgerul. Restul, în meniul care se desface.
     lg  1024–1279 ... meniul complet, dar strâns: sigla la `h-11`, butoanele cu
                       `px-3.5` și 13px, căutarea și contul doar cu iconița.
                       Cere ~900px din cei 976 disponibili.
     xl  1280–1535 ... contul și coșul își recapătă eticheta, butoanele respiră
                       la `px-4`. Cere ~1060px din 1184.
     2xl 1536+ ....... forma completă: sigla la `h-12`, `px-5`, câmp de căutare.
                       Cere ~1350px din 1440.

   REGULA DE ÎNTREȚINERE. Fiecare treaptă are cel puțin 75px de rezervă față de
   lățimea la care începe. Cine adaugă un element în bară verifică întâi dacă
   rezerva aceea îl acoperă la treapta cea mai strâmtă (lg), nu la 1920.

   DE CE ÎNĂLȚIMILE SUNT DECLARATE. Rândurile au `h-8` și `h-[68px]`, nu
   înălțime dedusă din conținut. Motivul e că înălțimea barei e citită din
   afară: paginile își coboară conținutul cu `--inaltime-navbar`, definită în
   app/globals.css. O bară care crește când un text se rupe pe două rânduri ar
   face variabila aceea o minciună — exact ce se întâmpla la 1280.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Rețeta butoanelor din bară — meniu, cont, coș.
 *
 * Ca șir comun, nu copiată de patru ori: erau patru variante ale aceleiași
 * rețete, iar la restrângerea barei fiecare ar fi trebuit strânsă separat.
 * Aici padding-ul și corpul literei se schimbă la aceleași praguri pentru
 * toate, deci butoanele rămân o familie la orice lățime.
 */
const BUTON_BARA =
  "shrink-0 whitespace-nowrap flex items-center justify-center " +
  "bg-white/70 border border-white/80 text-slate-700 rounded-xl " +
  "font-semibold transition-all " +
  "hover:text-avo-600 hover:bg-white hover:shadow-md hover:shadow-avo-900/5 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600";

/** Butoanele de navigare: se lățesc pe măsură ce e loc. */
const BUTON_MENIU =
  BUTON_BARA + " gap-2 h-11 px-3.5 xl:px-4 2xl:px-5 text-[13px] xl:text-sm";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * DOUĂ STICLE, DUPĂ CE E ÎN SPATELE BAREI
   *
   * Bara e translucidă, iar transparența compune MEREU spre fundal. De-aici
   * ies două cerințe pe care o singură valoare nu le poate îndeplini:
   *
   *   peste hero ....... o tentă DESCHISĂ dă gri mediu, cu formele video-ului
   *                      vizibile prin ea. `slate-100/80` → ≈ #C6CBD3.
   *   peste conținut ... aceeași tentă deschisă dă ≈ #F4F7FA, iar pagina e
   *                      #F8F9FA. Bara ajunge la patru unități de fundal,
   *                      adică dispare. Acolo e nevoie de o tentă ÎNCHISĂ
   *                      lăsată mai transparentă: `slate-300/60` → ≈ #DFE6EE.
   *
   * A doua e chiar mai transparentă decât prima — 60% față de 80% — deci se
   * vede mai mult prin ea, nu mai puțin. Ce diferă e direcția tentei.
   *
   * ─── CUM E DETECTAT HERO-UL ──────────────────────────────────────────────
   *
   * Bara NU știe nimic despre hero și nici despre pagina de start. Caută un
   * element marcat `data-navbar-clar`; pe prima pagină e blocul întunecat de
   * un ecran, hero plus plinta cu siglele (vezi app/page.tsx). Pe paginile de
   * catalog nu există niciun asemenea element, deci bara rămâne gri, fără
   * nicio ramură scrisă special pentru ele.
   *
   * Marcajul e un atribut, nu un `id`: o pagină viitoare cu alt antet închis
   * îl pune pe ea și merge, fără să atingă fișierul ăsta.
   *
   * ─── DE CE `IntersectionObserver`, NU UN ASCULTĂTOR DE `scroll` ───────────
   *
   * Un ascultător de `scroll` rulează la fiecare pixel derulat și, ca să știe
   * unde e muchia, ar chema `getBoundingClientRect()` de fiecare dată — adică
   * ar forța recalcularea așezării în timpul derulării. Observatorul raportează
   * de DOUĂ ori pe toată pagina: o dată când hero-ul iese de sub bară, o dată
   * când se întoarce.
   *
   * `rootMargin` retrage marginea de sus a ferestrei cu exact înălțimea barei,
   * deci pragul cade pe muchia ei de jos, nu pe cea a ferestrei. Înălțimea nu
   * e o constantă — bara are trei înălțimi, după lățimea ecranului (vezi
   * `--inaltime-navbar` din app/globals.css) — așa că e măsurată de pe
   * elementul real și recitită la redimensionare.
   *
   * ─── DE CE DEPINDE DE `usePathname` ──────────────────────────────────────
   *
   * Navbarul e randat în app/layout.tsx, deci NU se remontează la navigarea
   * dintre pagini: React îl păstrează, se schimbă doar ce e sub el. Cu lista
   * de dependențe goală, efectul ar fi rulat o singură dată, la prima
   * încărcare — iar cine intra pe prima pagină și dădea clic pe „Catalog
   * Produse" rămânea cu sticla deschisă peste conținut alb, adică exact bara
   * invizibilă de la care a pornit toată treaba.
   *
   * ─── DE CE STAREA E CALCULATĂ ȘI SINCRON, NU DOAR DIN OBSERVATOR ─────────
   *
   * Observatorul își trimite primul raport abia în cadrul următor. Fără
   * măsurătoarea de dinaintea lui, bara ar porni gri și ar sări pe deschis
   * după primul cadru — o clipire la FIECARE încărcare a primei pagini.
   */
  const bara = useRef<HTMLElement | null>(null);
  const [pesteZonaInchisa, setPesteZonaInchisa] = useState(false);
  const cale = usePathname();

  useEffect(() => {
    let observator: IntersectionObserver | null = null;

    /**
     * Recitește totul de la zero: ținta, înălțimea barei, starea.
     *
     * E o funcție, nu cod în corpul efectului, din două motive. Unul de
     * curățenie — un `setState` scris direct în efect e semnalat de
     * `react-hooks/set-state-in-effect`, pe bună dreptate. Unul real: aceeași
     * recitire e nevoie la trei momente diferite (montare, schimbare de rută,
     * redimensionare), iar scrisă de trei ori ar diverge la prima modificare.
     */
    const recalculeaza = () => {
      observator?.disconnect();
      observator = null;

      const tinta = document.querySelector("[data-navbar-clar]");
      if (!tinta) {
        setPesteZonaInchisa(false);
        return;
      }

      const inaltime = bara.current?.offsetHeight ?? 68;

      setPesteZonaInchisa(tinta.getBoundingClientRect().bottom > inaltime);

      observator = new IntersectionObserver(
        ([raport]) => setPesteZonaInchisa(raport.isIntersecting),
        { rootMargin: `-${inaltime}px 0px 0px 0px` },
      );
      observator.observe(tinta);
    };

    recalculeaza();
    window.addEventListener("resize", recalculeaza);

    return () => {
      observator?.disconnect();
      window.removeEventListener("resize", recalculeaza);
    };
  }, [cale]);

  /*
   * Aici era o stare `isScrolled`, actualizată de un ascultător de scroll care
   * nu era folosit în niciun `className`: la fiecare derulare peste pragul de
   * 20px se declanșa un re-render al întregului navbar, fără nicio schimbare
   * vizibilă. A fost ștearsă.
   *
   * `pesteZonaInchisa` de mai sus NU e aceeași stare întoarsă pe furiș. Aceea
   * măsura derularea și nu decidea nimic; asta răspunde la o singură întrebare
   * — e ceva întunecat în spatele barei? — o pune de două ori pe toată pagina,
   * și decide o culoare care chiar se vede.
   */

  return (
    <nav ref={bara} className="fixed top-0 w-full z-50 flex flex-col shadow-sm">
      {/* ── Bara de contact ──────────────────────────────────────────────
          `h-8`, nu `py-2`: înălțimea ei intră în `--inaltime-navbar`, deci
          trebuie să fie o cifră, nu o consecință a textului dinăuntru. */}
      <div className="bg-slate-900 border-b border-slate-800 h-8 hidden lg:block">
        <div className="h-full w-full px-6 2xl:px-12 flex items-center justify-between gap-6 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">

          {/* Contact. `min-w-0` ca zona să poată ceda lățime în loc să
              împingă anunțul din mijloc peste ce urmează. */}
          <div className="flex items-center gap-6 min-w-0 shrink">
            <a href="tel:+40721233544" className="flex items-center gap-2 shrink-0 hover:text-white transition-colors">
              <Phone size={12} className="text-avo-400" /> +40.721.233.544
            </a>
            <a href="mailto:contact@avogrupinvest.ro" className="flex items-center gap-2 min-w-0 hover:text-white transition-colors">
              <Mail size={12} className="text-avo-400 shrink-0" />
              <span className="truncate">contact@avogrupinvest.ro</span>
            </a>
          </div>

          {/* Anunțul B2B.
              PRAGUL E 1400px, MĂSURAT, nu `xl`. Textul are 66 de caractere la
              11px cu `tracking-wider`, adică ~480px; contactul din stânga cere
              359px, linkul din dreapta 250px. Sub 1400 nu încap toate trei, iar
              la `xl` chiar așa arăta: adresa de e-mail intra peste anunț, fără
              spațiu între ele, fiindcă cele trei zone erau `flex-1` egale și
              mijlocul își depășea zona în ambele părți.

              Nu mai e `flex-1`: zonele își iau lățimea lor, iar `justify-between`
              le desparte. Așa mijlocul nu mai are cum să calce peste vecini. */}
          <div className="hidden min-[1400px]:flex shrink-0 items-center">
            <Link href="/cerere-oferta" className="flex items-center hover:text-white transition-colors text-avo-400">
              <span className="tracking-wider whitespace-nowrap">CONDIȚII COMERCIALE PREFERENȚIALE PENTRU COMPANII ȘI DISTRIBUITORI</span>
            </Link>
          </div>

          {/* Locații. Eticheta se scurtează sub 1400: acolo, cu anunțul absent,
              locul e liber, dar peste prag lățimea contează. */}
          <div className="flex shrink-0 justify-end">
            <Link href="/contact" className="flex items-center gap-2 whitespace-nowrap hover:text-white transition-colors">
              <MapPin size={12} className="text-avo-400" />
              <span className="hidden min-[1400px]:inline">Formular Contact &amp; Locații</span>
              <span className="min-[1400px]:hidden">Contact &amp; Locații</span>
            </Link>
          </div>

        </div>
      </div>

      {/* ── Rândul siglei ────────────────────────────────────────────────
          Înălțime declarată, din același motiv ca mai sus. Creșterea de la 68
          la 72px la `2xl` însoțește sigla, care trece acolo de la `h-11` la
          `h-12`; cele două praguri trebuie să rămână același.

          `lg:px-6`, nu `lg:px-12`: la 1024 cei 48px de gardă de fiecare parte
          erau exact ce lipsea ca meniul complet să încapă. De la 2xl, unde e
          loc, se întorc. */}
      <div className={`${pesteZonaInchisa ? "bg-slate-100/80" : "bg-slate-300/60"} backdrop-blur-2xl backdrop-saturate-150 border-b border-slate-200/50 h-[68px] 2xl:h-[72px] transition-colors duration-300`}>
        <div className="h-full w-full px-4 sm:px-6 2xl:px-12 flex items-center justify-between gap-3 xl:gap-4">
        {/*
          Sigla stă la jumătatea distanței dintre marginea din stânga și primul
          buton, fără nicio măsurătoare în JavaScript.

          Mecanica: acest container și cel cu acțiunile din dreapta cresc
          (`grow`), meniul rămâne la lățimea lui naturală. Spațiul rămas se
          împarte în două părți egale — una intră în containerul siglei, una în
          cel al acțiunilor. Siglei i se spune `justify-center`, deci se așază
          fix la mijlocul primei părți; acțiunilor `justify-end`, deci rămân
          lipite de marginea dreaptă. Meniul nu se mișcă din locul pe care îl
          avea cu `justify-between`.

          `pl-3` nu e ornament: rândul are `gap-3`, iar spațiul acela stă în
          afara containerului. Fără el, distanța până la buton ar ieși cu 12px
          mai mare decât cea până la margine. Padding-ul aduce aceiași 12px
          înăuntru, în stânga, și cele două distanțe devin egale. La `xl`, unde
          rândul trece pe `gap-4`, trece și el pe `pl-4`.

          `min-w-52` e podeaua sub care sigla nu mai coboară. Fără ea, când bara
          se aglomerează, containerul se strânge înaintea celorlalte și sigla
          ajunge la câțiva pixeli lățime.

          Nu e `flex-auto`, deși ar părea mai scurt: `flex-auto` scrie
          proprietatea `flex` întreagă, iar Tailwind o emite după `flex-shrink`,
          deci ar anula orice `shrink-*` pus pe același element.

          Sub `lg` meniul nu există, deci nu există nici distanța de înjumătățit
          — acolo sigla rămâne la stânga, lângă butonul de meniu. Pragul era
          `xl`; a coborât la `lg` odată cu meniul.
        */}
        <Link href="/" className="flex items-center shrink min-w-0 lg:grow lg:min-w-52 lg:justify-center lg:pl-3 xl:pl-4">
          {/* Import static, nu șirul "/logo.png": Next scoate fișierul sub o
              adresă care conține un hash al conținutului. La orice modificare a
              siglei se schimbă adresa, deci browserele și optimizatorul de
              imagini nu mai pot servi versiunea veche din cache. Tot de aici
              vin și dimensiunile reale, fără să le scriem de mână. */}
          <Image
            src={logo}
            alt="Avo Grup Invest"
            className="h-9 sm:h-10 md:h-11 2xl:h-12 w-auto max-w-full object-contain"
            priority
          />
        </Link>

        {/* Meniul. `shrink-0` peste tot: dacă vreodată nu mai încape, vrem să
            iasă în afară și să se vadă, nu să se strângă până când textul se
            rupe pe două rânduri și crește bara. Aceea era starea de la 1280. */}
        <div className="hidden lg:flex shrink-0 items-center gap-2 xl:gap-2.5 2xl:gap-3">
          <Link href="/catalog" className={BUTON_MENIU}>
            Catalog Produse
          </Link>

          <div className="relative group cursor-pointer">
            <div className={BUTON_MENIU}>
              Parteneri B2B <ChevronDown size={14} className="group-hover:scale-125 group-hover:text-avo-500 group-hover:drop-shadow-md transition-all duration-300" />
            </div>
            {/* Dropdown B2B Wrapper (Hover Bridge) */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 group-hover:delay-0 delay-150 transform group-hover:translate-y-0 translate-y-2 z-50">
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
                <div className="p-4 bg-slate-200/30 hover:bg-avo-50/50 transition-colors cursor-pointer group/link">
                  <Link href="/devino-partener" className="text-sm text-avo-600 font-bold flex items-center gap-1.5 justify-center">
                    Află cum devii partener
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/oferte-en-gros"
            className={
              "group shrink-0 whitespace-nowrap flex items-center justify-center gap-2 " +
              "h-11 px-3.5 xl:px-4 2xl:px-5 rounded-xl text-[13px] xl:text-sm font-semibold " +
              "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 " +
              "transition-all hover:text-emerald-800 hover:border-emerald-300 hover:from-emerald-100 hover:to-teal-100 hover:shadow-md hover:shadow-emerald-900/5 " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            }
          >
            <Package size={16} className="shrink-0 group-hover:scale-110 transition-transform" /> Sisteme Industriale
          </Link>

        </div>

        {/* ── Acțiunile din dreapta ────────────────────────────────────
            Trei elemente care se dezbracă pe rând, în ordinea în care le scade
            utilitatea odată cu spațiul: întâi câmpul de căutare devine buton cu
            lupă, apoi contul și coșul rămân doar cu iconița. */}
        <div className="hidden lg:flex lg:grow lg:justify-end items-center gap-2 xl:gap-3 2xl:gap-5">
          {/* Câmpul de căutare, doar de la 2xl. Sub el ar fi trebuit să scadă
              la ~150px, adică sub lungimea textului „Caută produse…" pe care
              îl ține — un câmp în care nu încape nici măcar invitația lui.
              Butonul cu lupă spune același lucru și ocupă 44px. */}
          <div className="relative group hidden 2xl:block min-w-0 shrink">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Caută produse..."
              className="bg-white/70 border border-white/80 text-slate-900 text-sm rounded-xl pl-10 pr-4 h-11 focus:outline-none focus:bg-white focus:shadow-inner transition-all w-64 min-w-0 max-w-full"
            />
          </div>

          <button
            type="button"
            aria-label="Caută produse"
            className={BUTON_BARA + " 2xl:hidden h-11 w-11"}
          >
            <Search size={18} />
          </button>

          <div className="flex items-center gap-2 xl:gap-3">
            {/* `w-11` cât timp e doar iconița, `px-4` când vine și eticheta:
                un buton pătrat nu se obține lăsând padding-ul pe loc. */}
            <button type="button" className={BUTON_BARA + " group h-11 w-11 xl:w-auto xl:gap-2 xl:px-4"}>
              <User size={16} className="group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline text-xs uppercase tracking-wider">Cont B2B</span>
            </button>
            <button type="button" className={BUTON_BARA + " group relative h-11 w-11 xl:w-auto xl:gap-2 xl:px-4"}>
              <div className="relative">
                <ShoppingCart size={16} className="group-hover:scale-110 transition-transform" />
                <span className="absolute -top-2.5 -right-2.5 bg-avo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">0</span>
              </div>
              <span className="hidden xl:inline text-xs uppercase tracking-wider ml-1">Coș</span>
            </button>
          </div>
        </div>

        {/* Butonul de meniu. Pragul a coborât de la `xl` la `lg`: între 1024 și
            1279 bara are acum formă de desktop, deci hamburgerul n-ar mai avea
            ce să deschidă. */}
        <button
          className="lg:hidden shrink-0 text-slate-800 p-2 bg-white/70 rounded-xl border border-white/80 hover:bg-white transition-colors ml-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? "Închide meniul" : "Deschide meniul"}
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
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-avo-600 w-full"
            />
          <Link href="/catalog" className="text-slate-700 text-lg py-2 border-b border-slate-100">Catalog Produse</Link>
          <Link href="/parteneri" className="text-slate-700 text-lg py-2 border-b border-slate-100 flex justify-between items-center">
            Parteneri B2B <span className="text-xs bg-avo-50 text-avo-600 px-2 py-1 rounded-md">Gold / Platinum</span>
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
