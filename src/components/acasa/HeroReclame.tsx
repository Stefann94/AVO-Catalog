import Link from "next/link";
import Image from "next/image";
import type { Produs } from "@/lib/produs";
import { BRANDURI, gasesteBrand } from "@/lib/branduri";
import "./hero-reclame.css";

/* ══════════════════════════════════════════════════════════════════════════
   HERO CU RECLAME — carusel + trei casete + cinci reclame de categorie
   ──────────────────────────────────────────────────────────────────────────
   Structura e a prototipului Projects/Solarone.ro, măsurată la 1440px.
   Conținutul e al nostru: fiecare cifră de aici e numărată din catalog, la
   randare. Nimic scris de mână, deci nimic care poate rămâne în urmă.

   A ÎNLOCUIT `catalog/HeroCatalog` pe prima pagină. Acela rămâne pe /catalog:
   e bannerul cu ofertele lunii, un singur bloc. Ăsta e capul de magazin —
   carusel, casete și reclame de categorie.

   ─── CARUSELUL NU ADUCE JAVASCRIPT ────────────────────────────────────────

   Cinci `<input type="radio">` ascunse țin starea, `<label>`-urile sunt
   săgețile și bulinele, iar `:has()` mută pista (vezi hero-reclame.css).
   Prototipul folosește un script; aici n-avem nevoie de el.

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

/* ══════════════════════════════════════════════════════════════════════════
   CELE CINCI RECLAME DE CATEGORIE
   ──────────────────────────────────────────────────────────────────────────
   Fiecare are o compoziție scrisă de mână: fotografie decupată, marcă, unde
   stă sigla, ce poartă în colț. Nu se calculează, fiindcă sunt RECLAME — o
   reclamă e aleasă, nu dedusă dintr-un `sort()`.

   ─── FOTOGRAFIILE ────────────────────────────────────────────────────────

   PNG-uri detourate, din prototipul Projects/Solarone.ro. Alea din catalog
   sunt JPEG-uri pe alb: peste degradeuri arătau ca dreptunghiuri albe, iar
   alese automat („primul produs cu poză din categorie") nimereau prost — pe
   dala de montaj ieșea un șurub.

   ─── MĂRCILE SUNT DOAR CELE PE CARE LE DISTRIBUIM ────────────────────────

   Prototipul pune Huawei pe dala de stocare. Noi n-avem Huawei în catalog,
   deci acolo e Pytes, iar fotografia e acumulatorul Pytes, nu cel Huawei.
   Restul se potrivesc unu-la-unu: Deye, Canadian Solar, K2 Systems, Growatt
   sunt toate în BRANDURI.

   ─── PREȚ SAU FANION, NU AMÂNDOUĂ ────────────────────────────────────────

   Eticheta de preț stă jos-stânga, unde stă și sigla pe dalele deschise. În
   prototip nu se ating fiindcă dalele cu sigla jos poartă fanion în colț, nu
   preț. Păstrăm regula: `fanion` și `pret` se exclud.
   ══════════════════════════════════════════════════════════════════════════ */

type Reclama = {
  slug: string;
  /** Clasa de compoziție din hero-reclame.css. */
  tema: string;
  /** Fundal închis: sigla se albește și textul e deschis. */
  inchis: boolean;
  /** Decupajul din public/produse-png/. */
  poza: string;
  /** Slug-ul mărcii, pentru sigla din public/branduri/color/. */
  marca: string;
  /** Sigla jos-stânga în loc de sus-dreapta. Atunci dala poartă fanion. */
  siglaJos?: boolean;
  /** Cuvintele-cheie de deasupra titlului. */
  kicker: string;
  /** Titlul, pe două rânduri, ca în prototip. */
  titlu: [string, string];
  /** Rândul mic de sub titlu. */
  sub: string;
  /** Eticheta de preț din colțul de jos-stânga. */
  pret?: string;
  /** Fanionul diagonal din colțul de sus-dreapta. */
  fanion?: string;
};

