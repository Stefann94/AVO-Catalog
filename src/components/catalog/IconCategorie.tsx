/* ══════════════════════════════════════════════════════════════════════════
   ICONURILE CATEGORIILOR
   ──────────────────────────────────────────────────────────────────────────
   Câte unul pentru fiecare din cele opt categorii de nivel 1, în capul
   ferestrei care se deschide sub dala ei.

   ─── DE CE DESENATE AICI, ȘI NU LUATE DIN lucide ─────────────────────────

   Setul de iconuri al site-ului (lucide) e folosit peste tot altundeva și
   rămâne: săgeți, telefon, coș, bifă. Dar el n-are un panou fotovoltaic, n-are
   un invertor și n-are o clemă de montaj — are un soare, un fulger și o cheie.
   Puse aici, cele opt categorii ar fi primit opt metafore, nu opt obiecte: un
   fulger pentru invertoare și tot un fulger pentru stațiile de încărcare.

   Cerința a fost „iconuri calitative", cu exemplul unui magazin de materiale
   unde fiecare categorie are desenul lucrului din ea. Așa sunt și astea: se
   vede panoul cu celulele lui, cutia invertorului cu presetupele de jos,
   rastelul de acumulatori, șina cu clema.

   ─── REȚETA COMUNĂ ───────────────────────────────────────────────────────

   24×24, contur de 1,5px, capete și îmbinări rotunjite, `currentColor`. Fără
   umpluturi: pe un rând de meniu, o formă plină ar cântări mai mult decât
   textul de lângă ea. Grosimea e aceeași cu a iconurilor lucide din site, ca
   un icon desenat aici și unul luat de acolo să nu se bată pe aceeași pagină.

   Cifrele sunt alese ca desenul să stea pe grila de 24 fără sub-pixeli: linii
   la .5 acolo unde conturul e vertical sau orizontal, ca să cadă pe pixel
   întreg la 1× și să nu iasă cenușiu.

   ─── CE SE ÎNTÂMPLĂ CU O CATEGORIE NOUĂ ──────────────────────────────────

   Nu se strică nimic: `ICOANE` e un dicționar după slug, iar ce nu e în el
   primește desenul generic (o cutie). Categoria apare, cu icon neutru, până
   când i se desenează unul al ei.
   ══════════════════════════════════════════════════════════════════════════ */

type Props = { slug: string; className?: string };

const COMUN = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/* Panou fotovoltaic: rama în perspectivă, cu cele două rânduri de celule și
   piciorul de sprijin. */
function Panou() {
  return (
    <svg {...COMUN} aria-hidden>
      <path d="M4.2 4.5h15.6l1.7 9.5H2.5z" />
      <path d="M3.4 9.25h17.2" />
      <path d="M9.4 4.5 8.2 14" />
      <path d="M14.6 4.5 15.8 14" />
      <path d="M12 14v3" />
      <path d="M8.5 20h7" />
      <path d="M12 17v3" />
    </svg>
  );
}

/* Invertor: cutie de perete cu ecran și cele trei presetupe de jos. */
function Invertor() {
  return (
    <svg {...COMUN} aria-hidden>
      <rect x="4.5" y="3.5" width="15" height="14" rx="1.8" />
      <rect x="8" y="6.5" width="8" height="5" rx="0.8" />
      <path d="M8 14.5h3" />
      <path d="M8.5 17.5v2" />
      <path d="M12 17.5v2" />
      <path d="M15.5 17.5v2" />
    </svg>
  );
}

/* Acumulator: rastel de trei module, cu indicatorul de încărcare pe primul. */
function Acumulator() {
  return (
    <svg {...COMUN} aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="5" rx="1.2" />
      <rect x="3.5" y="9.5" width="17" height="5" rx="1.2" />
      <rect x="3.5" y="15.5" width="17" height="5" rx="1.2" />
      <path d="M6.5 6h3" />
      <path d="M6.5 12h3" />
      <path d="M6.5 18h3" />
      <path d="M17 6h.01" />
      <path d="M17 12h.01" />
      <path d="M17 18h.01" />
    </svg>
  );
}

