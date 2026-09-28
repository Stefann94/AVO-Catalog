import Link from "next/link";
import Image from "next/image";
import logo from "../../public/logo.png";
import { Phone, Mail, MapPin, Search, User, ShoppingCart } from "lucide-react";
import NavbarInteractiv from "./navbar/NavbarInteractiv";

/* ══════════════════════════════════════════════════════════════════════════
   BARA SE RANDEAZĂ PE SERVER
   ──────────────────────────────────────────────────────────────────────────
   Fișierul ăsta NU are `"use client"`. Tot ce e mai jos — dunga de contact,
   sigla, cele trei butoane de meniu, fereastra de parteneri, căutarea, contul,
   cuprinsul meniului de telefon — se transformă în marcaj la construcție și nu
   ajunge niciodată în browser ca JavaScript.

   În browser rămâne doar navbar/NavbarInteractiv.tsx, cu cele două stări care
   chiar reacționează: hamburgerul și sticla barei. El primește marcajul de
   aici ca `children` și `meniuMobil`.

   NIMIC DIN CE SE VEDE NU S-A SCHIMBAT. Aceleași elemente, aceleași clase,
   aceeași ordine, aceleași tranziții — doar locul în care sunt produse.
   ══════════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════════
   CELE PATRU STĂRI ALE BAREI
   ──────────────────────────────────────────────────────────────────────────
   Bara nu are o formă „de desktop" și una „de telefon", ci patru, fiindcă
   lățimile la care se folosește chiar sunt patru. Măsurat pe pagina randată,
   la 1920, elementele au aceste lățimi naturale:

       sigla ..................... 276px (la `h-12`; 253px la `h-11`)
       Catalog Produse ........... 151px
       Parteneri B2B ............. 155px
       Sisteme Industriale ....... 190px
       Cont B2B .................. 125px
       Coș ........................ 91px  (scos între timp — vezi mai jos)
       câmpul de căutare ......... 256px

   Adunate cu spațiile dintre ele și cu `lg:px-12`, forma completă cere 1428px.
   ACOLO ERA PROBLEMA: bara o cerea de la 1280 în sus, iar între 1280 și 1440
   nu încăpea — butoanele se strângeau, textul din ele se rupea pe două rânduri
   și bara creștea de la 107px la 121px. Sub 1280 se preda de tot: tot meniul,
   căutarea, contul și coșul dispăreau într-un hamburger, deși pe un ecran de
   1279px e loc de aproape toate.

   Formele, în ordinea în care apar pe măsură ce fereastra crește:

     sub lg (1024) ... sigla și hamburgerul. Restul, în meniul care se desface.
     lg  1024–1279 ... meniul complet, dar strâns: sigla la `h-11`, butoanele cu
                       `px-3.5` și 13px, căutarea și contul doar cu iconița.
                       Cere ~900px din cei 976 disponibili.
     xl  1280–1535 ... contul își recapătă eticheta, butoanele respiră
                       la `px-4`. Cere ~1060px din 1184.
     2xl 1536+ ....... forma completă: sigla la `h-12`, `px-5`, câmp de căutare.
                       Cere ~1350px din 1440.

   BUTONUL „COȘ" (91px) A FOST SCOS: site-ul nu are coș, iar butonul cu bulina
   „0" nu ducea nicăieri. Cifrele de mai sus îl includ încă, deci fiecare
   treaptă are acum ~90px de rezervă în plus.

   REGULA DE ÎNTREȚINERE. Fiecare treaptă are cel puțin 75px de rezervă față de
   lățimea la care începe. Cine adaugă un element în bară verifică întâi dacă
   rezerva aceea îl acoperă la treapta cea mai strâmtă (lg), nu la 1920.

   DE CE ÎNĂLȚIMILE SUNT DECLARATE. Rândurile au `h-8` și `h-[68px]`, nu
   înălțime dedusă din conținut. Motivul e că înălțimea barei e citită din
   afară: paginile își coboară conținutul cu `--inaltime-navbar`, definită în
   app/globals.css. O bară care crește când un text se rupe pe două rânduri ar
   face variabila aceea o minciună — exact ce se întâmpla la 1280.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Rețeta butoanelor din bară — meniu, căutare, cont.
 *
 * Ca șir comun, nu copiată de patru ori: erau patru variante ale aceleiași
 * rețete, iar la restrângerea barei fiecare ar fi trebuit strânsă separat.
 * Aici padding-ul și corpul literei se schimbă la aceleași praguri pentru
 * toate, deci butoanele rămân o familie la orice lățime.
 */
