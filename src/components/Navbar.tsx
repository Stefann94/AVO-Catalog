import Link from "next/link";
import Image from "next/image";
import logo from "../../public/logo.png";
import { Phone, Mail, MapPin } from "lucide-react";
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
 * Singurul buton plin din bară: cererea de ofertă.
 *
 * Într-un catalog fără coș, asta E conversia — nu există altă acțiune pe care
 * un vizitator s-o poată duce la capăt. De-aceea e singurul element colorat
 * plin din bară: dacă ar fi două, n-ar mai fi niciunul.
 */
const BUTON_PRINCIPAL =
  "shrink-0 whitespace-nowrap flex items-center justify-center " +
  "h-11 px-4 xl:px-5 2xl:px-6 rounded-xl text-[13px] xl:text-sm font-semibold " +
  "bg-avo-600 text-white border border-avo-600 transition-all " +
  "hover:bg-avo-700 hover:border-avo-700 hover:shadow-md hover:shadow-avo-900/15 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600";

/** Butoanele de navigare: se lățesc pe măsură ce e loc. */
const BUTON_MENIU =
  BUTON_BARA + " gap-2 h-11 px-3.5 xl:px-4 2xl:px-5 text-[13px] xl:text-sm";

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
          <div className="p-6 flex flex-col">
            <Link href="/catalog" className="text-slate-700 text-lg py-3 border-b border-slate-100">Catalog</Link>
            <Link href="/catalog/lichidare-stoc" className="text-slate-700 text-lg py-3 border-b border-slate-100">Lichidare de stoc</Link>
            <Link href="/despre-noi" className="text-slate-700 text-lg py-3 border-b border-slate-100">Despre noi</Link>
            <Link href="/contact" className="text-slate-700 text-lg py-3 border-b border-slate-100">Contact</Link>
            <Link
              href="/cerere-oferta"
              className="mt-5 flex items-center justify-center h-12 rounded-xl bg-avo-600 text-white text-base font-semibold hover:bg-avo-700 transition-colors"
            >
              Cere ofertă
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

          Nu e `flex-auto`, deși ar părea mai scurt: `flex-auto` scrie
          proprietatea `flex` întreagă, iar Tailwind o emite după `flex-shrink`,
          deci ar anula orice `shrink-*` pus pe același element.
        */}
        <Link href="/" className="flex shrink items-center min-w-0 lg:min-w-52 lg:grow">
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

        {/* ── Meniul ─────────────────────────────────────────
            Patru linkuri, toate către pagini care există.

            CE A IEȘIT DE AICI ȘI DE CE:

              „Parteneri B2B” ....... fereastră cu „Cont Gold −10%” și „Cont
                                     Platinum −15%”. Conturile nu există, iar
                                     reducerile erau afișate ca și cum ar fi
                                     reale. Linkul ei, /devino-partener, dă 404.
              „Sisteme Industriale” . ducea la /oferte-en-gros, care nu există.
                                     Era și singurul buton verde din bară,
                                     a cincea culoare de accent din pagină.
              „Cont B2B” ............ nu deschidea nimic. Site-ul n-are conturi.
              căutarea ............. câmpul și butonul cu lupă nu făceau nimic.
                                     Se întorc când căutarea chiar funcționează;
                                     o lupă care nu caută e mai rău decât niciuna.

            Au rămas patru linkuri și o singură acțiune. Navigarea prin marfă o
            face rândul de categorii de sub bară (catalog/MeniuCategorii.tsx),
            prezent acum și pe prima pagină — deci bara n-are de ce s-o repete. */}
        <div className="hidden lg:flex shrink-0 items-center gap-2 xl:gap-2.5 2xl:gap-3">
          <Link href="/catalog" className={BUTON_MENIU}>
            Catalog
          </Link>
          <Link href="/catalog/lichidare-stoc" className={BUTON_MENIU}>
            Lichidare de stoc
          </Link>
          <Link href="/despre-noi" className={BUTON_MENIU}>
            Despre noi
          </Link>
          <Link href="/contact" className={BUTON_MENIU}>
            Contact
          </Link>
        </div>

        {/* ── Acțiunea principală ──────────────────────────────────
            `grow` împinge butonul la marginea dreaptă și, îmreună cu `grow`-ul
            de pe containerul siglei, ține meniul centrat — aceeași mecanică de
            dinainte, cu un singur element în loc de patru. */}
        <div className="hidden lg:flex lg:grow lg:justify-end items-center">
          <Link href="/cerere-oferta" className={BUTON_PRINCIPAL}>
            Cere ofertă
          </Link>
        </div>
      </NavbarInteractiv>
    </nav>
  );
}