/* Siguranță pe șină DIN: corpul modulului, maneta ridicată și șina de sub el.

   A FOST MAI DETALIATĂ ȘI NU SE CITEA. Prima variantă avea corpul, o fereastră
   interioară, o tijă și două picioare — șase forme într-un pătrat de 18px, care
   la mărimea de folosire se adunau într-o pată. Acum are patru: corpul, maneta,
   linia de etichetă și șina. Un icon de meniu se citește într-o zecime de
   secundă; ce nu se distinge acolo nu e detaliu, e zgomot. */
function Siguranta() {
  return (
    <svg {...COMUN} aria-hidden>
      <rect x="7.5" y="4.5" width="9" height="11" rx="1.2" />
      <path d="M12 6.5v3.5" />
      <path d="M9.5 12.5h5" />
      <path d="M3.5 18.5h17" />
      <path d="M9.5 15.5v3" />
      <path d="M14.5 15.5v3" />
    </svg>
  );
}

/* Stație de încărcare: stâlpul cu ecran, brațul cablului și pistoletul.

   Stâlpul s-a îngustat cu un pixel și pistoletul s-a mărit: la 20px, un
   pistolet de 3,4 unități era o pată, iar el e singurul lucru care deosebește
   desenul ăsta de un simplu automat de perete. */
function Statie() {
  return (
    <svg {...COMUN} aria-hidden>
      <rect x="3.5" y="2.5" width="9" height="16" rx="1.6" />
      <rect x="6" y="5" width="4" height="3.5" rx="0.6" />
      <path d="M8 11.5v3" />
      <path d="M2.5 21.5h11" />
      <path d="M12.5 8h2.2a2.3 2.3 0 0 1 2.3 2.3v3.7" />
      <path d="M14.8 14h4.4v3.6a2.2 2.2 0 0 1-4.4 0z" />
    </svg>
  );
}

/* Contor inteligent: cadran cu ac și unda de transmisie. */
function Contor() {
  return (
    <svg {...COMUN} aria-hidden>
      <rect x="3.5" y="3.5" width="13" height="17" rx="1.8" />
      <circle cx="10" cy="9.5" r="3.2" />
      <path d="M10 9.5 11.8 7.8" />
      <path d="M7 16.5h6" />
      <path d="M19 8.5a5 5 0 0 1 0 7" />
      <path d="M21.2 6a8 8 0 0 1 0 12" />
    </svg>
  );
}

/* Sistem de montaj: șina de aluminiu, clema de mijloc și cârligul de prindere. */
function Montaj() {
  return (
    <svg {...COMUN} aria-hidden>
      <path d="M2.5 12.5h19" />
      <path d="M2.5 15.5h19" />
      <path d="M9 8.5h6v4H9z" />
      <path d="M12 4.5v4" />
      <path d="M6 15.5v3.5c0 1 .8 1.5 1.8 1.5" />
      <path d="M18 15.5v3.5c0 1-.8 1.5-1.8 1.5" />
    </svg>
  );
}

/* Accesorii: cablu solar cu conectorul MC4 la capăt. */
function Accesorii() {
  return (
    <svg {...COMUN} aria-hidden>
      <path d="M2.5 7.5h4.5a3 3 0 0 1 3 3v3a3 3 0 0 0 3 3h1.5" />
      <rect x="14.5" y="13.5" width="7" height="6" rx="1.4" />
      <path d="M17 13.5v-2" />
      <path d="M19 13.5v-2" />
      <circle cx="4" cy="7.5" r="1.5" />
    </svg>
  );
}

/* Rezerva: o cutie. Nu spune nimic despre categorie, dar nici nu minte. */
function Generic() {
  return (
    <svg {...COMUN} aria-hidden>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5 12 12l8.5-4.5" />
      <path d="M12 12v9" />
    </svg>
  );
}

const ICOANE: Record<string, () => React.ReactElement> = {
  "panouri-fotovoltaice": Panou,
  invertoare: Invertor,
  "stocare-energie": Acumulator,
  "echipamente-conversie-comutare": Siguranta,
  "statii-de-incarcare-auto": Statie,
  "monitorizare-smart-devices": Contor,
  "sisteme-de-montaj": Montaj,
  accesorii: Accesorii,
};

export default function IconCategorie({ slug, className }: Props) {
  const Desen = ICOANE[slug] ?? Generic;
  return (
    <span className={className} aria-hidden>
      <Desen />
    </span>
  );
}
