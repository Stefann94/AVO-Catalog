import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone, Truck } from "lucide-react";
/**
 * Sigla de brand, în culorile ei, nu silueta albă.
 *
 * DE CE STĂ PE O PLĂCUȚĂ ALBĂ. Sigla e bleumarin. Măsurat pe fișierul de acum
 * (marca triunghiulară plus „AVO | GRUP INVEST"), pe cei 52.370 de pixeli
 * opaci:
 *
 *   #203050  bleumarin ..... 56,8%   ← cerneala principală
 *   #902030  roșu accent .... 12,6%
 *   #90A0B0  gri-albastru .... 4,6%   ← grila de celule din triunghi
 *
 * Luminanța bleumarinului e L=0,030, deci pe orice fundal întunecat se stinge:
 * pe gray-800, fundalul acestui footer, dă 1,12:1 — practic invizibilă.
 *
 * Ca sigla color să atingă măcar 3:1 — pragul WCAG pentru elemente negrafice —
 * fundalul ar trebui să fie pe la #777777, adică gri MEDIU. Un footer acolo ar
 * fi spălăcit și ar rupe legătura cu hero-ul și navbar-ul, care sunt închise.
 *
 * Plăcuța albă rezolvă amândouă cerințele deodată: footer-ul rămâne închis,
 * iar sigla stă pe suprafața pentru care a fost desenată și ajunge la 13,12:1.
 *
 * FIȘIERUL a fost pregătit, nu copiat ca atare: originalul era un JPEG de
 * 1 MB, 3168×1344, cu fundal alb opac și margini goale care ocupau două treimi
 * din cadru. Alb opac ar fi ieșit ca un dreptunghi vizibil în navbar, care e
 * sticlă peste hero-ul întunecat. E acum PNG cu transparență, decupat pe
 * conținut și redus la 1200px lățime.
 * E și tratamentul obișnuit pentru o siglă întunecată pe subsol închis.
 *
 * Alternativele, dacă plăcuța nu convine: footer deschis (dar atunci pagina nu
 * mai începe și nu se mai termină la fel), sau întoarcerea la silueta albă din
 * public/logo-alb.png, care rămâne în proiect.
 */
import logo from "../../public/logo.png";

/**
 * Datele firmei.
 *
 * Cele preluate de pe www.avogrupinvest.ro/contact sunt reale și verificate.
 * `cui` și `regCom` NU sunt publicate nicăieri pe site-ul actual — sunt lăsate
 * goale intenționat, nu inventate. Rândurile respective nu se randează cât timp
 * sunt goale, deci footer-ul arată complet în ambele cazuri.
 *
 * ATENȚIE, obligație legală: pentru un comerciant online din România, CUI-ul,
 * numărul din Registrul Comerțului și sediul social trebuie afișate. Completează-le
 * înainte de lansare.
 */
const FIRMA = {
  nume: "Avo Grup Invest",
  cui: "",                    // ex. "RO12345678"
  regCom: "",                 // ex. "J27/123/2015"
  adresa: "Str. Nordului 8A, Piatra-Neamț, jud. Neamț",
  // Coordonatele reale ale sediului, prin Maps URL API. Link-ul scurt goo.gl de
  // pe site-ul actual încă funcționează, dar Google retrage formatul acela.
  harta: "https://www.google.com/maps/search/?api=1&query=46.9117987%2C26.4059015",
  telefon: "+40 721 233 544",
  telefonHref: "+40721233544",
  email: "contact@avogrupinvest.ro",
  emailTransport: "transport@avogrupinvest.ro",
};

const CATEGORII = [
  { nume: "Panouri Fotovoltaice", slug: "panouri-fotovoltaice" },
  { nume: "Invertoare", slug: "invertoare" },
  { nume: "Stocare Energie", slug: "stocare-energie" },
  { nume: "Sisteme de Montaj", slug: "sisteme-de-montaj" },
  { nume: "Monitorizare & Smart Devices", slug: "monitorizare-smart-devices" },
  { nume: "Stații de Încărcare Auto", slug: "statii-de-incarcare-auto" },
  { nume: "Accesorii", slug: "accesorii" },
  { nume: "Echipamente Conversie & Comutare", slug: "echipamente-conversie-comutare" },
];

/**
 * Link-uri obligatorii pentru protecția consumatorului.
 *
 * URL-uri verificate: `anpc.ro/ce-este-sal` dă 404, adresa curentă e `anpc.ro/sal`.
 * Platforma europeană ODR (vechiul `ec.europa.eu/consumers/odr`) a fost ÎNCHISĂ —
 * trimitem către portalul care i-a preluat rolul.
 */
