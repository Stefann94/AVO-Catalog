<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AVO Catalog — context de proiect

> Scris pentru o sesiune care deschide proiectul fără istoric. Conține ce nu se
> poate deduce din cod: de ce e făcut așa, ce s-a încercat și a ieșit, ce e
> interzis și cum vrea utilizatorul să se lucreze.
>
> Ultima actualizare: 29.09.2026.

## 1. Regulile utilizatorului — se respectă înaintea oricărei alte judecăți

**Push pe `main` DOAR la cerere explicită.** Comiți local după fiecare
implementare verificată, cu mesaj complet, și spui că e comis și neurcat. Nu dai
push fiindcă „merge" sau fiindcă pare gata.

*De ce:* publicarea pe Hostico pornește la fiecare push, durează 18–23 de minute
și are `concurrency: cancel-in-progress`. Opt push-uri într-o oră au însemnat
șapte rulări anulate una după alta și **zero publicări** — site-ul a rămas 2,5
ore în urmă. Când dai totuși push, nu mai dai altul până nu se termină rularea.

**O întrebare cere un sfat, nu execuție.** „Oare ar trebui…", „ce părere ai…",
„poți face cumva…" înseamnă: analizează, măsoară, propune, recomandă — și
oprește-te. Se modifică doar la cerere directă („fă", „schimbă", „pune"), și
doar exact cât s-a cerut.

**Când vrea ceva, o spune direct.** Nu ghici intenții din întrebări.

## 2. Ce e proiectul

`avo-catalog` e site-ul **avogrupinvest.ro** — un catalog B2B de echipamente
fotovoltaice. E și terenul de test pentru trecerea lui **solarone.ro** pe
WooCommerce headless. **solarone.ro nu se atinge niciodată**, nici codul, nici
serverul, nici baza de date; se măsoară doar, din afară.

AVO Grup Invest e firma din spatele Solar One. Din 23.09 catalogul a înlocuit
site-ul de prezentare de pe avogrupinvest.ro, iar WordPress-ul a trecut pe
subdomeniu.

Prototipul de design e la `C:\Users\Sony\Desktop\Projects\Solarone.ro`
(`stil-v2.css`, `index.html`) — făcut de utilizator. Multe decizii vizuale sunt
copiate de acolo, cu cifrele lui. Când ceva „arată prea mare / prea mic",
**compară întâi cu prototipul** înainte de a propune ceva.

## 3. Arhitectura

```
WordPress + WooCommerce         Next.js 16 (App Router)        Hostico
admin.avogrupinvest.ro   ──►    output: "export"        ──►    avogrupinvest.ro
   /graphql (WPGraphQL)         build → out/                   (LiteSpeed, doar fișiere)
```

- **Datele** vin prin GraphQL, la build. Tot ce atinge WordPress e în
  `src/lib/`: `graphql-client.ts`, `queries.ts`, `produs.ts`, `oferte.ts`,
  `panou.ts`, `categorii.ts`, `wordpress.ts`, `pagini-brand.ts`, `spec.ts`,
  `perioada.ts`, `paginare.ts`. **Nu le atinge pentru lucrări de aspect.**
- **Publicarea**: `.github/workflows/publica.yml` construiește pe GitHub și urcă
  prin FTP în `/public_html/`. Pornește la push pe `main`, nocturn la 03:10 UTC,
  la `repository_dispatch` trimis de WordPress când se salvează un produs, sau
  manual.
- **Fotografiile**: build-ul scrie adrese `/_next/image?url=…`, iar
  `tools/imagini/pregateste-static.mjs` le transformă în AVIF înainte de urcare.
  `images.unoptimized: true` a fost respins intenționat — ar scrie adresele
  brute, unealta n-ar mai găsi nimic, iar workflow-ul refuză publicarea sub 1000
  de fotografii. În build-ul curent sunt ~2554 de adrese distincte.
- **Dezvoltare**: `next.config.ts` scoate `output: "export"` în faza de dev.
  Serverul de dev moare dacă pierde terminalul — se pornește dintr-un script
  Node, pe portul 3100, nu din shell.

### Capcane cunoscute pe server

- **Wordfence** a doborât odată WordPress-ul cu `auto_prepend_file` spre
  `/public_html`, pus în `.htaccess` ȘI în `.user.ini`. Logul PHP e în
  `~/logs/php.error.log`. **Nu apăsa „Optimize Firewall".**
- **Imunify360** taie site-ul și `/graphql` la rafale de cereri de pe IP-ul
  firmei. Verifică titlul paginii înainte de a raporta cifre dintr-o măsurătoare.

## 4. Reguli de conținut — nu se încalcă

1. **Texte proprii, nu copiate.**
2. **Nu inventa: stoc, termene de livrare, garanții, recenzii.** În catalog,
   singura valoare reală de disponibilitate e „Lichidare stoc", pe 15 produse;
   „În stoc" apare doar într-o listă de rezervă scrisă în cod. Un „în stoc" pe
   card ar fi o promisiune inventată — a fost pus o dată și scos.
3. **Magazinul e amânat, decide șeful.** Coșul e blocat intenționat. Butonul de
   pe card duce la `/cerere-oferta` și scrie „Cere ofertă". Când se deschide
   magazinul, se schimbă textul și `href`-ul.
4. **Măsoară înainte și după, cu aceeași metodă, și raportează cifre.** Toate
   deciziile de mai jos au în spate măsurători cu CDP pe pagina randată, nu
   impresii.
5. Excepție acordată explicit: cele cinci dale de reclamă din hero sunt copiate
   1:1 după prototip, chiar dacă datele nu sunt reale.

## 5. Sistemul de design

### Tokeni (`src/app/globals.css`)

```
fonduri    --canvas #f7f9fc   --surface #fff      --sunken #f0f3f7
text       --fg #10151c       --muted #47535f     --faint #7d8a97
contururi  --line #e5eaf0     --line-soft #f0f3f7 --line-strong #cbd6e4
acțiune    avo-600 #004a99 (repaus)  avo-500 #2a75d1 (hover/legături)
raze       --radius-card 12px        --radius-control 8px
coloana    --coloana-max 1500px      --coloana-pad 16/24/32px
```

**Regula conturului:** `line-strong` (1px, #cbd6e4) înseamnă „obiect" — carduri,
butoane, bara de file, săgeți. `line` e pentru despărțiri în interiorul unui
obiect. Un obiect fără margini nu se citește ca obiect: asta a fost cauza a trei
probleme diferite (cardurile care se ghiceau, dalele de categorii care păreau o
bară solidă, bara de file care arăta ca niște cuvinte lăsate pe pagină).

### Cardul de produs — `src/components/CardProdus.tsx`

**Unul singur în tot site-ul.** Erau trei rețete (prima pagină, `CardOferta`,
grila de categorie scrisă direct în pagină); acum e unul, folosit peste tot.

Desenul e cel din prototip (`.p*` din `stil-v2.css`): poză 180px lată cât
cardul, sigla mărcii, denumire 13,6/600/1,38, cod monospațiat, preț 21px cu
unitatea alături, buton lat.

- **Înălțime fixă**, cerută explicit. Cutia denumirii are 38px de la `sm` (două
  rânduri) și 75px pe telefon (patru). Rândul codului își păstrează înălțimea și
  când produsul n-are cod. Rezultat măsurat: **o singură înălțime de card pe
  fiecare lățime** (442px la desktop), pe toate filele și toate paginile.
- **Corpul denumirii scade după lungime**, cu praguri măsurate pe toate cele 172
  de denumiri, în cutie de lățimea celui mai îngust card (226px):
  `≤66 car → 13,6px`, `≤80 → 12,6px`, `>80 → 10,8px`. Sub prag, `line-clamp`
  taie — cutia nu se revarsă niciodată.
- **`items-end` pe cutia denumirii**: când numele are un rând, golul cade
  DEASUPRA lui, lângă siglă, nu între denumire și cod.
- Insignele („Ofertă", economia la volum, „Lichidare") și cifra care ține locul
  pozei lipsă („16 kWh") vin din date, toate.

### Hover-ul cardului — `.card-produs` în globals.css

Rama trece în avo-600, în jur apare un halou de 3px la 9%, **cardul nu se mișcă
niciun pixel**. Patru variante respinse înainte, în ordine: elevare cu
`translateY` (s-a cerut explicit ca ce e pe loc să rămână pe loc), contur
albastru simplu („prea basic"), fileu de 1px pe interior (la 1px lângă 1px se
citește ca margine randată neclar, nu ca dublu contur), inel de 2px prin `ring`
(prea multă cerneală pe o grilă de cinci).

### Titluri

`dimensiuneTitluSectiune()` din `components/stiluri.ts`, plafon **28px**, font
**Archivo 700**. A fost 42px/800 — pe o pagină cu text de bază 16px și text de
card 13,6px ieșea de 2,6 ori textul din jur, adică un banner. Reperul e
prototipul, unde `.sec-h h2` e 25px; 28 fiindcă noi avem Archivo.

Corpul se calculează în `cqi`, deci cere `@container` pe învelișul titlului, iar
etalonul e un titlu-model, ca toate secțiunile să iasă la același corp.

### Benzi derulabile

- **Pista** e marcaj de server curat: `overflow-x-auto` + `snap-x`, marcată
  `data-pista`. Zero JavaScript.
- **Săgețile** sunt o singură componentă de client, `components/SagetiBanda.tsx`,
  pusă în capul secțiunii, oriunde într-un `data-banda`. Caută pista vizibilă la
  fiecare apăsare — de-aia merge și pentru filele care se schimbă din CSS.
- Matematica pasului, citirea capetelor și rețeta butoanelor sunt în
  `components/derulare.ts`. Pasul e de două carduri, nu un ecran.
- Regula: **comanda unei benzi stă în dreapta sus a secțiunii ei.**

### Filele de produse — `acasa/ProduseCuFile.tsx`

Schimbarea panoului se face **din CSS**, cu `:has()` peste `<input type=radio>`
ascunse. Zero JavaScript. Plăcuța albă a filei deschise alunecă între etichete;
poziția i-o dă `SagetiBanda`, care ascultă oricum `change`. Fără JavaScript,
fundalul se desenează pe etichetă ca înainte — aspectul e neschimbat, doar nu
alunecă.

### Alte reguli stabilite

- Nimic nu se mișcă de la sine. Fără carusele automate, fără animații care
  pornesc singure. Săgețile dintre pașii de la „Cum comanzi" au fost animate o
  tură și au fost scoase la cerere — sunt doar desenate.
- Secțiunile alternează fondul (`canvas` / alb / închis), ca să se vadă unde se
  termină una.
- Spațiul unei secțiuni: `py-10 sm:py-12 lg:py-14`.

## 6. Prima pagină

Ordinea curentă, și motivul fiecărei poziții:

```
bara de categorii   ── lipită sub navbar, sticky
hero cu reclame     ── carusel + 3 casete + 5 dale, structura prototipului
Produse din catalog ── file: „Oferte" + cele mai mari 5 categorii, 12 per bandă
Lichidare de stoc   ── bandă derulabilă
Cum comanzi         ── după prețuri (atunci apare întrebarea „și cum iau?"),
                       înaintea condițiilor (alea explică de ce prețul se mișcă)
Condiții B2B        ── după prețuri, nu înaintea lor
Mărcile din catalog ── secțiune de încredere, închide pagina; 2 rânduri
```

**Ce mai lipsește**, în ordinea recomandată:

1. „De ce AVO" — cifrele firmei (172 produse, 17 mărci, distribuitor oficial
   pentru 5: Deye, Pytes, Felicity Solar, AIKO Solar, Canadian Solar). Toate
   reale, din `lib/site.ts`.
2. Text + linkuri interne în subsol — pagina e aproape numai carduri, deci
   aproape goală pentru Google. Există **24 de pagini de brand** generate și
   nelegate de nicăieri din prima pagină.

**Blocate, și pe ce anume:**

- Catalogul PDF descărcabil — nu există fișierul.
- Depozite și livrare — nu există lista.
- Stoc, termene, recenzii — nu există datele.
- **Subsolul legal**: `Footer.tsx` are `cui: ""` și `regCom: ""`. Pentru un
  comerciant online din România sunt **obligatorii prin Legea 365/2002**. E
  singura problemă juridică din listă.

## 7. Cum se verifică

Nimic nu se raportează ca „gata" fără: `npx tsc --noEmit`, `npx eslint src`,
`npx next build --webpack`, plus o măsurătoare pe pagina randată.

Măsurătorile se fac cu Chrome headless prin CDP, dintr-un script Node în
scratchpad. Capcane întâlnite:

- `Page.captureScreenshot` cu `captureBeyondViewport: true` pe prima pagină (e
  de ~10.000px) la `deviceScaleFactor: 2` blochează Chrome. Folosește doar
  fereastra.
- Tailwind 4 întoarce culorile computate în `oklch`/`lab` — nu le parsa cu o
  expresie care caută numere; ia valorile din `globals.css`.
- Când omori instanțe headless rămase, filtrează după linia de comandă
  (`--remote-debugging-port`), **nu** `taskkill /IM chrome.exe` — aia închide și
  browserul utilizatorului.
- Serverul static de test trebuie să încerce, în ordine: `cale`, `cale.html`,
  `cale/index.html`. Altfel `/catalog` (care e și fișier, și folder) dă 404.
