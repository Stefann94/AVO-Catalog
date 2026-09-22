# Etapa 0: audit și plan

Data: 22.09.2026. Nu s-a modificat nimic pe solarone.ro și nici în baza OpenCart locală. Pe site s-au făcut doar cereri GET pentru măsurători, iar în bază doar interogări SELECT.

Livrabile în repo:

- `docs/etapa-0.md`: acest raport.
- `docs/baseline/solarone-2026-09-22.md` și `.json`: baseline-ul pe 10 pagini.
- `docs/cautari-test.csv`: cele 30 de căutări-test, fiecare cu pagina solarone.ro care îi corespunde.
- `tools/masurare/`: scriptul de măsurare. Aceeași metodă se va rula și pe copie.

---

## 1. Baseline solarone.ro

Metoda e scrisă în capul scriptului `tools/masurare/masoara.mjs`:

- Lighthouse 13 pe mobil (Slow 4G simulat, procesor încetinit de 4 ori), 3 rulări pe pagină, se păstrează mediana după LCP.
- TTFB măsurat cu curl, 5 cereri pe pagină, mediana. Se numără doar timpul serverului, fără DNS și TLS.
- HTML-ul fiecărei pagini e analizat pentru canonical, H1 și JSON-LD.

Paginile: prima pagină, 4 categorii, pagina de brand Pytes și 4 fișe de produs (invertor, acumulator, panou, accesoriu de montaj).

**Mediane pe cele 10 pagini, comparate cu obiectivele copiei:**

| Indicator | solarone.ro | Obiectiv copie |
|---|---|---|
| TTFB (doar serverul) | 671 ms (363–1.047) | < 200 ms |
| LCP, mobil Slow 4G | 7,58 s (6,84–27,05) | < 2,0 s |
| CLS | 0 (max. 0,094) | < 0,05 |
| HTML pe pagină | 888 KB, din care ~590–720 KB CSS inline | < 80 KB |
| JS transferat | 479 KB | < 100 KB |
| Lighthouse Performance | 46 (41–55) | ≥ 95 |
| Lighthouse SEO | 100 | 100 |
| Total Blocking Time | ~1.000 ms | — |

Tabelul complet, pagină cu pagină, e în `docs/baseline/solarone-2026-09-22.md`.

Constatări noi față de brief:

- **TTFB-ul iese mai mic decât 1,0–3,4 s din brief**, pentru că aici se măsoară doar timpul serverului, fără DNS și TLS. Cu aceeași metodă se va măsura și copia, deci comparația rămâne corectă.
- **LCP-ul iese mai mare decât 3,9–5,6 s din brief.** Profilul Slow 4G din Lighthouse e mai sever decât o măsurătoare pe teren.
- Pe categoria „Acumulatori Deye LV”, LCP-ul e de 27 s, iar pagina are 4,9 MB, din cauza imaginilor.
- Lighthouse dă SEO 100, pentru că verifică doar bazele. Problemele reale sunt în altă parte:
  - prima pagină are **0 H1** și canonical spre `index.php?route=common/home`, adresă blocată în robots.txt;
  - schema Product are availability și brand, dar **nu are gtin și nici mpn**;
  - pagina de brand Pytes nu are BreadcrumbList.

---

## 2. Ce are avo-catalog și ce lipsește

