/* ══════════════════════════════════════════════════════════════════════════
   BANDA DE ANUNȚ — „MAGAZINUL ONLINE NU ESTE ÎNCĂ ACTIV"
   ──────────────────────────────────────────────────────────────────────────
   Stă deasupra tuturor rândurilor barei, pe toată lățimea, și se derulează
   continuu.

   ─── E TEMPORARĂ, ȘI E CONSTRUITĂ CA SĂ SE POATĂ SCOATE ÎNTR-UN MINUT ────

   Două atingeri o scot de tot:
     1. rândul <BandaLucru /> din components/Navbar.tsx;
     2. `--inaltime-banda-lucru: 28px` → `0px`, în app/globals.css.

   Al doilea punct e motivul pentru care înălțimea e o variabilă și nu o cifră
   scrisă în trei locuri: paginile își coboară conținutul cu
   `--inaltime-navbar`, iar aceea o include. Pusă pe zero, tot site-ul revine
   exact la geometria de dinainte, fără să umble nimeni prin pagini.

   ─── ZERO JAVASCRIPT ─────────────────────────────────────────────────────

   Fișierul n-are `"use client"`. Derularea e o animație CSS pe `transform`,
   rezolvată de compozitor — nu atinge firul principal, deci nu strică munca
   de viteză de dinainte. Din același motiv nu există buton de închidere: ar fi
   cerut stare, adică JavaScript pe fiecare pagină din site.

   ─── DE CE TEXTUL E ĂSTA ─────────────────────────────────────────────────

   Cerința e să se vadă clar că nu se poate cumpăra acum. Partea aceea e
   scoasă în evidență — îngroșată, restul mesajului la 85% opacitate — fiindcă
   e singura informație care schimbă ce face vizitatorul în minutul următor.

   NU SCRIE „magazinul nu funcționează". Un magazin care nu funcționează e unul
   stricat; ăsta n-a fost niciodată pornit, iar coșul se activează când decide
   conducerea. „Nu este încă activ" spune adevărul și nu sugerează o defecțiune.

   NU SCRIE NIMIC DESPRE PREȚURI. Dacă sunt ferme sau orientative nu e stabilit
   încă, iar o bandă care promite una dintre ele ar fi o invenție cu consecințe
   comerciale reale.

   Ce urmează după anunț e drumul care chiar funcționează azi: formularul,
   telefonul, e-mailul.
   ══════════════════════════════════════════════════════════════════════════ */

/** Partea scoasă în evidență. Scurtă intenționat: se citește din mers. */
const ANUNT = "MAGAZINUL ONLINE NU ESTE ÎNCĂ ACTIV";

/** Restul, mai discret. */
const CONTINUARE =
  "Site în lucru · Poți cere ofertă prin formular, telefon sau e-mail · contact@avogrupinvest.ro";

/**
 * De câte ori se scrie mesajul într-o jumătate de pistă.
 *
 * Nu e ornament. Pista conține lista de DOUĂ ori, iar animația o deplasează cu
 * exact 50% — adică fix o jumătate — deci reluarea e invizibilă doar dacă o
 * jumătate e mai lată decât ecranul. Altfel ar apărea un gol care traversează
 * banda la fiecare tur.
 *
 * Mesajul are ~130 de caractere; la 11px cu `tracking-wider` iese ~870px.
 * Patru repetări dau ~3500px pe jumătate, deci acoperă cu mult și un ecran de
 * 2560px. Cine scurtează mult mesajul trebuie să crească cifra asta.
 */
const REPETARI = 4;

export default function BandaLucru() {
  const set = Array.from({ length: REPETARI }, (_, i) => (
    <span key={i} className="px-5 sm:px-8">
      <strong className="font-bold">{ANUNT}</strong>
      <span className="text-white/85"> · {CONTINUARE}</span>
    </span>
  ));

  return (
    /* `h-7` (28px) declarat, nu dedus din text: cifra asta intră în
       `--inaltime-banda-lucru` din globals.css. O bandă care își schimbă
       înălțimea după conținut ar face variabila aceea o minciună — aceeași
       regulă ca la celelalte rânduri ale barei. */
    <div className="h-7 shrink-0 overflow-hidden bg-red-600 text-white">
      {/*
        Citit o singură dată de cititoarele de ecran.

        Pista de dedesubt e `aria-hidden`: acolo mesajul apare de opt ori, iar
        un cititor de ecran l-ar fi anunțat de opt ori la intrarea pe FIECARE
        pagină din site.
      */}
      <p className="sr-only">
        {ANUNT}. {CONTINUARE}
      </p>

      <div
        aria-hidden
        className="banda-lucru-pista flex h-full w-max items-center whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider"
      >
        <div className="flex shrink-0 items-center">{set}</div>
        <div className="flex shrink-0 items-center">{set}</div>
      </div>
    </div>
  );
}