const CONSUMATOR = [
  { eticheta: "ANPC", titlu: "Autoritatea Națională pentru Protecția Consumatorilor", href: "https://anpc.ro" },
  { eticheta: "SAL", titlu: "Soluționarea Alternativă a Litigiilor", href: "https://anpc.ro/sal" },
  { eticheta: "SOL", titlu: "Soluționarea Online a Litigiilor — portalul UE", href: "https://consumer-redress.ec.europa.eu/index_ro" },
];

/**
 * Paginile existente pe www.avogrupinvest.ro, preluate ca atare (slug-urile sunt
 * cele reale, verificate — au HTTP 200 pe site-ul actual).
 *
 * Coloana "Catalog" NU folosește aceste rute: ea rămâne legată de backend-ul
 * nostru WooCommerce, prin /catalog/<slug>.
 *
 * DE DECIS: /panouri-fotovoltaice și /invertoare-stocare-energie se suprapun
 * peste categoriile din catalogul nostru. La înlocuirea site-ului trebuie ori
 * păstrate ca pagini de prezentare, ori redirecționate 301 către /catalog/... —
 * altfel se pierde poziționarea SEO pe care o au deja.
 */
const COMPANIE = [
  { nume: "Despre noi", href: "/despre-noi" },
  { nume: "Distribuție echipamente fotovoltaice", href: "/distributie-echipamente-fotovoltaice" },
  { nume: "Panouri fotovoltaice", href: "/panouri-fotovoltaice" },
  { nume: "Invertoare & stocare energie", href: "/invertoare-stocare-energie" },
  { nume: "Devino partener", href: "/devino-partener" },
  { nume: "Cerere de ofertă", href: "/cerere-oferta" },
  { nume: "Contact", href: "/contact" },
];

// Paginile astea nu există încă în WordPress (verificat: /termeni-si-conditii
// și /politica-de-confidentialitate întorc 404). Trebuie create înainte de lansare.
const INFORMATII = [
  { nume: "Termeni și condiții", href: "/termeni-si-conditii" },
  { nume: "Politica de confidențialitate", href: "/politica-de-confidentialitate" },
  { nume: "Politica de cookie-uri", href: "/politica-cookies" },
  { nume: "Livrare și transport", href: "/livrare" },
  { nume: "Retur și garanție", href: "/retur-garantie" },
];

