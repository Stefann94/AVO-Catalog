"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   SINGURA PARTE DIN BARĂ CARE AJUNGE ÎN BROWSER
   ──────────────────────────────────────────────────────────────────────────
   Bara întreagă avea 441 de rânduri și era marcată `"use client"`, deci se
   trimitea și se pornea pe FIECARE pagină: sigla, cele trei butoane de meniu,
   fereastra de parteneri, căutarea, contul, dunga de contact, meniul de
   telefon — tot, inclusiv șapte iconițe. Pe o fișă de produs nimic din toate
   astea nu reacționează la nimic.

   Măsurat pe fișa de produs, înainte: imaginea principală ajungea în 300 ms,
   dar era desenată abia după încă 1080 ms, fiindcă firul principal era ocupat
   772 ms cu execuție de JavaScript. Bara era cel mai mare contribuitor care nu
   avea nevoie să fie acolo.

   Aici au rămas DOUĂ stări, și nimic altceva:

     meniuDeschis ........ hamburgerul de sub `lg` și panoul pe care îl desface.
     pesteZonaInchisa .... ce e în spatele barei, care îi decide sticla.

   Restul barei se randează pe server și intră aici ca `children` și
   `meniuMobil` — adică marcaj gata făcut, nu componente. React îl așază la
   locul lui fără să trimită în browser o singură linie din el.

   ─── CE NU S-A SCHIMBAT ───────────────────────────────────────────────────

   Nimic din ce se vede. Aceleași elemente, aceleași clase, aceeași ordine în
   pagină, aceleași tranziții. Verificat prin captură, la 1440, 390 și 360 px.
   ══════════════════════════════════════════════════════════════════════════ */

export default function NavbarInteractiv({
  children,
  meniuMobil,
}: {
  /** Rândul siglei: sigla, meniul, acțiunile din dreapta. Randate pe server. */
  children: ReactNode;
  /** Cuprinsul panoului de telefon. Randat pe server. */
  meniuMobil: ReactNode;
}) {
  const [meniuDeschis, setMeniuDeschis] = useState(false);

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
   * Se măsoară `<nav>`, nu rândul ăsta: deasupra lui mai stă dunga de contact,
   * iar pragul trebuie să cadă sub amândouă. De-aici `closest("nav")` — reful
   * stă pe rândul siglei, fiindcă `<nav>` se randează acum pe server.
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
  const randSigla = useRef<HTMLDivElement | null>(null);
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

      const inaltime = randSigla.current?.closest("nav")?.offsetHeight ?? 68;

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

  return (
    <>
      {/* ── Rândul siglei ────────────────────────────────────────────────
          Înălțime declarată, nu dedusă din conținut. Creșterea de la 68 la
          72px la `2xl` însoțește sigla, care trece acolo de la `h-11` la
          `h-12`; cele două praguri trebuie să rămână același. */}
      <div
        ref={randSigla}
        className={`${pesteZonaInchisa ? "bg-slate-100/80" : "bg-slate-300/60"} backdrop-blur-2xl backdrop-saturate-150 border-b border-slate-200/50 h-[68px] 2xl:h-[72px] transition-colors duration-300`}
      >
        <div className="h-full w-full px-4 sm:px-6 2xl:px-12 flex items-center justify-between gap-3 xl:gap-4">
          {children}

          {/* Butonul de meniu. Pragul a coborât de la `xl` la `lg`: între 1024
              și 1279 bara are acum formă de desktop, deci hamburgerul n-ar mai
              avea ce să deschidă. */}
          <button
            className="lg:hidden shrink-0 text-slate-800 p-2 bg-white/70 rounded-xl border border-white/80 hover:bg-white transition-colors ml-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
            onClick={() => setMeniuDeschis(!meniuDeschis)}
            aria-expanded={meniuDeschis}
            aria-label={meniuDeschis ? "Închide meniul" : "Deschide meniul"}
          >
            {meniuDeschis ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl overflow-hidden transition-all duration-300 ease-in-out origin-top ${
          meniuDeschis ? "max-h-[500px] opacity-100 border-b" : "max-h-0 opacity-0 border-transparent"
        }`}
      >
        {meniuMobil}
      </div>
    </>
  );
}
