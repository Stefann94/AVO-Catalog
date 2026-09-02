import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BatteryCharging, Cpu, Sun, Wrench } from "lucide-react";
import { perioadaCatalog } from "@/lib/perioada";

/**
 * Gama de produse — categoriile, cu date agregate din catalog.
 *
 * Cifrele sunt calculate din cele 172 de produse importate (tools/catalog-import).
 * La trecerea pe GraphQL se înlocuiesc cu productCategories { count } + agregări
 * de preț, iar perioada vine din meta `_perioada_eticheta`; markup-ul rămâne.
 *
 * "de la" apare DOAR unde e o ancoră onestă. La Sisteme de Montaj cel mai ieftin
 * produs e un suport de 1,87 € — inutil alături de "de la 54 €" — așa că acolo
 * arătăm acoperirea, nu prețul.
 */

// ATENȚIE — placeholder: toate cele trei randări conțin branduri INVENTATE
// (SOLARA·X, VOLTAIC NEXUS, SOLARVOLT). `pozitie` decupează în afara zonelor cu
// logo, dar sunt de înlocuit înainte de lansare.
type Categorie = {
  slug: string;
  nume: string;
  produse: number;
  branduri?: number;
  interval: string;
  descriere: string;
  deLa?: number;
  unitate?: string;
  icon: typeof Sun;
  imagine: string;
  pozitie: string;
};

const CATEGORII: Categorie[] = [
  {
    slug: "panouri-fotovoltaice",
    nume: "Panouri Fotovoltaice",
    produse: 28,
    branduri: 5,
    interval: "410 – 770 Wp",
    descriere: "N-Type TOPCon · 14 modele bifaciale",
    deLa: 54,
    unitate: "panou",
    icon: Sun,
    imagine: "/panel.jpg",
    pozitie: "50% 26%",
  },
  {
    slug: "invertoare",
    nume: "Invertoare",
    produse: 35,
    branduri: 3,
    interval: "3,6 – 125 kW",
    descriere: "Hibride, on-grid și off-grid · mono și trifazate",
    deLa: 355,
    unitate: "buc",
    icon: Cpu,
    imagine: "/inverter.jpg",
    pozitie: "52% 30%",
  },
  {
    slug: "stocare-energie",
    nume: "Stocare Energie",
    produse: 39,
    branduri: 7,
    interval: "4 – 241,5 kWh",
    descriere: "LiFePO4 · low și high voltage",
    deLa: 395,
    unitate: "buc",
    icon: BatteryCharging,
    imagine: "/battery.jpg",
    pozitie: "70% 50%",
  },
  {
    slug: "sisteme-de-montaj",
    nume: "Sisteme de Montaj",
    produse: 51,
    interval: "Structuri și componente",
    descriere: "Acoperiș plat, țiglă, tablă trapezoidală · K2 Systems",
    icon: Wrench,
    imagine: "/hero.jpg",
    pozitie: "50% 46%",
  },
];

const SECUNDARE = [
  { slug: "monitorizare-smart-devices", nume: "Monitorizare & Smart Devices", produse: 8 },
  { slug: "statii-de-incarcare-auto", nume: "Stații de Încărcare Auto", produse: 4 },
  { slug: "accesorii", nume: "Accesorii", produse: 4 },
  { slug: "echipamente-conversie-comutare", nume: "Echipamente Conversie & Comutare", produse: 3 },
];

const eur = (n: number) => n.toLocaleString("ro-RO");

// Când conectăm GraphQL, valoarea vine din meta `_perioada_eticheta`.
const PERIOADA_DIN_CATALOG = "Septembrie 2026";

