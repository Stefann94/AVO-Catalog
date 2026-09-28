import Link from "next/link";
import Image from "next/image";
import type { Produs } from "@/lib/produs";
import { BRANDURI, gasesteBrand } from "@/lib/branduri";

/* ══════════════════════════════════════════════════════════════════════════
   HERO — carusel + trei casete + cinci reclame de categorie
   ──────────────────────────────────────────────────────────────────────────
   Structura e a prototipului Projects/Solarone.ro, măsurată la 1440px.
   Conținutul e al nostru: fiecare cifră de aici e numărată din catalog, la
   randare. Nimic scris de mână, deci nimic care poate rămâne în urmă.

   ─── CARUSELUL NU ADUCE JAVASCRIPT ────────────────────────────────────────

   Cinci `<input type="radio">` ascunse țin starea, `<label>`-urile sunt
   săgețile și bulinele, iar `:has()` mută pista (vezi proba.css). Prototipul
   folosește un script; aici n-avem nevoie de el.

   Conta: hero-ul e elementul LCP al paginii. Un carusel cu JS întârzie exact
   imaginea după care se măsoară. Pe fișa de produs am avut deja cazul —
   firul principal ocupat 772 ms, iar fotografia aștepta după el.

   Ce pierdem: rotirea automată. Aia chiar cere JS. De discutat dacă merită,
   fiindcă ar aduce înapoi costul de mai sus.

   ─── CE NU SCRIE AICI ─────────────────────────────────────────────────────

   Prototipul spune „Livrare în 24–48 h din 9 depozite", „Stoc real", „Ridici
   azi", „Garanție 10 ani". Nu le-am copiat: n-avem depozite confirmate,
   coloana de stoc e goală la toate cele 845 de produse, iar despre garanție
   nu ne-a confirmat nimeni nimic. Locurile lor sunt ocupate de ce se poate
   număra — câte produse, ce mărci, de la ce preț.
   ══════════════════════════════════════════════════════════════════════════ */

/** Categoriile care intră în hero, în ordinea diapozitivelor și a reclamelor. */
const IN_HERO = [
  { slug: "invertoare", tema: "pb-d-invertoare", inchis: true },
  { slug: "panouri-fotovoltaice", tema: "pb-d-panouri", inchis: false },
  { slug: "stocare-energie", tema: "pb-d-stocare", inchis: true },
  { slug: "sisteme-de-montaj", tema: "pb-d-montaj", inchis: false },
  { slug: "statii-de-incarcare-auto", tema: "pb-d-incarcare", inchis: true },
] as const;

const euro = (n: number) =>
  n.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Numele mărcii → slug-ul siglei din public/branduri/color/. */


type Strans = {
  slug: string;
  nume: string;
  cate: number;
  minPret?: number;
  marca?: { nume: string; slug: string };
  poza?: { url: string; alt: string };
};

/** Tot ce afișăm despre o categorie, numărat din produsele ei. */
function strange(produse: Produs[], slug: string): Strans | null {
  const ale = produse.filter((p) => p.categorie?.slug === slug);
  if (ale.length === 0) return null;

  const preturi = ale.map((p) => p.pret).filter((n): n is number => typeof n === "number" && n > 0);

  /* Marca reprezentativă: cea cu cele mai multe produse în categorie, dintre
     cele care au siglă. Fără sigla, plăcuța ar rămâne goală. */
  const dupaMarca = new Map<string, number>();
  for (const p of ale) {
    if (!p.brand) continue;
    dupaMarca.set(p.brand, (dupaMarca.get(p.brand) ?? 0) + 1);
  }
  let marca: Strans["marca"];
  for (const [nume] of [...dupaMarca].sort((a, b) => b[1] - a[1])) {
    const s = gasesteBrand(nume)?.slug;
    if (s) {
      marca = { nume, slug: s };
      break;
    }
  }

  /* Fotografia: primul produs al mărcii alese care are una; altfel primul
     produs cu fotografie din categorie. 343 din 845 n-au. */
  const cuPoza = ale.filter((p) => p.imagine);
  const ales = cuPoza.find((p) => p.brand === marca?.nume) ?? cuPoza[0];

  return {
    slug,
    nume: ale[0].categorie?.nume ?? slug,
    cate: ale.length,
    minPret: preturi.length ? Math.min(...preturi) : undefined,
    marca,
    poza: ales?.imagine ? { url: ales.imagine.url, alt: ales.imagine.alt ?? ales.nume } : undefined,
  };
}

