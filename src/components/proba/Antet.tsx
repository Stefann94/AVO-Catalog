import Link from "next/link";
import Image from "next/image";
import { FIRMA } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   ANTETUL — replică a prototipului, cu sigla AVO
   ──────────────────────────────────────────────────────────────────────────
   Siglă · căutare mare · Contact · Autentificare · Coș · „Preț instalatori".

   ─── ZERO JAVASCRIPT ──────────────────────────────────────────────────────

   Componentă de server, fără `"use client"`. Pictogramele sunt SVG scrise
   direct în marcaj, nu importate dintr-o bibliotecă: un import de iconițe ar
   intra în încărcătura RSC a fiecărei pagini care folosește antetul, pentru
   șase desene de 19px.

   ─── CE NU FUNCȚIONEAZĂ ÎNCĂ, ȘI DE CE ────────────────────────────────────

   CĂUTAREA e un câmp fără țintă. Site-ul n-are încă o căutare — indexul
   static peste cele 845 de produse e pe listă, nu e scris. Formularul
   trimite pe /catalog, ca să nu fie un câmp care înghite tastele degeaba.

   COȘUL ȘI AUTENTIFICAREA sunt exact butoanele scoase din Navbar la cererea
   ta, fiindcă magazinul e amânat. Aici sunt puse înapoi pentru fidelitate
   vizuală, pe o pagină de probă. Dacă trecem antetul ăsta în producție, ori
   pleacă, ori primesc o țintă reală.
   ══════════════════════════════════════════════════════════════════════════ */

export default function Antet() {
  return (
    <header className="pb-antet">
      <div className="pb-wrap pb-antet-in">
        <Link href="/" className="pb-sigla">
          {/*
            `priority`: sigla e în primul ecran, pe toate paginile. Fără ea,
            Next o încarcă leneș și antetul sare când sosește.
            Raportul e cel al fișierului (1490×173), ca să nu se deformeze.
          */}
          <Image
            src="/logo.png"
            alt={FIRMA.nume}
            width={1490}
            height={173}
            priority
            sizes="(max-width: 820px) 360px, 800px"
          />
        </Link>

        {/* Căutarea. `action` pe /catalog: fără index de căutare, cel puțin
            duce unde se caută, în loc să nu facă nimic. */}
        <form className="pb-caut" action="/catalog">
          <label htmlFor="pb-q" className="sr-only">
            Caută în catalog
          </label>
          <input
            id="pb-q"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Caută invertoare, panouri fotovoltaice sau acumulatori"
          />
          <button type="submit" className="pb-caut-btn">
            <Lupa />
            Caută
          </button>
        </form>

        <div className="pb-actiuni">
          <Link href="/contact" className="pb-buton pb-buton-sters">
            <Telefon />
            <span>Contact</span>
          </Link>

          <Link href="/cerere-oferta" className="pb-buton pb-buton-sters">
            <Persoana />
            <span>Autentificare</span>
          </Link>

          <Link href="/cerere-oferta" className="pb-buton pb-cos">
            <span className="pb-cos-ic">
              <Cos />
              <em className="pb-cos-nr">0</em>
            </span>
            <span className="pb-cos-t">
              <b>Coș</b>
              <i>0 lei</i>
            </span>
          </Link>

          <Link href="/cerere-oferta" className="pb-b2b">
            Preț instalatori
          </Link>
        </div>
      </div>

      <div className="pb-energie" />
    </header>
  );
}

/* ── Pictogramele ──
   `aria-hidden`: fiecare stă lângă textul ei, deci un cititor de ecran le-ar
   citi de două ori. */

function Lupa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function Telefon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 5.2c0 8 6.3 14.3 14.3 14.3l1.7-2.6-3.6-1.8-1.8 1.8a13 13 0 0 1-5.4-5.4l1.8-1.8-1.8-3.6L7.1 3.5 4.5 5.2Z" />
    </svg>
  );
}

function Persoana() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8.2" r="3.7" />
      <path d="M4.6 20.4c0-3.8 3.6-5.9 7.4-5.9s7.4 2.1 7.4 5.9" />
    </svg>
  );
}

function Cos() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4h2.2l2.5 11.6a1.8 1.8 0 0 0 1.8 1.4h8.3a1.8 1.8 0 0 0 1.8-1.4L21.4 8H6.2" />
      <circle cx="10" cy="20.4" r="1.3" />
      <circle cx="18.4" cy="20.4" r="1.3" />
    </svg>
  );
}
