import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone, Truck } from "lucide-react";

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
    <footer className="bg-white border-t border-slate-900/10">
      {/* ── Corpul footer-ului ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Identitate + contact */}
          <div className="lg:col-span-4">
            <Image
              src="/logo.png"
              alt={FIRMA.nume}
              width={400}
              height={49}
              className="h-9 w-auto object-contain object-left mb-5"
            />
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
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
                  className="group flex items-start gap-3 text-slate-600 transition-colors hover:text-blue-600"
                >
                  <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600" />
                  <span>{FIRMA.adresa}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${FIRMA.telefonHref}`}
                  className="group flex items-center gap-3 text-slate-600 transition-colors hover:text-blue-600"
                >
                  <Phone size={16} className="shrink-0 text-slate-400 transition-colors group-hover:text-blue-600" />
                  <span className="font-medium tabular-nums">{FIRMA.telefon}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${FIRMA.email}`}
                  className="group flex items-center gap-3 text-slate-600 transition-colors hover:text-blue-600"
                >
                  <Mail size={16} className="shrink-0 text-slate-400 transition-colors group-hover:text-blue-600" />
                  <span className="break-all">{FIRMA.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${FIRMA.emailTransport}`}
                  className="group flex items-center gap-3 text-slate-600 transition-colors hover:text-blue-600"
                >
                  <Truck size={16} className="shrink-0 text-slate-400 transition-colors group-hover:text-blue-600" />
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
            <h2 id="footer-catalog" className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900 mb-5">
              Catalog
            </h2>
            <ul className="space-y-2.5 text-sm">
              {CATEGORII.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/catalog/${c.slug}`}
                    className="text-slate-600 transition-colors hover:text-blue-600"
                  >
                    {c.nume}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Companie */}
          <nav className="lg:col-span-2" aria-labelledby="footer-companie">
            <h2 id="footer-companie" className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900 mb-5">
              Companie
            </h2>
            <ul className="space-y-2.5 text-sm">
              {COMPANIE.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-600 transition-colors hover:text-blue-600">
                    {l.nume}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Informații */}
          <nav className="lg:col-span-2" aria-labelledby="footer-info">
            <h2 id="footer-info" className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900 mb-5">
              Informații
            </h2>
            <ul className="space-y-2.5 text-sm">
              {INFORMATII.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-600 transition-colors hover:text-blue-600">
                    {l.nume}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* ── Bara legală ────────────────────────────────────── */}
      <div className="border-t border-slate-900/10 bg-slate-50">
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
                {i > 0 ? <span aria-hidden className="h-3 w-px bg-slate-300" /> : null}
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={c.titlu}
                  aria-label={c.titlu}
                  className="font-semibold text-slate-500 transition-colors hover:text-blue-600"
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
