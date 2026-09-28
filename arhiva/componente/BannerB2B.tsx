"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgePercent, Award, LayoutGrid, Pause, Play } from "lucide-react";

/**
 * Bannerul B2B din „Gama de produse", ca listă de mesaje care se rotesc.
 *
 * E singura parte cu JavaScript din secțiune. GamaProduse rămâne server
 * component, fără cod trimis în browser; doar bucata asta e „use client",
 * fiindcă doar ea are nevoie de un temporizator. Dacă ar fi fost pus tot
 * în același fișier, întreaga secțiune — cele patru carduri, imaginile,
 * prețurile — ar fi ajuns și ea în pachetul de JavaScript, degeaba.
 */

/**
 * TEXTELE. Toate sunt derivate din formulări care există deja în proiect —
 * nu sunt afirmații comerciale inventate:
 *
 *  1. e bannerul actual, cuvânt cu cuvânt (pragurile reale din catalog:
 *     „< 3 paleți / > 4 paleți" la panouri, „COMANDĂ > 12 BUC" la restul,
 *     containerul ofertat separat);
 *  2. vine din meniul „Parteneri B2B" al navbar-ului, unde scrie deja
 *     „Cont Gold −10%" și „Cont Platinum −15%";
 *  3. vine din numărul de categorii din src/lib/categorii.ts și din nota
 *     „Catalogul se actualizează lunar" de pe pagina de categorie.
 *
 * Orice mesaj nou trebuie să aibă aceeași proveniență: o cifră sau o
 * promisiune care nu e deja scrisă undeva în proiect nu se pune aici.
 */
const MESAJE = [
  {
    icon: BadgePercent,
    titlu: "Condiții comerciale preferențiale pentru companii și distribuitori",
    detaliu:
      "Preț redus de la 4 paleți la panouri · de la 12 bucăți la invertoare și acumulatori · ofertă dedicată pentru comenzi container",
    actiune: "Cere ofertă",
    href: "/cerere-oferta",
  },
  {
    icon: Award,
    titlu: "Statut de partener Gold sau Platinum",
    detaliu:
      "Reducere de 10% la Gold și 15% la Platinum, aplicată prețului de catalog pentru partenerii înregistrați.",
    actiune: "Devino partener",
    href: "/devino-partener",
  },
  {
    icon: LayoutGrid,
    titlu: "Catalog actualizat lunar",
    detaliu:
      "Opt categorii, de la panouri și invertoare la sisteme de stocare, structuri de montaj și accesorii.",
    actiune: "Vezi catalogul",
    href: "/catalog",
  },
];

/**
 * Șapte secunde.
 *
 * Cel mai lung mesaj are ~30 de cuvinte. La un ritm de parcurgere în
 * diagonală de vreo patru cuvinte pe secundă — cum se citește un banner, nu
 * un articol — ies ~7s. Sub 5s nu s-ar apuca nimeni de rândul al doilea;
 * peste 10s bannerul pare încremenit și nimeni n-ar bănui că se schimbă.
 */
const DURATA = 7000;