const BUTON_BARA =
  "shrink-0 whitespace-nowrap flex items-center justify-center " +
  "bg-white/70 border border-white/80 text-slate-700 rounded-xl " +
  "font-semibold transition-all " +
  "hover:text-avo-600 hover:bg-white hover:shadow-md hover:shadow-avo-900/5 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600";

/**
 * Singurul buton plin din bară.
 *
 * A fost „Cere ofertă": într-un catalog fără coș, aia era conversia. Acum e
 * coșul, fiindcă bara a primit forma de magazin — dar regula rămâne, un singur
 * element colorat plin. Dacă ar fi două, n-ar mai fi niciunul.
 */
const BUTON_PRINCIPAL =
  "shrink-0 whitespace-nowrap flex items-center justify-center " +
  "h-11 px-4 xl:px-5 rounded-xl text-[13px] xl:text-sm font-semibold " +
  "bg-avo-600 text-white border border-avo-600 transition-all " +
  "hover:bg-avo-700 hover:border-avo-700 hover:shadow-md hover:shadow-avo-900/15 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600";

/**
 * Contact și Autentificare: aceeași rețetă ca butoanele de meniu de dinainte.
 *
 * Eticheta apare pe trepte diferite, după cât loc e: „Contact" de la `xl`,
 * „Autentificare" abia de la `2xl`, fiindcă e de două ori mai lungă. Sub
 * praguri rămâne doar pictograma, iar `title` spune ce e.
 */
const BUTON_ACTIUNE = BUTON_BARA + " gap-2 h-11 px-3 xl:px-4 text-[13px] xl:text-sm";

/** Coșul: același desen, dar plin. Vezi `BUTON_PRINCIPAL`. */
const BUTON_COS = BUTON_PRINCIPAL + " gap-2.5";

/**
 * Butonul din capătul câmpului de căutare.
 *
 * `absolute`, nu lipit lângă input: câmpul trebuie să rămână un singur
 * dreptunghi, cu butonul înăuntru, altfel cele două se citesc ca elemente
 * separate care se întâmplă să stea alături. Padding-ul `pr-28` de pe input îi
 * ține locul, ca textul scris să nu ajungă sub el.
 */