/* ══════════════════════════════════════════════════════════════════════════
   COPIE FIDELĂ A PROTOTIPULUI
   ──────────────────────────────────────────────────────────────────────────
   Textele, siglele și fotografiile sunt EXACT cele din
   Projects/Solarone.ro/index.html, cerute așa explicit. Nimic nu se
   calculează din catalogul nostru.

   ─── CE NU CORESPUNDE CATALOGULUI AVO, CA SĂ SE ȘTIE ─────────────────────

     prețurile în lei ..... 1.387,00 / 381,00 / 623,00 sunt ale prototipului.
                            Ale noastre sunt în euro, fără TVA, iar cel mai
                            ieftin invertor e 355 €, nu 1.387 lei.
     „93 produse" ......... la montaj avem 51.
     „Distribuitor platinum" statut neconfirmat de nimeni în scris.
     Huawei ............... marcă pe care n-o distribuim; apare sigla și
                            acumulatorul ei pe dala de stocare.
     „de la 5 kWh" ........ cel mai mic acumulator al nostru e de 2 kWh.
     „7–22 kW" ............ ale noastre pornesc de la 3,5 kW.
     „ISO", „carport" ..... nu există în catalogul nostru.

   Rămân scrise aici, într-un singur loc, ca să poată fi schimbate într-o
   singură trecere când se decide. Cele adevărate sunt în istoricul git,
   commit-ul de dinainte.
   ══════════════════════════════════════════════════════════════════════════ */
const RECLAME: Reclama[] = [
  {
    slug: "invertoare",
    tema: "rc-d-invertoare",
    inchis: true,
    poza: "invertor-deye",
    marca: "deye",
    kicker: "Distribuitor platinum",
    titlu: ["Invertoare", "Deye"],
    sub: "hibride · on-grid · off-grid",
    pret: "1.387,00 lei",
  },
  {
    slug: "panouri-fotovoltaice",
    tema: "rc-d-panouri",
    inchis: false,
    poza: "panou",
    marca: "canadian-solar",
    siglaJos: true,
    kicker: "N-Type TOPCon",
    titlu: ["Panouri de la", "381,00 lei"],
    sub: "Aiko · Canadian Solar · Jinko",
    fanion: "preț pe palet",
  },
  {
    slug: "stocare-energie",
    tema: "rc-d-stocare",
    inchis: true,
    poza: "acumulator-huawei",
    marca: "huawei",
    kicker: "Stocare de energie",
    titlu: ["Stocare de la", "5 kWh"],
    sub: "low & high voltage",
  },
  {
    slug: "sisteme-de-montaj",
    tema: "rc-d-montaj",
    inchis: false,
    poza: "montaj",
    marca: "k2-systems",
    siglaJos: true,
    kicker: "K2 Systems · ISO",
    titlu: ["Montaj pentru", "orice acoperiș"],
    sub: "țiglă · tablă · plat · carport",
    fanion: "93 produse",
  },
  {
    slug: "statii-de-incarcare-auto",
    tema: "rc-d-incarcare",
    inchis: true,
    poza: "statie-growatt",
    marca: "growatt",
    kicker: "Mașini electrice",
    titlu: ["Stații de", "încărcare 7–22 kW"],
    sub: "monofazate și trifazate",
    pret: "623,00 lei",
  },
];

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

  const preturi = ale
    .map((p) => p.pret)
    .filter((n): n is number => typeof n === "number" && n > 0)
    .sort((a, b) => a - b);

  /* ─── „DE LA X €" SARE PESTE ACCESORII ──────────────────────────────────
     Prețul minim brut al unei categorii e aproape întotdeauna al unui
     accesoriu, nu al produsului pe care îl vinde reclama:

       Stații de încărcare ... 55 € e un dongle LoRa, nu o stație (283 €)
       Sisteme de montaj ..... 0,21 € e un colier de plastic
       Stocare ............... 60 € e o bază cu cabluri

     „De la 55 €" pe o reclamă cu o stație de încărcare nu e greșit, dar
     induce în eroare — cine dă clic găsește stații de la 283 €.

     Regula: se ia cel mai mic preț dintre produsele care costă măcar o
     cincime din mediana categoriei. Un accesoriu e, prin definiție, mult mai
     ieftin decât marfa; o cincime taie exact acolo, fără să atingă produsele
     de intrare. Verificat pe catalogul curent: stațiile trec de la 55 € la
     283 €, invertoarele rămân la 355 €, panourile la 54 €.

     Nu e un prag ales din ochi pe fiecare categorie: e aceeași regulă pentru
     toate, deci nu trebuie reglată la fiecare import. */
  const mediana = preturi.length ? preturi[Math.floor(preturi.length / 2)] : 0;
  const fataMarfa = preturi.filter((n) => n >= mediana / 5);

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
    minPret: fataMarfa.length ? fataMarfa[0] : undefined,
    marca,
    poza: ales?.imagine ? { url: ales.imagine.url, alt: ales.imagine.alt ?? ales.nume } : undefined,
  };
}