export default function BannerB2B() {
  const [activ, setActiv] = useState(0);
  const [inPauza, setInPauza] = useState(false);

  /**
   * Pauză automată cât timp cursorul e pe banner sau focusul e înăuntru.
   *
   * Nu e o reacție vizuală — bannerul arată identic — ci evită situația în
   * care mesajul se schimbă exact când cineva îl citește. E ținută separat de
   * `inPauza`, ca reluarea automată să nu anuleze pauza cerută explicit de la
   * buton.
   */
  const [opritDeCitire, setOpritDeCitire] = useState(false);

  /**
   * Setarea de sistem „reduce motion" oprește complet rotirea: pentru cineva
   * cu tulburări vestibulare, conținutul care se schimbă singur e o problemă
   * reală, nu o preferință. Rămâne primul mesaj, iar butoanele funcționează.
   */
  const [miscareRedusa, setMiscareRedusa] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplica = () => setMiscareRedusa(mq.matches);
    aplica();
    mq.addEventListener("change", aplica);
    return () => mq.removeEventListener("change", aplica);
  }, []);

  const oprit = inPauza || opritDeCitire || miscareRedusa;

  /**
   * Intervalul depinde doar de `oprit`, nu și de `activ`: mesajul următor se
   * calculează din starea anterioară, în forma funcțională a lui `setActiv`.
   * Dacă ar depinde de `activ`, temporizatorul s-ar reface la fiecare rotire
   * și fiecare mesaj ar primi de fapt mai puțin de șapte secunde.
   */
  useEffect(() => {
    if (oprit) return;
    const t = setInterval(() => {
      setActiv((i) => (i + 1) % MESAJE.length);
    }, DURATA);
    return () => clearInterval(t);
  }, [oprit]);

  const mesaj = MESAJE[activ];
  const Icon = mesaj.icon;

  return (
    <div
      role="group"
      aria-roledescription="carusel"
      aria-label="Condiții comerciale pentru parteneri"
      onMouseEnter={() => setOpritDeCitire(true)}
      onMouseLeave={() => setOpritDeCitire(false)}
      onFocusCapture={() => setOpritDeCitire(true)}
      onBlurCapture={() => setOpritDeCitire(false)}
      /* Fără `hover:` pe container: bannerul nu reacționează vizual la trecerea
         mouse-ului. Singurele elemente care răspund sunt butoanele. */
      className="mt-5 sm:mt-7 rounded-xl bg-gray-900 overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 px-4 pt-4 sm:px-5">
        <span className="flex items-center justify-center h-9 w-9 shrink-0 rounded-xl bg-white/[0.08] text-avo-300 ring-1 ring-inset ring-white/10">
          <Icon size={17} />
        </span>

        {/* Înălțime fixă și mesaje suprapuse absolut: textele au lungimi
            diferite, iar fără asta bannerul și-ar schimba înălțimea la fiecare
            rotire, împingând cardurile în jos. */}
        <div className="relative flex-1 min-w-0 h-[76px] sm:h-[42px]">
          {MESAJE.map((m, i) => (
            <div
              key={m.href}
              aria-hidden={i !== activ}
              className={`absolute inset-0 transition-opacity duration-500 ${
                i === activ ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <span className="block text-[13px] sm:text-sm font-semibold text-white leading-snug line-clamp-2 sm:line-clamp-1">
                {m.titlu}
              </span>
              <span className="mt-1 block text-[11px] sm:text-xs text-gray-300 leading-snug line-clamp-2 sm:line-clamp-1">
                {m.detaliu}
              </span>
            </div>
          ))}
        </div>

        {/* Buton plin, nu doar text cu săgeată: pe fundal închis, albul e cea
            mai puternică suprafață de acțiune, iar albastrul rămâne rezervat
            prețurilor din carduri. */}
        <Link
          href={mesaj.href}
          className="inline-flex items-center justify-center h-10 px-5 shrink-0 self-start sm:self-auto rounded-xl bg-white text-[13px] font-semibold text-gray-900 transition-colors duration-200 hover:bg-avo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {mesaj.actiune}
        </Link>
      </div>

      {/* ── Indicatori și pauză ──────────────────────────────
          Segmentele sunt și indicator de poziție, și comandă: cel activ se
          umple în cele 7 secunde, deci se vede cât mai e până la schimbare.
          Bara vizibilă are 2px, dar butonul din jurul ei are 16px înălțime,
          ca să rămână o țintă atingibilă cu degetul. */}
      <div className="flex items-center gap-2 px-4 sm:px-5 pb-3 pt-3">
        {MESAJE.map((m, i) => (
          <button
            key={m.href}
            type="button"
            onClick={() => setActiv(i)}
            aria-label={`Mesajul ${i + 1} din ${MESAJE.length}`}
            aria-current={i === activ}
            className="group flex h-4 w-10 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {/* Pista segmentului activ e mai luminoasă decât a celorlalte, ca
                poziția să se vadă și când umplerea e oprită la zero. */}
            <span
              className={`relative block h-0.5 w-full overflow-hidden rounded-full transition-colors ${
                i === activ ? "bg-white/40" : "bg-white/20 group-hover:bg-white/35"
              }`}
            >
              {i === activ ? (
                <span
                  /* `key` pe indexul activ repornește animația de la zero la
                     fiecare schimbare; fără el ar continua de unde rămăsese.
                     La pauză se folosește `animationPlayState`, nu `none`:
                     bara îngheață unde e, în loc să sară la capăt și să mintă
                     că mesajul e pe terminate. */
                  key={activ}
                  className="absolute inset-y-0 left-0 w-0 bg-white"
                  style={{
                    animation: `fillProgress ${DURATA}ms linear forwards`,
                    animationPlayState: oprit ? "paused" : "running",
                  }}
                />
              ) : null}
            </span>
          </button>
        ))}

        {/* WCAG 2.2.2: conținutul care se mișcă singur mai mult de cinci
            secunde trebuie să poată fi oprit. */}
        <button
          type="button"
          onClick={() => setInPauza((v) => !v)}
          aria-label={inPauza ? "Pornește rotirea mesajelor" : "Oprește rotirea mesajelor"}
          className="ml-auto flex items-center justify-center h-6 w-6 rounded-md text-gray-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {inPauza ? <Play size={12} /> : <Pause size={12} />}
        </button>
      </div>
    </div>
  );
}