const BUTON_CAUTARE =
  "absolute right-1.5 shrink-0 whitespace-nowrap flex items-center justify-center gap-1.5 " +
  "h-8 px-3 rounded-lg text-[12px] xl:text-[13px] font-semibold " +
  "bg-avo-600 text-white transition-colors hover:bg-avo-700 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 flex flex-col shadow-sm">
      {/* ── Bara de contact ──────────────────────────────────────────────
          `h-8`, nu `py-2`: înălțimea ei intră în `--inaltime-navbar`, deci
          trebuie să fie o cifră, nu o consecință a textului dinăuntru. */}
      <div className="bg-slate-900 border-b border-slate-800 h-8 hidden lg:block">
        {/* `coloana`, nu `w-full px-6`: bara de sus se aliniază cu restul
            site-ului. Înainte, telefonul și adresa începeau de la marginea
            ferestrei, în timp ce conținutul de dedesubt începea de la coloană
            — pe un ecran de 1920px, o diferență de 178px, adică bara arăta ca
            și cum ar fi a altei pagini. */}
        <div className="coloana flex h-full items-center justify-between gap-6 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">

          {/* Contact. `min-w-0` ca zona să poată ceda lățime în loc să
              împingă anunțul din mijloc peste ce urmează. */}
          <div className="flex items-center gap-6 min-w-0 shrink">
            <a href="tel:+40721233544" className="flex items-center gap-2 shrink-0 hover:text-white transition-colors">
              <Phone size={12} className="text-avo-400" /> +40.721.233.544
            </a>
            <a href="mailto:contact@avogrupinvest.ro" className="flex items-center gap-2 min-w-0 hover:text-white transition-colors">
              <Mail size={12} className="text-avo-400 shrink-0" />
              <span className="truncate">contact@avogrupinvest.ro</span>
            </a>
          </div>

          {/* Anunțul B2B.
              PRAGUL E 1400px, MĂSURAT, nu `xl`. Textul are 66 de caractere la
              11px cu `tracking-wider`, adică ~480px; contactul din stânga cere
              359px, linkul din dreapta 250px. Sub 1400 nu încap toate trei, iar
              la `xl` chiar așa arăta: adresa de e-mail intra peste anunț, fără
              spațiu între ele, fiindcă cele trei zone erau `flex-1` egale și
              mijlocul își depășea zona în ambele părți.

              Nu mai e `flex-1`: zonele își iau lățimea lor, iar `justify-between`
              le desparte. Așa mijlocul nu mai are cum să calce peste vecini. */}
          <div className="hidden min-[1400px]:flex shrink-0 items-center">
            <Link href="/cerere-oferta" className="flex items-center hover:text-white transition-colors text-avo-400">
              <span className="tracking-wider whitespace-nowrap">CONDIȚII COMERCIALE PREFERENȚIALE PENTRU COMPANII ȘI DISTRIBUITORI</span>
            </Link>
          </div>

          {/* Locații. Eticheta se scurtează sub 1400: acolo, cu anunțul absent,
              locul e liber, dar peste prag lățimea contează. */}
          <div className="flex shrink-0 justify-end">
            <Link href="/contact" className="flex items-center gap-2 whitespace-nowrap hover:text-white transition-colors">
              <MapPin size={12} className="text-avo-400" />
              <span className="hidden min-[1400px]:inline">Formular Contact &amp; Locații</span>
              <span className="min-[1400px]:hidden">Contact &amp; Locații</span>
            </Link>
          </div>

        </div>
      </div>

      <NavbarInteractiv
        meniuMobil={
          /* Aceleași patru lucruri ca în bara de desktop, în aceeași ordine:
             căutare, Contact, Autentificare, Coș. Meniul de telefon și bara nu
             pot oferi lucruri diferite — cine caută „Despre noi" pe telefon și
             nu-l găsește nu deduce că pe desktop ar fi fost acolo.

             Categoriile NU sunt aici: rândul albastru de sub bară le arată pe
             toate opt, inclusiv pe telefon, unde se trage cu degetul. Ar fi
             fost a doua listă cu același conținut. */
          <div className="flex flex-col p-6">
            <form action="/catalog" role="search" className="relative flex items-center">
              <label htmlFor="cauta-mobil" className="sr-only">
                Caută în catalog
              </label>
              <input
                id="cauta-mobil"
                name="q"
                type="search"
                autoComplete="off"
                placeholder="Caută în catalog"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-12 pl-4 text-base text-slate-700 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-avo-600/30"
              />
              <button
                type="submit"
                aria-label="Caută"
                className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-lg bg-avo-600 text-white"
              >
                <Search size={18} />
              </button>
            </form>

            <Link
              href="/contact"
              className="mt-4 flex items-center gap-3 border-b border-slate-100 py-3 text-lg text-slate-700"
            >
              <Phone size={18} className="text-avo-600" /> Contact
            </Link>
            <Link
              href="/cerere-oferta"
              className="flex items-center gap-3 border-b border-slate-100 py-3 text-lg text-slate-700"
            >
              <User size={18} className="text-avo-600" /> Autentificare
            </Link>
            <Link
              href="/cerere-oferta"
              className="mt-5 flex h-12 items-center justify-center gap-2.5 rounded-xl bg-avo-600 text-base font-semibold text-white transition-colors hover:bg-avo-700"
            >
              <ShoppingCart size={18} /> Coș
              <span className="ml-1 rounded-full bg-white/20 px-2 text-[12px] font-extrabold">0</span>
            </Link>
          </div>
        }
      >
        {/*
          Sigla stă lipită de marginea din stânga a coloanei, la aceeași
          verticală cu titlurile secțiunilor de dedesubt și cu telefonul din
          bara de contact.

          ─── A STAT CENTRATĂ ÎN SPAȚIUL DIN STÂNGA ──────────────────────────

          Containerul creștea (`grow`) iar sigla primea `justify-center`, deci
          se așeza la jumătatea distanței dintre marginea ferestrei și primul
          buton de meniu. Avea sens cât timp bara mergea pe toată lățimea
          ferestrei: acolo nu exista nicio muchie de care să se lipească, iar
          centrarea era singura poziție care nu părea aleasă la întâmplare.

          De când bara e în `coloana` (28.09.2026), muchia există. Sigla
          centrată începea cu ~90px mai la dreapta decât conținutul paginii, pe
          o pagină construită tocmai pe ideea că totul pornește de pe aceeași
          linie. `lg:pl-3 xl:pl-4`, care compensau `gap-3` al rândului, au ieșit
          odată cu ea — împingeau sigla exact de la muchia pe care acum o vrem.

          `grow` RĂMÂNE, deși sigla nu-l mai folosește ca să se centreze: el
          e cel care ține meniul unde era. Containerul ia spațiul liber, iar
          meniul rămâne la lățimea lui naturală, între siglă și acțiuni.

          `min-w-52` e podeaua sub care sigla nu mai coboară. Fără ea, când bara
          se aglomerează, containerul se strânge înaintea celorlalte și sigla
          ajunge la câțiva pixeli lățime.

          `grow` A IEȘIT. Îl avea ca să împartă spațiul liber cu containerul
          acțiunilor și să țină meniul centrat. Meniul nu mai există, iar
          spațiul liber îl ia acum câmpul de căutare — dacă l-ar lua și sigla,
          căutarea ar rămâne un ciot lipit de acțiuni.

          Nu e `flex-auto`, deși ar părea mai scurt: `flex-auto` scrie
          proprietatea `flex` întreagă, iar Tailwind o emite după `flex-shrink`,
          deci ar anula orice `shrink-*` pus pe același element.
        */}
        <Link href="/" className="flex shrink items-center min-w-0 lg:min-w-52">
          {/* Import static, nu șirul "/logo.png": Next scoate fișierul sub o
              adresă care conține un hash al conținutului. La orice modificare a
              siglei se schimbă adresa, deci browserele și optimizatorul de
              imagini nu mai pot servi versiunea veche din cache. Tot de aici
              vin și dimensiunile reale, fără să le scriem de mână.

              ÎNĂLȚIMILE SUNT ALESE DUPĂ LĂȚIME. Sigla de acum (AVO cu O roșu,
              „grup invest") e 8,6:1, cea veche, cu triunghi, era 5,7:1. La
              înălțimile vechi (36 → 48px) noua ar fi avut 310px lățime pe
              telefon, cât să împingă butonul de meniu afară din bară. Scrise
              la ~75% din cele vechi, iese cu doar ~12% mai lată: 232px pe
              telefon, 310px de la 2xl. */}
          <Image
            src={logo}
            alt="Avo Grup Invest"
            className="h-[27px] sm:h-[30px] md:h-[33px] 2xl:h-9 w-auto max-w-full object-contain"
            /* Cea mai mare lățime afișată: 36px × 8,6 = 310px la 2xl. Fără
               `sizes`, Next alegea din fișierul de 1490px și cerea varianta
               de 3840px. Nu mai e `priority`: sigla nu e elementul LCP și
               nu trebuie să ia banda pozei principale. */
            sizes="310px"
            loading="eager"
          />
        </Link>

        {/* ── Căutarea ───────────────────────────────────────────────────
            Ia tot spațiul liber dintre siglă și acțiuni, plafonat la 620px:
            peste atât câmpul arată gol, fiindcă nimeni nu scrie 80 de
            caractere într-o căutare de produs.

            NU CAUTĂ ÎNCĂ. Site-ul n-are index de căutare — cele 845 de produse
            n-au fost încă indexate la construcție. Formularul trimite pe
            /catalog, cu termenul în `q`: măcar duce unde se caută, în loc să
            înghită tastele. Când indexul există, se schimbă `action` și atât.

            ERA SCOASĂ DIN BARĂ exact pentru că nu făcea nimic — „o lupă care
            nu caută e mai rău decât niciuna". Se întoarce la cerere, cu o
            țintă reală de data asta. */}
        <form
          action="/catalog"
          role="search"
          className="hidden lg:flex relative grow items-center max-w-[620px]"
        >
          <label htmlFor="cauta-bara" className="sr-only">
            Caută în catalog
          </label>
          <input
            id="cauta-bara"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Caută invertoare, panouri fotovoltaice sau acumulatori"
            className="h-11 w-full rounded-xl border border-white/80 bg-white/70 pr-28 pl-4 text-[13px] text-slate-700 transition-all placeholder:text-slate-500 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-avo-600/30 xl:text-sm"
          />
          <button type="submit" className={BUTON_CAUTARE}>
            <Search size={16} />
            Caută
          </button>
        </form>

        {/* ── Acțiunile ──────────────────────────────────────────────────
            Contact, Autentificare, Coș.

            DOUĂ DINTRE ELE N-AU ÎNCĂ UNDE SĂ DUCĂ. Site-ul n-are conturi și
            n-are coș — magazinul e amânat până decide conducerea. Până atunci
            amândouă trimit la cererea de ofertă, singura acțiune pe care un
            vizitator chiar o poate duce la capăt aici.

            Fuseseră scoase din bară tocmai fiindcă nu duceau nicăieri. Se
            întorc la cerere; când magazinul se deschide, li se schimbă doar
            `href`-ul. Bulina coșului arată `0`, nu o cifră inventată. */}
        <div className="hidden lg:flex shrink-0 items-center gap-2 xl:gap-2.5">
          <Link href="/contact" className={BUTON_ACTIUNE} title="Contact">
            <Phone size={17} className="shrink-0" />
            <span className="hidden xl:inline">Contact</span>
          </Link>

          <Link href="/cerere-oferta" className={BUTON_ACTIUNE} title="Autentificare">
            <User size={17} className="shrink-0" />
            {/* Eticheta apare de la `xl`, ca și „Contact". A fost `2xl`, ca
                rezervă de lățime — dar la 1440 butonul rămânea o pictogramă
                singură lângă două butoane cu text, deci arăta a element
                neterminat, nu a element strâns. Măsurat la 1440: acțiunile cer
                ~380px din 1136, iar căutarea rămâne la 516px, peste minimul de
                la care un câmp de căutare e încă folosibil. */}
            <span className="hidden xl:inline">Autentificare</span>
          </Link>

          <Link href="/cerere-oferta" className={BUTON_COS} title="Coș">
            <span className="relative flex shrink-0">
              <ShoppingCart size={17} />
              <em className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-avo-600 bg-white px-1 text-[9px] font-extrabold not-italic text-avo-700">
                0
              </em>
            </span>
            <span className="hidden xl:inline">Coș</span>
          </Link>
        </div>
      </NavbarInteractiv>
    </nav>
  );
}