export default function GamaProduse() {
  const perioada = perioadaCatalog(PERIOADA_DIN_CATALOG);

  return (
    <section className="relative bg-slate-50 py-16 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* ── Masthead ───────────────────────────────────────── */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          {/* Ștampila trece lângă titlu abia de la xl: sub această lățime i-ar
              lăsa titlului ~574px, insuficient pentru un singur rând. */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 xl:gap-6">
            <h2 className="text-[26px] sm:text-[34px] md:text-[40px] lg:text-[42px] font-extrabold text-slate-900 tracking-[-0.03em] sm:tracking-[-0.035em] leading-[1.1] sm:whitespace-nowrap">
              Gama de produse {perioada.eticheta}
            </h2>

            <div className="inline-flex items-center gap-2.5 sm:gap-3 shrink-0 self-start xl:self-auto h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl bg-white ring-1 ring-slate-900/10 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Prețuri valabile
              </span>
              <span aria-hidden className="h-4 w-px bg-slate-200" />
              <span className="font-mono text-xs sm:text-[13px] font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                {perioada.interval}
              </span>
            </div>
          </div>

          <div aria-hidden className="mt-5 sm:mt-7 h-px w-full bg-slate-900/[0.09]" />

          <p className="mt-5 sm:mt-7 max-w-2xl text-slate-500 text-[15px] sm:text-base lg:text-lg leading-relaxed">
            172 de echipamente în stoc, de la panouri și invertoare la sisteme de montaj.
            Prețuri de distribuitor pentru instalatori și revânzători, din 9 depozite naționale.
          </p>
        </div>

        {/* ── Categorii ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {CATEGORII.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.slug}
                href={`/catalog/${c.slug}`}
                className="group flex flex-col rounded-2xl bg-white p-3 ring-1 ring-slate-900/[0.08] shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_28px_-14px_rgb(15_23_42/0.18)] transition-all duration-300 hover:ring-slate-900/20 hover:shadow-[0_1px_2px_rgb(15_23_42/0.04),0_24px_44px_-16px_rgb(15_23_42/0.28)]"
              >
                {/* Imaginea e clară în repaus, fără blur. Efectul apare la hover:
                    un voal albastru discret, ca semnal de interacțiune. */}
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100">
                  <Image
                    src={c.imagine}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 300px"
                    style={{ objectPosition: c.pozitie }}
                    className="object-cover"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-blue-950/0 transition-colors duration-300 ease-out group-hover:bg-blue-950/20"
                  />

                  <span className="absolute bottom-3 left-3 flex items-center justify-center h-9 w-9 rounded-xl bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
                    <Icon size={17} />
                  </span>

                  <span className="absolute top-3 right-3 inline-flex items-center h-6 px-2.5 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-600 tabular-nums shadow-sm">
                    {c.produse} produse
                  </span>
                </div>

                {/* Conținut */}
                <div className="flex flex-col flex-1 px-3 pt-4 pb-2">
                  <h3 className="h-12 text-[17px] font-bold text-slate-900 leading-snug tracking-tight line-clamp-2">
                    {c.nume}
                  </h3>

                  <div className="h-[52px] mt-1">
                    <div className="text-[13px] font-semibold text-slate-700 tabular-nums">
                      {c.interval}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400 leading-tight line-clamp-2">
                      {c.descriere}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-900/[0.07] flex items-end justify-between gap-3 min-h-[52px]">
                    <div className="min-w-0">
                      {c.deLa ? (
                        <>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
                            de la
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[26px] font-extrabold text-slate-900 tabular-nums leading-none tracking-tight">
                              {eur(c.deLa)}
                            </span>
                            <span className="text-base font-bold text-slate-400">€</span>
                            <span className="ml-1 text-[10px] text-slate-400 truncate">
                              / {c.unitate}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-[13px] font-semibold text-slate-600 leading-tight">
                          Componente
                          <br />
                          <span className="font-normal text-slate-400">și structuri complete</span>
                        </div>
                      )}
                    </div>

                    <span
                      aria-hidden
                      className="flex items-center justify-center h-8 w-8 shrink-0 rounded-full text-slate-300 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white"
                    >
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Categorii secundare ────────────────────────────── */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          {SECUNDARE.map((s) => (
            <Link
              key={s.slug}
              href={`/catalog/${s.slug}`}
              className="inline-flex items-center gap-2.5 h-10 pl-4 pr-3 rounded-xl bg-white ring-1 ring-slate-900/10 shadow-sm text-[13px] font-semibold text-slate-700 transition-colors duration-300 hover:ring-slate-900/25 hover:text-blue-600"
            >
              {s.nume}
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 tabular-nums">
                {s.produse}
              </span>
            </Link>
          ))}
        </div>

        {/* ── Subsol ─────────────────────────────────────────── */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Prețurile sunt exprimate în EUR, fără TVA. Taxa verde DEEE nu este inclusă
            (0,7 RON / kg). Disponibilitatea se confirmă la plasarea comenzii.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 sm:px-6 w-full sm:w-auto shrink-0 rounded-xl bg-slate-900 text-[13px] font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-blue-600"
          >
            Vezi catalogul complet
            <ArrowRight size={15} className="shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  );
}