export default function Footer() {
  const anul = new Date().getFullYear();

  return (
    /*
     * Corpul footer-ului e pe `gray-800` (#1E2939) — gri închis, din aceeași
     * rampă `gray` pe care o folosește secțiunea „Gama de produse". Era
     * `slate-900`, ales atunci ca să rimeze cu bara de contact din capul
     * paginii.
     *
     * Bara legală de dedesubt rămâne neatinsă, pe `slate-950`. Diferența de
     * închidere dintre cele două e acum mai mare decât înainte, ceea ce
     * ajută: subsolul citește ca două trepte distincte, nu ca un bloc.
     *
     * Paleta de text e neschimbată: `slate-400` pentru rândurile obișnuite,
     * alb la hover, `avo-400` pentru iconițe, `slate-300` pentru datele de
     * contact — informația pentru care se derulează până aici.
     *
     * Contraste RECALCULATE pe fundalul nou, nu moștenite (pragul AA e 4,5:1):
     *   titluri de coloană, alb .......... 14,67 ✓
     *   date de contact, slate-300 ........ 9,87 ✓
     *   linkuri și paragraf, slate-400 .... 5,58 ✓
     *   iconițe, avo-400 .................. 5,19 ✓
     *   sigla color pe plăcuța albă ...... 13,52 ✓
     *   text legal pe slate-950 ........... 7,66 ✓  (bara e neschimbată)
     *   ANPC / SAL / SOL pe slate-950 .... 13,56 ✓  (idem)
     *
     * Toate scad față de `slate-900`, fiindcă fundalul s-a deschis, dar toate
     * rămân peste prag. `slate-500` continuă să nu apară nicăieri: aici ar da
     * 3,04:1, adică sub pragul pentru text.
     */
    <footer className="bg-gray-800 border-t border-gray-700">
      {/* ── Corpul footer-ului ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Identitate + contact */}
          <div className="lg:col-span-4">
            {/* `inline-flex`, nu `block`: plăcuța se strânge pe lățimea siglei
                în loc să se întindă pe toată coloana. Rază 12px, ca tot restul
                proiectului. Padding-ul e vizual echilibrat, nu egal — 16px pe
                laterale și 12px sus/jos: sigla e un logotip lat, iar spațiul
                egal ar face plăcuța să pară prea înaltă. */}
            {/* Învelișul e `flex`, ca plăcuța să nu stea într-o cutie de linie:
                un `inline-flex` singur ar fi așezat pe linia de bază și ar
                trage sub el spațiul pentru descendente, adică un gol de câțiva
                pixeli care n-are nicio treabă cu `mb-5`. */}
            <div className="mb-5 flex">
              <span className="inline-flex items-center rounded-xl bg-white px-4 py-3">
                <Image
                  src={logo}
                  alt={FIRMA.nume}
                  className="h-9 w-auto object-contain"
                />
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-6">
              Distribuitor de echipamente fotovoltaice pentru instalatori și revânzători.
              Panouri, invertoare, sisteme de stocare și structuri de montaj, la prețuri
              de distribuitor.
            </p>

            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={FIRMA.harta}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 text-slate-300 transition-colors hover:text-white"
                >
                  <MapPin size={16} className="mt-0.5 shrink-0 text-avo-400 transition-colors group-hover:text-white" />
                  <span>{FIRMA.adresa}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${FIRMA.telefonHref}`}
                  className="group flex items-center gap-3 text-slate-300 transition-colors hover:text-white"
                >
                  <Phone size={16} className="shrink-0 text-avo-400 transition-colors group-hover:text-white" />
                  <span className="font-medium tabular-nums">{FIRMA.telefon}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${FIRMA.email}`}
                  className="group flex items-center gap-3 text-slate-300 transition-colors hover:text-white"
                >
                  <Mail size={16} className="shrink-0 text-avo-400 transition-colors group-hover:text-white" />
                  <span className="break-all">{FIRMA.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${FIRMA.emailTransport}`}
                  className="group flex items-center gap-3 text-slate-300 transition-colors hover:text-white"
                >
                  <Truck size={16} className="shrink-0 text-avo-400 transition-colors group-hover:text-white" />
                  <span className="break-all">
                    {FIRMA.emailTransport}
                    <span className="block text-xs text-slate-400">Logistică și transport</span>
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Catalog */}
          <nav className="lg:col-span-4" aria-labelledby="footer-catalog">
            <h2 id="footer-catalog" className="text-[11px] font-bold uppercase tracking-[0.18em] text-white mb-5">
              Catalog
            </h2>
            <ul className="space-y-2.5 text-sm">
              {CATEGORII.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/catalog/${c.slug}`}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {c.nume}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Companie */}
          <nav className="lg:col-span-2" aria-labelledby="footer-companie">
            <h2 id="footer-companie" className="text-[11px] font-bold uppercase tracking-[0.18em] text-white mb-5">
              Companie
            </h2>
            <ul className="space-y-2.5 text-sm">
              {COMPANIE.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-400 transition-colors hover:text-white">
                    {l.nume}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Informații */}
          <nav className="lg:col-span-2" aria-labelledby="footer-info">
            <h2 id="footer-info" className="text-[11px] font-bold uppercase tracking-[0.18em] text-white mb-5">
              Informații
            </h2>
            <ul className="space-y-2.5 text-sm">
              {INFORMATII.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-400 transition-colors hover:text-white">
                    {l.nume}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* ── Bara legală ────────────────────────────────────── */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            © {anul} {FIRMA.nume}. Toate drepturile rezervate.
            {FIRMA.cui ? <> · CUI {FIRMA.cui}</> : null}
            {FIRMA.regCom ? <> · Reg. Com. {FIRMA.regCom}</> : null}
            <span className="block sm:inline sm:before:content-['_·_']">
              Prețurile din catalog sunt în EUR, fără TVA.
            </span>
          </p>

          {/* Protecția consumatorului — pe același rând cu textul legal */}
          <div className="flex items-center gap-3 shrink-0 text-xs">
            <span className="text-slate-400">Protecția consumatorului:</span>
            {CONSUMATOR.map((c, i) => (
              <span key={c.href} className="flex items-center gap-3">
                {i > 0 ? <span aria-hidden className="h-3 w-px bg-white/20" /> : null}
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={c.titlu}
                  aria-label={c.titlu}
                  className="font-semibold text-slate-300 transition-colors hover:text-white"
                >
                  {c.eticheta}
                </a>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
