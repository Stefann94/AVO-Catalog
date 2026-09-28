import Link from "next/link";
import type { CategorieFiltru } from "@/lib/panou";
import { FIRMA } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   BARA ALBASTRĂ DE CATEGORII — replică a prototipului
   ──────────────────────────────────────────────────────────────────────────
   Buton „Catalog" · categoriile cu pictogramă · localitatea · cu/fără TVA.

   Categoriile vin din WooCommerce, prin `incarcaBaraFiltre()`. Prototipul
   are șapte scrise de mână; aici sunt ale noastre, în ordinea din catalog,
   iar dacă apare a noua, apare și în bară fără să umble nimeni în cod.

   ─── DOUĂ LUCRURI CARE ARATĂ, DAR NU FAC ──────────────────────────────────

   COMUTATORUL cu TVA / fără TVA e deocamdată static, pe „fără TVA". Ca să
   funcționeze are nevoie de al doilea set de prețuri: ale noastre sunt în
   euro, fără TVA. Se poate calcula (×1,21), dar atunci trebuie schimbat
   fiecare preț de pe site, nu doar butonul — altă etapă.

   LOCALITATEA arată unde e firma, nu un depozit de ridicare. Prototipul are
   nouă depozite; noi n-avem lista, iar o pastilă care spune „ridici din" ar
   promite ceva ce nu știm dacă există.
   ══════════════════════════════════════════════════════════════════════════ */

/** Câte categorii intră în bară. Peste atât se rupe rândul la 1440px. */
const IN_BARA = 7;

export default function BaraCategorii({ categorii }: { categorii: CategorieFiltru[] }) {
  /* Cele mai mari categorii primele: bara e o intrare în marfă, iar prima
     poziție merită categoria în care chiar există de ales. */
  const afisate = [...categorii].sort((a, b) => b.produse - a.produse).slice(0, IN_BARA);

  return (
    <nav className="pb-bara" aria-label="Categorii">
      <div className="pb-wrap pb-bara-in">
        <Link href="/catalog" className="pb-catalog-btn">
          <Linii />
          Catalog
        </Link>

        <ul className="pb-bara-l">
          {afisate.map((c) => (
            <li key={c.slug}>
              <Link href={`/catalog/${c.slug}`}>
                <span className="pb-bara-ic">{pictograma(c.slug)}</span>
                {scurt(c.nume)}
              </Link>
            </li>
          ))}

          {/* Poziția aprinsă. În prototip e „Configurator", pe care noi n-avem
              ce să-l trimitem nicăieri. Lichidarea de stoc e ce avem care
              merită culoare: e perisabilă, deci e singura care chiar cere să
              fie citită acum. */}
          <li className="pb-aprins">
            <Link href="/catalog/lichidare-stoc">
              <span className="pb-bara-ic">
                <Eticheta />
              </span>
              Lichidare de stoc
            </Link>
          </li>
        </ul>

        <div className="pb-bara-r">
          <span className="pb-depozit">
            <Pin />
            <b>{FIRMA.adresa.oras}</b>
          </span>

          <div className="pb-tva">
            <span>cu TVA</span>
            <span className="pb-aprins">fără TVA</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * Numele scurtat pentru bară.
 *
 * „Echipamente Conversie & Comutare" pe un rând cu alte șase categorii rupe
 * bara. Tăierea e pe cuvântul purtător, nu pe număr de caractere: din
 * „Stații de Încărcare Auto" contează „Încărcare auto".
 */
function scurt(nume: string) {
  const taieri: Record<string, string> = {
    "Panouri Fotovoltaice": "Panouri",
    "Stocare Energie": "Acumulatori",
    "Sisteme de Montaj": "Montaj",
    "Stații de Încărcare Auto": "Încărcare auto",
    "Monitorizare & Smart Devices": "Monitorizare",
    "Echipamente Conversie & Comutare": "Comutare",
  };
  return taieri[nume] ?? nume;
}

/* ── Pictogramele, câte una pe categorie ──
   Desenate pe aceeași grilă de 24 și cu aceeași grosime de linie, ca rândul
   să pară dintr-o bucată. Cine n-are pictogramă primește cerculețul neutru,
   nu un gol care ar strâmba spațierea. */

function pictograma(slug: string) {
  switch (slug) {
    case "panouri-fotovoltaice":
      return <Panou />;
    case "invertoare":
      return <Invertor />;
    case "stocare-energie":
      return <Baterie />;
    case "sisteme-de-montaj":
      return <Acoperis />;
    case "statii-de-incarcare-auto":
      return <Statie />;
    case "monitorizare-smart-devices":
      return <Ecran />;
    case "accesorii":
      return <Cablu />;
    default:
      return <Scut />;
  }
}

/** Atributele comune tuturor desenelor. */
const linie = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function Panou() {
  return (
    <svg {...linie}>
      <rect x="2.5" y="4" width="19" height="12.5" rx="1.4" />
      <path d="M2.5 10.2h19M9 4v12.5M15 4v12.5M8.5 20.5h7M12 16.5v4" />
    </svg>
  );
}

function Invertor() {
  return (
    <svg {...linie}>
      <rect x="4" y="3" width="16" height="18" rx="2.4" />
      <path d="M13 7l-4 5.5h3L11 17l4-5.5h-3L13 7Z" />
    </svg>
  );
}

function Baterie() {
  return (
    <svg {...linie}>
      <rect x="2.5" y="7" width="15" height="10" rx="2.2" />
      <path d="M20.5 10.5v3M6 10.5v3M9.5 10.5v3M13 10.5v3" />
    </svg>
  );
}

function Acoperis() {
  return (
    <svg {...linie}>
      <path d="M3 20h18M6 20V9l6-4 6 4v11M6 13h12M12 5v15" />
    </svg>
  );
}

function Statie() {
  return (
    <svg {...linie}>
      <rect x="3" y="4" width="11" height="16" rx="2" />
      <path d="M8.6 8.5 6.4 12.6h3.4L7.8 16.5M17 8v8a2.2 2.2 0 0 0 4.4 0V11l-2.2-3" />
    </svg>
  );
}

function Ecran() {
  return (
    <svg {...linie}>
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="m6.5 13 3-4 2.6 2.8L16 7.5M8.5 20.5h7" />
    </svg>
  );
}

function Cablu() {
  return (
    <svg {...linie}>
      <path d="M5 3v6a4 4 0 0 0 8 0V3M7 3v3M11 3v3M9 15v2a4 4 0 0 0 8 0v-5M15 12h4" />
    </svg>
  );
}

function Scut() {
  return (
    <svg {...linie}>
      <path d="M12 2.8 20 6v6.2c0 4.9-3.4 8.1-8 9.2-4.6-1.1-8-4.3-8-9.2V6l8-3.2Z" />
      <path d="m9.2 12 2 2 3.6-4" />
    </svg>
  );
}

function Eticheta() {
  return (
    <svg {...linie}>
      <path d="M3.5 12.4V4.5a1 1 0 0 1 1-1h7.9a1 1 0 0 1 .7.3l7 7a1 1 0 0 1 0 1.4l-7.9 7.9a1 1 0 0 1-1.4 0l-7-7a1 1 0 0 1-.3-.7Z" />
      <circle cx="7.8" cy="7.8" r="1.4" />
    </svg>
  );
}

function Linii() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

function Pin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}