| Funcție | solarone.ro | avo-catalog azi | Pentru copie |
|---|---|---|---|
| Produse | 397 active (839 în bază, 442 dezactivate) | ~172, din catalogul PDF | toate cele 397 active |
| Categorii | 111 (96 active), 4 niveluri, arbore împărțit pe brand | 22, listă fixă în `lib/categorii.ts` | arbore pe funcție, brandul ca filtru (§3) |
| Filtre putere / fază / tensiune / brand | nu (tabelele de filtre sunt goale) | doar `?brand=`, indexabil | da, din atribute WooCommerce |
| Căutare | da | câmpul din Navbar nu face nimic | da |
| Paginare în categorie | da | nu (`first:48`, `hasNextPage` ignorat) | da |
| Coș / checkout | da | eliminat intenționat, model „cerere ofertă” | **decizie** |
| Cont / B2B | grup B2B șters (241 de reduceri orfane) | butoane fără rută (`/cont`, `/parteneri` …) | după decizia de preț |
| Prețuri | RON fără TVA în bază, afișate cu TVA 21% | EUR fără TVA, din PDF | **decizie** |
| Stoc | cantitate + status (734 in stock) | doar badge „Lichidare” | din date, cu data exportului |
| Galerie de imagini | 1.110 imagini suplimentare | o singură imagine | galerie completă |
| Titlu / meta per pagină | da (meta_title completat peste tot) | doar pe fișa de produs | toate paginile |
| Canonical | greșit pe prima pagină | lipsă peste tot | pe fiecare pagină |
| JSON-LD | Product fără availability și GTIN | lipsă complet | Product, Breadcrumb, Organization, ItemList |
| sitemap.xml / robots.txt | 35 de URL-uri `index.php?route=` | lipsă | generate din date |
| Hero | — | 3 video-uri (34 MB) încărcate și pe mobil | fără video pe mobil |

Alte probleme ale avo-catalog de reparat:

- `/catalog/orice/{subcategorie}` randează aceeași pagină, deci apar URL-uri duplicate.
- Grila de produse din categorie folosește `<img>` simplu, fără `next/image`.
- Numele „Avo Grup Invest” e scris direct în cod: titluri, subsol, e-mailuri, siglă, domeniul imaginilor, endpoint-ul implicit.

Partea bună: paginile de listă și de produs sunt aproape în întregime componente de server. JavaScript-ul de pe client vine în principal din Navbar, așa că ținta de sub 100 KB de JS e realistă.

---

## 3. Structura de URL-uri a copiei

Principii:

- Litere mici, fără diacritice, fără parametri în paginile indexabile.
- Fiecare pagină are un singur URL.
- Slug-ul se fixează la primul import și nu se mai schimbă la reimport. Dacă un slug trebuie totuși schimbat, se adaugă un redirect 301.

| Pagină | URL | Indexabil |
|---|---|---|
| Acasă | `/` | da |
| Categorie | `/invertoare`, `/invertoare/hibride-trifazate` | da |
| Categorie × brand (doar cu ≥ 3 produse) | `/invertoare/hibride-trifazate/deye` | da |
| Paginare | `/invertoare/pagina/2` | da, cu canonical pe ea însăși |
| Brand | `/branduri/deye` | da |
| Produs | `/produs/invertor-hibrid-trifazat-deye-sun-10k-sg05lp3-eu-sm2` | da |
| Filtre (putere, fază, tensiune, capacitate) | `?putere=10kw&faza=trifazat` | nu: `noindex,follow` + canonical spre pagina curată |
| Sortare | `?ordine=pret` | nu |
| Căutare | `/cautare?q=` | nu, și blocată în robots.txt |
| Coș, cont, checkout | `/cos`, `/cont`, `/comanda` | nu, blocate în robots.txt |

Slug-ul de produs are forma: tip + fază/rol + brand + codul complet. Căutările de cod exact ajung astfel în URL, în titlu și în H1.

Arborele de categorii se reface pe funcție. În OpenCart, arborele e pe brand („Invertoare > Deye > Trifazate > LV”), iar oamenii caută după tip („invertor hibrid trifazat 10 kW”). Propunere:

- Invertoare: hibride monofazate, hibride trifazate (low voltage / high voltage), on-grid, off-grid
- Acumulatori: low voltage, high voltage, sisteme de stocare industriale, accesorii
- Panouri fotovoltaice
- Sisteme fotovoltaice (kituri): cu montaj, fără montaj
- Sisteme de montaj: țiglă, tablă, acoperiș plat, profile și cleme
- Cabluri și conectori
- Protecții
- Monitorizare
- Stații de încărcare
- Carport

Brandul devine taxonomie separată, cu pagini `/branduri/{brand}`, și dimensiune de filtru. Combinațiile categorie × brand care au sens primesc pagină statică proprie.

Tabelul complet de mapare categorie OpenCart → categorie nouă se livrează în Etapa 1, ca fișier editabil.

