"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { BRANDURI } from "@/lib/branduri";

/**
 * Plinta hero-ului — brandurile distribuite, ca bandă derulantă.
 *
 * Nu e o secțiune separată. E baza pe care stă hero-ul: același întuneric,
 * despărțită doar printr-o linie fină. Împreună ocupă exact un ecran, iar
 * tăietura către deschis se petrece o singură dată, mai jos, unde începe
 * „Gama de produse".
 *
 * ─── DE CE SIGLE ȘI NU CIFRE ──────────────────────────────────────────────
 *
 * Versiunea anterioară punea aici patru cifre. Nu mergea: hero-ul are deja
 * trei cartonașe cu valori în colțul din dreapta-jos, iar banda le adăuga
 * încă patru — șapte numere adunate în același colț, la 100px distanță.
 *
 * Siglele rezolvă asta din construcție: zero cifre, iar greutatea vizuală
 * se mută pe toată lățimea în loc să se îngrămădească într-un colț. În plus,
 * sunt singura imagistică reală disponibilă — catalogul n-are nicio poză de
 * produs, coloana `Images` nici nu există în CSV-ul de import.
 *
 * ─── DE CE SUNT TOATE ALBE ────────────────────────────────────────────────
 *
 * Nu e o alegere estetică, e o constrângere măsurată. Din cele 17 fișiere
 * primite, 9 aveau fundal alb opac (ar fi apărut ca dreptunghiuri albe pe
 * bandă) și 3 erau transparente dar cu cerneală închisă, deci invizibile pe
 * negru. Doar 2 erau utilizabile ca atare.
 *
 * Pe fundal întunecat nu există variantă în care siglele să-și păstreze
 * culorile și să rămână toate lizibile — prea multe au text negru. Silueta
 * albă e tratamentul standard pentru un perete de parteneri și are avantajul
 * că 17 sigle cu 17 scheme cromatice diferite nu mai arată ca un colaj.
 *
 * Originalele colorate sunt păstrate. Dacă se dorește culoarea, banda trebuie
 * să treacă pe fundal deschis — ceea ce anulează ideea de plintă.
 */

/**
 * Șaizeci de secunde pentru un tur complet.
 *
 * Lent intenționat. O bandă care aleargă atrage atenția și o ține, ceea ce e
 * exact pe dos față de rolul unei plinte; una care abia se mișcă se citește
 * ca un detaliu viu, nu ca o reclamă. La 17 sigle, ~60s înseamnă că o siglă
 * traversează ecranul în vreo 20 de secunde.
 */
const DURATA_SECUNDE = 60;

export default function BandaBranduri() {
  const [inPauza, setInPauza] = useState(false);

  return (
    <section
      aria-label="Branduri distribuite"
      className="shrink-0 border-t border-white/10 bg-slate-950"
    >
      <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 lg:pl-16 xl:pl-24 lg:pr-6 py-4">
        {/* Eticheta rămâne fixă; doar siglele se mișcă. Fără ea, un perete de
            sigle nu spune ce reprezintă — ar putea fi la fel de bine clienți,
            certificări sau parteneri de transport. */}
        <p className="shrink-0 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 leading-tight max-w-[7.5rem] sm:max-w-none">
          Branduri
          <span className="hidden sm:inline"> distribuite</span>
        </p>

        <span aria-hidden className="hidden sm:block shrink-0 h-6 w-px bg-white/10" />

        {/* Fereastra de derulare.
            `mask-image` estompează capetele, ca siglele să nu fie retezate
            brusc de marginea ecranului — fără el, banda pare tăiată cu foarfeca. */}
        <div
          className="relative flex-1 min-w-0 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, #000 3rem, #000 calc(100% - 3rem), transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, #000 3rem, #000 calc(100% - 3rem), transparent)",
          }}
        >
          {/* Pista conține lista de două ori și se deplasează cu exact 50%.
              În momentul în care primul set iese complet din cadru, al doilea
              e fix în poziția de start, deci reluarea e invizibilă. */}
          <div
            className="flex w-max items-center animate-[defilareBranduri_var(--durata)_linear_infinite]"
            style={{
              ["--durata" as string]: `${DURATA_SECUNDE}s`,
              animationPlayState: inPauza ? "paused" : "running",
            }}
          >
            {[0, 1].map((set) => (
              <div key={set} className="flex shrink-0 items-center" aria-hidden={set === 1}>
                {BRANDURI.map((b) => (
                  <span
                    key={b.slug}
                    className="flex shrink-0 items-center justify-center px-6 sm:px-8"
                  >
                    {/* `<img>`, nu `next/image`: siglele au lățimi foarte
                        diferite la aceeași înălțime, iar aici contează doar
                        înălțimea. Sunt deja optimizate (4–17 KB, medie 7 KB,
                        160 KB tot lotul), deci nu câștigăm nimic din trecerea
                        lor prin optimizator — doar am adăuga 17 cereri către
                        /_next/image pe primul ecran. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/branduri/${b.slug}.png`}
                      alt={set === 0 ? b.nume : ""}
                      height={24}
                      className="h-5 sm:h-6 w-auto opacity-60 transition-opacity duration-300 hover:opacity-100"
                      loading="eager"
                      decoding="async"
                    />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* WCAG 2.2.2: conținutul care se mișcă singur mai mult de cinci
            secunde trebuie să poată fi oprit. Oprirea la hover nu e suficientă
            — nu ajută la tastatură și nici pe touch. */}
        <button
          type="button"
          onClick={() => setInPauza((v) => !v)}
          aria-label={inPauza ? "Pornește derularea brandurilor" : "Oprește derularea brandurilor"}
          className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md text-slate-500 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {inPauza ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>
    </section>
  );
}