export default function Hero({
  produse,
  lichidare,
}: {
  produse: Produs[];
  /** Câte produse sunt în lichidare. Vine din bara de filtre. */
  lichidare: number;
}) {
  const cat = new Map<string, Strans>();
  for (const { slug } of IN_HERO) {
    const s = strange(produse, slug);
    if (s) cat.set(slug, s);
  }

  const inv = cat.get("invertoare");
  const pan = cat.get("panouri-fotovoltaice");
  const sto = cat.get("stocare-energie");
  const mon = cat.get("sisteme-de-montaj");

  /* Produsul pentru caseta de preț la volum: cel cu cea mai mare diferență
     între prețul de listă și cel de la prag. E singura comparație de preț pe
     care o putem arăta fără să inventăm — cifrele sunt amândouă în catalog. */
  const laVolum = produse
    .filter((p) => p.pret && p.pretVolum && p.prag && p.pret > p.pretVolum)
    .sort((a, b) => b.pret! - b.pretVolum! - (a.pret! - a.pretVolum!))[0];

  /* Cele două produse din caseta de ofertă: un invertor și un acumulator,
     alese dintre cele cu fotografie. */
  const duo = [inv?.poza, sto?.poza].filter((x): x is NonNullable<typeof x> => Boolean(x));

  const diapozitive = construieste({ inv, pan, sto, mon });

  return (
    <section className="pb-promo">
      <div className="pb-wrap">
        <div className="pb-promo-sus">
          {/* ══ CARUSELUL ══ */}
          <div className="pb-carusel">
            {diapozitive.map((_, i) => (
              <input
                key={i}
                type="radio"
                name="pb-diapo"
                id={`pb-d${i}`}
                defaultChecked={i === 0}
                aria-label={`Reclama ${i + 1} din ${diapozitive.length}`}
              />
            ))}

            <div className="pb-pista">
              {diapozitive.map((d, i) => (
                <article key={d.titlu} className="pb-diapo">
                  <div className={`pb-diapo-txt${d.chihlimbar ? " pb-chihlimbar" : ""}`}>
                    <span className="pb-eticheta">{d.eticheta}</span>
                    <h2>
                      {d.titlu}
                      <br />
                      <b>{d.subtitlu}</b>
                    </h2>
                    <p>{d.text}</p>
                    <Link href={d.adresa} className="pb-diapo-btn">
                      {d.buton}
                    </Link>
                    <span className="pb-nota">{d.nota}</span>
                  </div>

                  <div className="pb-diapo-img">
                    {d.poza ? (
                      /*
                        Doar primul diapozitiv e `priority`: el e elementul
                        LCP. Celelalte patru sunt leneșe — stau în afara
                        zonei vizibile, tăiate de `overflow:hidden`, deci
                        browserul nu le cere până nu ajung în dreptul ei.
                      */
                      <Image
                        src={d.poza.url}
                        alt={d.poza.alt}
                        width={420}
                        height={300}
                        sizes="(max-width: 820px) 0px, 420px"
                        priority={i === 0}
                        loading={i === 0 ? undefined : "lazy"}
                      />
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            {/* Săgețile: câte o pereche pe diapozitiv, ca fiecare să poată
                trimite la vecinii ei. Se vede doar perechea celui bifat. */}
            {diapozitive.map((_, i) => {
              const n = diapozitive.length;
              return (
                <div key={i} className="pb-sageti" data-i={i}>
                  <label
                    className="pb-sageata pb-inapoi"
                    htmlFor={`pb-d${(i - 1 + n) % n}`}
                    title="Reclama anterioară"
                  >
                    ‹
                  </label>
                  <label
                    className="pb-sageata pb-inainte"
                    htmlFor={`pb-d${(i + 1) % n}`}
                    title="Reclama următoare"
                  >
                    ›
                  </label>
                </div>
              );
            })}

            <div className="pb-buline">
              {diapozitive.map((d, i) => (
                <label key={d.titlu} htmlFor={`pb-d${i}`} title={d.titlu} />
              ))}
            </div>
          </div>

          {/* ══ CELE TREI CASETE ══ */}
          <aside className="pb-casete">
            <Link href="/cerere-oferta" className="pb-caseta pb-cfg">
              <span className="pb-caseta-l">
                <span className="pb-caseta-k">Cerere de ofertă</span>
                <b>
                  Spune-ne ce îți trebuie,
                  <br />
                  primești preț la listă
                </b>
                <span className="pb-caseta-c">Trimite lista →</span>
              </span>
              <span className="pb-caseta-r">
                <span className="pb-duo">
                  {duo.map((p, i) => (
                    <span key={p.url} style={{ display: "contents" }}>
                      {i > 0 ? <span className="pb-plus">+</span> : null}
                      <Image src={p.url} alt="" width={90} height={64} sizes="90px" loading="lazy" />
                    </span>
                  ))}
                </span>
              </span>
            </Link>

            <Link href="/catalog/lichidare-stoc" className="pb-caseta pb-stoc">
              <span className="pb-caseta-l">
                <span className="pb-caseta-k">Lichidare de stoc</span>
                <b>{lichidare} produse la preț redus, cât mai sunt</b>
                <span className="pb-marci">
                  {BRANDURI.slice(0, 4).map((b) => (
                    <span key={b.slug}>{b.nume}</span>
                  ))}
                </span>
              </span>
              <span className="pb-caseta-r">
                {pan?.poza ? (
                  <Image
                    className="pb-caseta-una"
                    src={pan.poza.url}
                    alt=""
                    width={132}
                    height={88}
                    sizes="132px"
                    loading="lazy"
                  />
                ) : null}
                <span className="pb-insigna">reduse</span>
              </span>
            </Link>

            {laVolum ? (
              <Link href={`/catalog/produs/${laVolum.slug}`} className="pb-caseta pb-b2b-caseta">
                <span className="pb-caseta-l">
                  <span className="pb-caseta-k">Preț la volum</span>
                  <b>Prețul tău de la {laVolum.prag}</b>
                  <span className="pb-pret">
                    <s>{euro(laVolum.pret!)} €</s>
                    <strong>{euro(laVolum.pretVolum!)} €</strong>
                  </span>
                </span>
                <span className="pb-caseta-r">
                  {laVolum.imagine ? (
                    <Image
                      className="pb-caseta-una"
                      src={laVolum.imagine.url}
                      alt=""
                      width={132}
                      height={88}
                      sizes="132px"
                      loading="lazy"
                    />
                  ) : null}
                </span>
              </Link>
            ) : null}
          </aside>
        </div>

        {/* ══ CELE CINCI RECLAME DE CATEGORIE ══ */}
        <div className="pb-dale">
          {IN_HERO.map(({ slug, tema, inchis }) => {
            const c = cat.get(slug);
            if (!c) return null;
            return (
              <Link key={slug} href={`/catalog/${slug}`} className={`pb-dala ${tema}`}>
                {c.marca ? (
                  <Image
                    className={`pb-dala-marca ${inchis ? "pb-sus-dreapta" : "pb-jos-stanga"}`}
                    src={`/branduri/color/${c.marca.slug}.webp`}
                    alt={c.marca.nume}
                    width={140}
                    height={38}
                    sizes="140px"
                    loading="lazy"
                  />
                ) : null}

                <span className="pb-dala-t">
                  <span className={`pb-dala-k${inchis ? "" : " pb-deschis"}`}>
                    {c.marca ? c.marca.nume : "În catalog"}
                  </span>
                  <b>{c.nume}</b>
                  <span className={`pb-dala-sub${inchis ? "" : " pb-inchis"}`}>
                    {c.cate} {c.cate === 1 ? "produs" : "de produse"} în catalog
                  </span>
                </span>

                {c.poza ? (
                  <Image
                    className="pb-dala-img"
                    src={c.poza.url}
                    alt=""
                    width={260}
                    height={200}
                    sizes="(max-width: 820px) 180px, 260px"
                    loading="lazy"
                  />
                ) : null}

                {c.minPret ? (
                  <span className="pb-dala-pret">
                    de la <b>{euro(c.minPret)} €</b>
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   DIAPOZITIVELE
   ──────────────────────────────────────────────────────────────────────────
   Textele sunt scrise de noi, iar cifrele din ele vin din catalog, calculate
   mai sus. Dacă o categorie lipsește la un import, diapozitivul ei nu apare —
   nu rămâne un slot cu „0 produse".
   ══════════════════════════════════════════════════════════════════════════ */

type Diapo = {
  eticheta: string;
  titlu: string;
  subtitlu: string;
  text: string;
  buton: string;
  adresa: string;
  nota: string;
  poza?: { url: string; alt: string };
  chihlimbar?: boolean;
};

function construieste(c: {
  inv?: Strans;
  pan?: Strans;
  sto?: Strans;
  mon?: Strans;
}): Diapo[] {
  const d: Diapo[] = [];

  if (c.inv) {
    d.push({
      eticheta: c.inv.marca ? `Cea mai mare marcă: ${c.inv.marca.nume}` : "Invertoare",
      titlu: "Invertoare",
      subtitlu: "la preț de distribuitor",
      text: `${c.inv.cate} de modele în catalogul lunii, hibride, on-grid și off-grid.`,
      buton: "Vezi invertoarele",
      adresa: "/catalog/invertoare",
      nota: c.inv.minPret ? `De la ${euro(c.inv.minPret)} € bucata, fără TVA.` : "Prețuri fără TVA.",
      poza: c.inv.poza,
    });
  }

  /* Diapozitivul chihlimbariu: singurul care nu vinde o categorie, ci
     relația. E al doilea, nu primul — cineva ajunge aici după marfă. */
  d.push({
    eticheta: "Pentru instalatori",
    titlu: "Lucrezi în fotovoltaice?",
    subtitlu: "Cere lista cu prețul tău",
    text: "Trimite-ne ce echipamente îți trebuie și primești oferta pe catalogul lunii.",
    buton: "Cere ofertă",
    adresa: "/cerere-oferta",
    nota: "Prețurile din catalog sunt în euro, fără TVA.",
    poza: c.sto?.poza,
    chihlimbar: true,
  });

  if (c.sto) {
    d.push({
      eticheta: "Stocare de energie",
      titlu: "Acumulatori LiFePO4",
      subtitlu: "low și high voltage",
      text: `${c.sto.cate} de produse de stocare: acumulatori, sisteme complete și accesorii.`,
      buton: "Vezi stocarea",
      adresa: "/catalog/stocare-energie",
      nota: c.sto.minPret ? `De la ${euro(c.sto.minPret)} €, fără TVA.` : "Prețuri fără TVA.",
      poza: c.sto.poza,
    });
  }

  if (c.pan) {
    d.push({
      eticheta: "Panouri fotovoltaice",
      titlu: c.pan.marca ? c.pan.marca.nume : "Panouri fotovoltaice",
      subtitlu: "preț pe bucată și la volum",
      text: `${c.pan.cate} de modele în catalog, cu preț separat peste pragul de cantitate.`,
      buton: "Vezi panourile",
      adresa: "/catalog/panouri-fotovoltaice",
      nota: c.pan.minPret ? `De la ${euro(c.pan.minPret)} € bucata, fără TVA.` : "Prețuri fără TVA.",
      poza: c.pan.poza,
    });
  }

  if (c.mon) {
    d.push({
      eticheta: "Sisteme de montaj",
      titlu: "Structuri pentru",
      subtitlu: "orice tip de acoperiș",
      text: `${c.mon.cate} de repere: țiglă, tablă, acoperiș plat, șine, cleme și accesorii.`,
      buton: "Vezi montajul",
      adresa: "/catalog/sisteme-de-montaj",
      nota: c.mon.minPret ? `De la ${euro(c.mon.minPret)} €, fără TVA.` : "Prețuri fără TVA.",
      poza: c.mon.poza,
    });
  }

  return d;
}
