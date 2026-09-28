# Ce stă degeaba în proiect

Inventarul lucrurilor care există în cod dar nu ajung în site. Ținut ca să nu
se mai piardă nimeni prin fișiere întrebându-se dacă o bucată e vie sau nu.

**Actualizat:** 28.09.2026
**Cum se reface:** `node scripts/nefolosite.mjs` din rădăcina proiectului.

---

## 1. Cod scos din site — `arhiva/`

Șapte fișiere, ~1900 de linii. Exclus din `tsconfig.json` și
`eslint.config.mjs`, deci nu se compilează și nu se verifică.

Motivul fiecăruia e în [`arhiva/README.md`](../arhiva/README.md). Pe scurt:

| Fișier | Linii | De ce a ieșit |
|---|---:|---|
| `componente/BaraFiltre.tsx` | 518 | trăia în marja din stânga, în afara coloanei |
| `componente/BaraReclame.tsx` | 150 | idem, în marja din dreapta |
| `componente/ReclamaPytes.tsx` | 146 | idem, lângă „Lichidare de stoc" |
| `componente/GamaProduse.tsx` | 595 | dubla bara de categorii de sub banner |
| `componente/BannerB2B.tsx` | 221 | a devenit secțiunea fixă `ConditiiB2B` |
| `componente/OferteleLunii.tsx` | 76 | arăta aceleași produse ca bannerul |
| `gama.ts` | 263 | biblioteca lui `GamaProduse`, rămasă fără cititor |

## 2. Imagini scoase din export — `arhiva/media/`

`public/` intră întreg în exportul static, deci orice fișier de acolo se
publică, folosit sau nu. Erau **13 MB** care nu se afișau nicăieri.

| Ce | Mărime | De unde venea |
|---|---:|---|
| `hero.jpg`, `battery.jpg`, `inverter.jpg`, `panel.jpg` | 2,5 MB | din `HeroSlider`, șters pe 26.09 |
| `cat-invertoare/montaj/panouri/stocare.jpg` | 660 KB | din `GamaProduse` |
| `reclame/*.jpg` (3 fișiere) | 4,0 MB | din `BaraReclame` |
| `originale/*.jfif` (2 fișiere) | 6,4 MB | originalele fotografiilor B2B, vezi mai jos |
| `file/globe/next/vercel/window.svg` | 6 KB | rămase din șablonul Next |

**Fotografiile B2B au fost reîncărcate, nu șterse.** `depozit-b2b` și
`partener-b2b` se afișează în `ConditiiB2B`, dar erau `.jfif` de 2816×1536 —
3,57 MB și 2,86 MB — pentru un slot care la 1440px are 576×192. Reduse la
1600px lățime, JPEG calitate 82: **261 KB și 158 KB**. Originalele stau în
`arhiva/media/originale/`.

**Rezultat:** `public/` a scăzut de la **14,6 MB la 1,6 MB**.

## 3. Tokeni de design declarați și nefolosiți

`globals.css` declară un strat semantic complet (`@theme inline`), din care
site-ul folosește deocamdată doar o parte. **Nu e o problemă**: tokenii nu
ajung în CSS-ul livrat decât dacă îi cere cineva — Tailwind 4 generează
utilitarul abia când clasa apare în cod. Costul lor în octeți e zero.

Sunt aici doar ca să se știe ce există deja, fără să fie nevoie să fie scris
din nou:

**Culori:** `sunken`, `line-soft`, `action-dark`, `action-light`,
`action-soft`, `onaction`, `accent-dark`, `onaccent`, `navy`, `avo-200`,
`avo-500`

**Forme:** `rounded-control`, `shadow-card`, `shadow-lift`
(`rounded-card` se folosește, în `Marci.tsx`)

## 4. Exporturi fără cititor în `src/lib`

Funcții și tipuri exportate pe care nu le importă nimeni. Lăsate pe loc: sunt
mici, iar bundler-ul le elimină oricum din pachetul final.

| Fișier | Ce |
|---|---|
| `categorii.ts` | `CategorieCunoscuta`, `SubcategorieCunoscuta`, `caleSubcategorie` |
| `graphql-client.ts` | `ETICHETA_WP` |
| `oferte.ts` | `incarcaCeleMaiBuneOferte` — selecția „cea mai mare economie", înlocuită de secțiunile LICHIDARE STOC din catalog |
| `pagini-brand.ts` | tipul `PaginaBrand` |
| `perioada.ts` | tipul `PerioadaBruta` |
| `wordpress.ts` | `GAZDA_WP` |

`panou.ts` → `StareStoc`, `DateBaraFiltre`, `BARA_REZERVA` apar ca nefolosite
în scanare, dar nu sunt: `BARA_REZERVA` e rezerva folosită în același fișier,
iar tipurile se folosesc inline.

## 5. Funcționalități care arată, dar nu fac

Nu e cod mort — e interfață fără spate. Se știe, e intenționat, dar trebuie
ținut minte:

| Ce | Starea | Ce-i lipsește |
|---|---|---|
| Coșul de cumpărături | oprit intenționat | decide șeful când se activează |
| Căutarea pe site | nu există | index static peste cele 845 de produse |
| Comutator cu/fără TVA | doar în `/proba` | al doilea set de prețuri (ale noastre sunt EUR fără TVA) |
| Pagini pe marcă | doar per categorie | `/branduri/<slug>` cu toate produsele mărcii — de-aia siglele din `Marci.tsx` nu sunt linkuri |

## 6. Date care lipsesc din catalog

Nu se poate afișa ce nu există. Scris aici ca să nu fie inventat:

- **stoc** — coloana e goală la toate cele 845 de produse
- **fotografii** — lipsesc la 343 din 845
- **recenzii** — zero
- **depozite** — nu există o listă confirmată
- **CUI, Reg. Com., sediu social** — necesare în subsol (Legea 365/2002)

## 7. Unelte

`tools/` e exclus din lint (rulează direct în Node, e CommonJS). Conține
`import-opencart/` și `wp-test/`, netrackate în git la data asta — de
clarificat dacă rămân sau intră în arhivă.