---

## 4. Planul de import OpenCart → WooCommerce

**Ce e de fapt în bază** (dump din 17.09.2026):

- 397 de produse active. Cifra de ~520 din brief nu se regăsește. Probabil includea kituri dezactivate sau produse ale „Oferte la container”, categorie care are 0 produse active.
- **Atributele tehnice lipsesc.** `product_attribute` e gol, iar filtrele sunt goale. Specificațiile există doar ca tabele HTML în descrieri: 300 din 397 de produse au tabel „Specificație | Valoare”.
- **GTIN / EAN / MPN: 0 completate.** Codul producătorului e în `model`, dar 38 de produse au valoarea literală „Model”.
- **Imaginile nu sunt pe disc.** 838 de produse au cale de imagine în bază, însă 0 din 1.376 de fișiere există local. În repo există deja poze pentru o parte din produse (`poze-solarone/`, `poze-produse*/`).
- Prețurile sunt în RON fără TVA 21%. Tabela de monede e stricată (nu are RON), iar clasa de taxă 24 nu există.
- 342 de produse nu au producător.

**Import în trei pași, fiecare rulabil oricând și de oricâte ori:**

1. **extrage** (`tools/import-opencart/extrage.mjs`)
   - Citește din `solarone-db` doar cu SELECT.
   - Scrie `date/opencart-AAAA-LL-ZZ.json`: produse, descrieri, categorii, producători, imagini, reduceri, seo_url.
2. **transformă** (`transforma.mjs`)
   - Normalizează specificațiile din tabelele HTML după un dicționar de chei. De exemplu „Putere nominală de ieșire”, „Putere AC nominală” și „Rated output power” devin toate `putere_ac_w`.
   - Completează ce lipsește din codul de model, după reguli verificabile. De exemplu, `SUN-10K-SG05LP3` înseamnă 10 kW, trifazat, low voltage.
   - Ce nu se poate deduce ajunge într-un fișier de corecții manuale (`corectii.json`), nu se ghicește.
   - Rezultatul: atribute globale `pa_putere`, `pa_faza`, `pa_tensiune-baterie`, `pa_capacitate`, `pa_tip-invertor`, `pa_putere-panou`, `pa_tehnologie`, plus brand, categorii noi, preț, stoc și texte proprii (§5).
3. **importă** (`importa.php`, rulat cu WP-CLI în containerul de test)
   - Cheia de legătură e `_oc_product_id` (meta). Rularea a doua oară actualizează produsele, nu le dublează.
   - Slug-ul se scrie doar la creare.
   - Imaginile se încarcă o singură dată, identificate prin hash.
   - `--simulare` arată ce s-ar schimba fără să scrie nimic.

**Raport de diferențe la fiecare rulare** (`date/raport-import-AAAA-LL-ZZ.md`):

- produse adăugate, modificate (câmp cu câmp: preț vechi → nou, stoc, atribute), neschimbate, dispărute din sursă (trecute pe ciornă, nu șterse);
- produse fără imagine, fără specificații, fără brand sau cu atribute nededuse.

---

## 5. Texte proprii

Nu se copiază nimic din descrierile, titlurile sau meta-urile solarone.ro. Fiecare text se compune din date, după șabloane pe categorie:

- **Titlu:** „Invertor hibrid trifazat Deye SUN-10K-SG05LP3-EU-SM2, 10 kW, low voltage”.
- **Meta descriere:** putere, fază, tip de baterie compatibilă, prețul cu TVA și disponibilitatea, exact cum apar în date.
- **Descriere:**
  - un paragraf de poziționare calculat din date: unde se află produsul în gama brandului, de exemplu „cel mai mic model trifazat al seriei SG05LP3”;
  - ce baterii și ce puteri de panou se potrivesc, pe baza tensiunii și a puterii PV maxime;
  - tabelul de specificații cu denumiri uniforme.
- **Texte de categorie:** scrise o dată, pe categorie, după structura din „Strategie poziționare Google” (C1): ce sunt produsele, cum alegi, un tabel comparativ generat din produsele categoriei, întrebări frecvente.