export default function HeroReclame({
  produse,
  lichidare,
}: {
  produse: Produs[];
  /** Câte produse sunt în lichidare. Vine din bara de filtre. */
  lichidare: number;
}) {
  const cat = new Map<string, Strans>();
  for (const { slug } of RECLAME) {
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
    /* `rc` poartă variabilele de culoare (vezi hero-reclame.css). Stă pe
       secțiune, nu pe `:root`: așa paleta prototipului rămâne închisă în
       bucata asta de pagină și nu se amestecă cu tokenii site-ului. */
    <section className="rc rc-promo">
      <div className="coloana">
        <div className="rc-promo-sus">
          {/* ══ CARUSELUL ══ */}
          <div className="rc-carusel">
            {diapozitive.map((_, i) => (
              <input
                key={i}
                type="radio"
                name="rc-diapo"
                id={`rc-d${i}`}
                defaultChecked={i === 0}
                aria-label={`Reclama ${i + 1} din ${diapozitive.length}`}
              />
            ))}

            <div className="rc-pista">
              {diapozitive.map((d, i) => (
                <article key={d.titlu} className="rc-diapo">
                  <div className={`rc-diapo-txt${d.chihlimbar ? " rc-chihlimbar" : ""}`}>
                    <span className="rc-eticheta">{d.eticheta}</span>
                    <h2>
                      {d.titlu}
                      <br />
                      <b>{d.subtitlu}</b>
                    </h2>
                    <p>{d.text}</p>
                    <Link href={d.adresa} className="rc-diapo-btn">
                      {d.buton}
                    </Link>
                    <span className="rc-nota">{d.nota}</span>
                  </div>

                  <div className="rc-diapo-img">
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
                <div key={i} className="rc-sageti" data-i={i}>
                  <label
                    className="rc-sageata rc-inapoi"
                    htmlFor={`rc-d${(i - 1 + n) % n}`}
                    title="Reclama anterioară"
                  >
                    ‹
                  </label>
                  <label
                    className="rc-sageata rc-inainte"
                    htmlFor={`rc-d${(i + 1) % n}`}
                    title="Reclama următoare"
                  >
                    ›
                  </label>
                </div>
              );
            })}

            <div className="rc-buline">
              {diapozitive.map((d, i) => (
                <label key={d.titlu} htmlFor={`rc-d${i}`} title={d.titlu} />
              ))}
            </div>
          </div>

          {/* ══ CELE TREI CASETE ══ */}
          <aside className="rc-casete">
            <Link href="/cerere-oferta" className="rc-caseta rc-cfg">
              <span className="rc-caseta-l">
                <span className="rc-caseta-k">Cerere de ofertă</span>
                <b>
                  Spune-ne ce îți trebuie,
                  <br />
                  primești preț la listă
                </b>
                <span className="rc-caseta-c">Trimite lista →</span>
              </span>
              <span className="rc-caseta-r">
                <span className="rc-duo">
                  {duo.map((p, i) => (
                    <span key={p.url} style={{ display: "contents" }}>
                      {i > 0 ? <span className="rc-plus">+</span> : null}
                      <Image src={p.url} alt="" width={90} height={64} sizes="90px" loading="lazy" />
                    </span>
                  ))}
                </span>
              </span>
            </Link>

            <Link href="/catalog/lichidare-stoc" className="rc-caseta rc-stoc">
              <span className="rc-caseta-l">
                <span className="rc-caseta-k">Lichidare de stoc</span>
                <b>{lichidare} produse la preț redus, cât mai sunt</b>
                <span className="rc-marci">
                  {BRANDURI.slice(0, 4).map((b) => (
                    <span key={b.slug}>{b.nume}</span>
                  ))}
                </span>
              </span>
              <span className="rc-caseta-r">
                {pan?.poza ? (
                  <Image
                    className="rc-caseta-una"
                    src={pan.poza.url}
                    alt=""
                    width={132}
                    height={88}
                    sizes="132px"
                    loading="lazy"
                  />
                ) : null}
                <span className="rc-insigna">reduse</span>
              </span>
            </Link>

            {laVolum ? (
              <Link href={`/catalog/produs/${laVolum.slug}`} className="rc-caseta rc-b2b-caseta">
                <span className="rc-caseta-l">
                  <span className="rc-caseta-k">Preț la volum</span>
                  <b>Prețul tău de la {laVolum.prag}</b>
                  <span className="rc-pret">
                    <s>{euro(laVolum.pret!)} €</s>
                    <strong>{euro(laVolum.pretVolum!)} €</strong>
                  </span>
                </span>
                <span className="rc-caseta-r">
                  {laVolum.imagine ? (
                    <Image
                      className="rc-caseta-una"
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
        <div className="rc-dale">
          {RECLAME.map((r) => (
              <Link key={r.slug} href={`/catalog/${r.slug}`} className={`rc-dala ${r.tema}`}>
                {/* Siglele din public/branduri/proto/, nu din branduri/color/:
                    sunt fișierele prototipului, ca desenul să fie același. Tot
                    de acolo vine și Huawei, pe care catalogul nostru nu-l are
                    deloc. */}
                <Image
                  className={`rc-dala-marca ${r.siglaJos ? "rc-jos-stanga" : "rc-sus-dreapta"}`}
                  src={`/branduri/proto/${r.marca}.png`}
                  alt={r.marca}
                  width={140}
                  height={38}
                  sizes="140px"
                  loading="lazy"
                />

                <span className="rc-dala-t">
                  <span className={`rc-dala-k${r.inchis ? "" : " rc-deschis"}`}>{r.kicker}</span>
                  {/* Titlul pe două rânduri, cu ruptura scrisă, nu lăsată pe
                      seama lățimii. În prototip e un `<br>`: așa „Montaj
                      pentru / orice acoperiș" se rupe mereu în același loc,
                      indiferent de fereastră. */}
                  <b>
                    {r.titlu[0]}
                    <br />
                    {r.titlu[1]}
                  </b>
                  <span className={`rc-dala-sub${r.inchis ? "" : " rc-inchis"}`}>{r.sub}</span>
                </span>

                {/* Decupajul, din public/produse-png/. Lățimea și poziția sunt
                    ale fiecărei dale, în hero-reclame.css. */}
                <Image
                  className="rc-dala-img"
                  src={`/produse-png/${r.poza}.png`}
                  alt=""
                  width={300}
                  height={300}
                  sizes="(max-width: 820px) 180px, 300px"
                  loading="lazy"
                />

                {/* FANION SAU PREȚ, NICIODATĂ AMÂNDOUĂ — și în prototip e la
                    fel. Eticheta de preț stă jos-stânga, unde stă și sigla pe
                    dalele cu `siglaJos`; acolo prețul ar dispărea sub ea, iar
                    fanionul îi ține locul, sus-dreapta. */}
                {r.fanion ? (
                  <span className="rc-fanion">{r.fanion}</span>
                ) : r.pret ? (
                  <span className="rc-dala-pret">
                    de la <b>{r.pret}</b>
                  </span>
                ) : null}
              </Link>
          ))}
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

  /* Al doilea diapozitiv: singurul care nu vinde o categorie, ci relația. E
     al doilea, nu primul — cineva ajunge aici după marfă.

     A FOST CHIHLIMBARIU, ca în prototip, unde fundalul galben îl deosebea de
     celelalte patru. Scos din galben la cerere; rețeta lui stă comentată în
     hero-reclame.css, iar întoarcerea e `chihlimbar: true` înapoi aici. */
  d.push({
    eticheta: "Pentru instalatori",
    titlu: "Lucrezi în fotovoltaice?",
    subtitlu: "Cere lista cu prețul tău",
    text: "Trimite-ne ce echipamente îți trebuie și primești oferta pe catalogul lunii.",
    buton: "Cere ofertă",
    adresa: "/cerere-oferta",
    nota: "Prețurile din catalog sunt în euro, fără TVA.",
    poza: c.sto?.poza,
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