Ce nu intră în texte: termene de livrare, garanții care nu apar în specificații, recenzii, stoc „estimat”. Garanția apare doar dacă e un rând în tabelul de specificații al produsului.

---

## 6. WordPress-ul de test

- Un stack Docker nou: `tools/wp-test/`, proiect `avo-wp-test`, portul **8093**. Porturile 8090, 8091 și 8092 sunt ocupate de alte proiecte.
- Avo-catalog nu mai citește din www.avogrupinvest.ro. `WP_GRAPHQL_URL` trece pe noul endpoint, iar domeniul imaginilor se schimbă în `next.config.ts`.
- Pluginuri:
  - WooCommerce
  - WPGraphQL
  - WPGraphQL for WooCommerce (1.0.3, ca în `tools/wp-local`)
  - un plugin propriu, mic, care trimite revalidarea la salvare și expune în GraphQL câmpurile noastre: brand, `_oc_product_id`, texte generate.
- Fără plugin de SEO: titlurile, canonicalul, JSON-LD-ul și sitemap-ul le face Next.js.

---

## 7. Cele 30 de căutări-test

Lista e în `docs/cautari-test.csv`, cu pagina solarone.ro corespunzătoare pentru fiecare:

- 23 de căutări după codul exact de produs: Deye, Huawei, Growatt, Solis, Pytes, Felicity, Canadian, Aiko, Jinko, Longi;
- 6 căutări de categorie cu specificație, de exemplu „invertor hibrid trifazat 10 kW” sau „acumulator LiFePO4 48V 5 kWh”;
- 1 căutare de brand: „distribuitor Deye România”.

Toate produsele din listă sunt active în baza OpenCart.

---

## 8. Riscuri de știut dinainte

- **Aceleași produse pe două domenii.** Cu texte proprii nu e conținut duplicat, dar copia concurează direct cu solarone.ro pe aceleași căutări. Dacă testul reușește, poate lua trafic de la solarone.ro pe durata testului.
- **Merchant Center** cere GTIN pentru produsele de brand. În date nu e niciunul. Se poate trimite brand + MPN (codul de model), fără GTIN inventat. Unele produse pot primi totuși avertismente de „identificator lipsă”.
- **Checkout pe un domeniu nou** înseamnă o firmă reală în spate: termeni, politică de retur, ANPC, date de facturare, plăți. Nu e doar o chestiune tehnică.
- **Imaginile.** Fără ele nu se aprobă nimic în Merchant Center, iar fișele arată goale. Vezi decizia 5.

---

## Decizii pe care le aștept înainte de Etapa 1 / 2

1. **Numele și domeniul copiei.**
2. **Unde se găzduiește WordPress-ul de test**, după faza locală. De exemplu un VPS mic (Hetzner, DigitalOcean) sau hosting WordPress administrat. Recomand VPS în UE cu Docker, ca să fie același stack ca local.
3. **Checkout: da / nu.** Cu „nu”, obiectivul Merchant Center iese din test. Cu „da”, e nevoie de firma, datele legale și procesatorul de plăți.
4. **Prețuri: client final (RON cu TVA) sau B2B (EUR fără TVA).** Constatare importantă:
   - PDF-ul are 172 de produse, cu preț partener în EUR.
   - Doar 82 dintre ele se regăsesc printre cele 397 active din OpenCart.
   - Pentru restul de ~315 produse singurul preț disponibil e cel din OpenCart (RON fără TVA).
   - Recomand RON cu TVA, luat din OpenCart. PDF-ul l-aș folosi doar ca verificare pentru cele 82 de produse comune, cu diferențele raportate.
5. **Imaginile.** Fie se preiau de pe solarone.ro (câteva sute de GET-uri pe `/image/…`, citire, fără modificări), fie primesc arhiva folderului `image/catalog` de pe server, fie se folosesc doar pozele deja existente în repo. Cea mai curată variantă e arhiva.
6. **Numărul de produse.** Se importă cele 397 active? Sau și o parte din cele 442 dezactivate, de exemplu kiturile? Cifra de ~520 din brief nu se regăsește în dump.
