# Arhiva — ce a ieșit din site și de ce

Cod scos din site, păstrat fiindcă a costat timp și poate fi cerut înapoi.
**Nimic de aici nu se compilează și nu ajunge în pagini.** `arhiva` e exclusă
din `tsconfig.json` și din `eslint.config.mjs`.

Totul e și în istoricul git — asta e doar scurtătura, cu motivul lângă fișier.

## Cum se aduce ceva înapoi

1. `git mv arhiva/componente/<Fisier>.tsx src/components/`
2. Se pune importul în pagina care îl vrea.
3. Se citește secțiunea de mai jos: cele mai multe depind de lucruri care
   între timp au dispărut din proiect. Nu e copy-paste.

---

## Ieșite pe 28.09.2026 — trecerea la o singură coloană

Site-ul a trecut la o structură cu **o singură coloană centrată**, cu spații
egale la stânga și la dreapta, de la navbar în jos (vezi „COLOANA" în
`src/app/globals.css`). Cele trei de mai jos trăiau prin definiție **în afara
coloanei**, în marjele libere, și nu mai au unde să stea.

Toate trei aveau aceeași problemă de fond: se afișau **doar de la 1760px în
sus**. Pagina arăta altfel pe un monitor de birou decât pe un laptop, iar pe
telefon jumătate din conținut pur și simplu nu exista.

### `BaraFiltre.tsx` — 518 linii

Cuprinsul catalogului, lipit în marja din stânga secțiunii „Gama de produse":
categorii, subcategorii, stări de stoc, cu panou lipicios și bară de derulare
proprie.

**Depinde de:** variabilele `--bara-sus`, `--bara-banda`, `--bara-latime`,
`--bara-alipire`, `--bara-stanga` din `globals.css` — **șterse odată cu ea**.
Erau calculate din `100vw` și din lățimea containerului de 1280px, care nici
el nu mai există (coloana e 1200px).

**Ce a rămas util:** clasa `.derulare-avo` din `globals.css`, bara de derulare
subțire, e folosită mai departe de meniul din `/catalog`.

### `BaraReclame.tsx` — 150 linii

Oglinda barei de filtre, în marja din dreapta. Trei reclame de categorie,
JPG-uri late, una sub alta.

**Depinde de:** aceleași variabile șterse. Fotografiile rămân în
`public/reclame/`.

### `ReclamaPytes.tsx` — 146 linii

Reclama înaltă de lângă „Lichidare de stoc", desenată în HTML, nu imagine —
tocmai fiindcă într-o coloană de 240–300px textul dintr-un JPG ajunge la
5–10px și nu se mai citește.

**De reținut, dacă se face vreodată o reclamă îngustă:** argumentul din capul
fișierului rămâne valabil. Reclamele înguste se desenează, nu se pun ca poze.

---

## Ieșite mai devreme, șterse din pagini dar rămase pe disc

Fișiere care nu mai erau importate de nicăieri înainte de 28.09.2026. Mutate
aici în aceeași zi, ca să nu mai pară cod viu.

### `GamaProduse.tsx` — 595 linii

Rândul de carduri de categorii, cu date agregate din catalog și perioada de
valabilitate din WooCommerce.

**Scos pentru că** bara de categorii de sub banner (`MeniuCategorii`) spune
același lucru, mai compact. Două navigări pe categorii una sub alta e ce făcea
prima pagină să pară că se învârte în loc.

### `OferteleLunii.tsx` — 76 linii

Grila cu produsele de pe pagina „OFERTELE LUNII" a catalogului.

**Scos pentru că** arăta exact aceleași patru produse ca bannerul din capul
paginii și ca prima filă din `ProduseCuFile`. Ofertele apar acum o singură
dată.

**Ce a supraviețuit:** cardul dinăuntru a fost scos separat în
`src/components/oferte/CardOferta.tsx` și e folosit mai departe.

### `BannerB2B.tsx` — 221 linii

Bannerul B2B din „Gama de produse", cu mesaje care se roteau. Singura bucată
cu JavaScript din acea secțiune.

**Scos pentru că** mesajele au devenit secțiunea `ConditiiB2B`, fixă. Un
banner care se rotește cere ca cititorul să aștepte mesajul următor; o
secțiune le arată pe toate deodată, fără să trimită JavaScript în browser.

---

## Ce NU e aici, deși ar părea

| Ce | Unde e |
|---|---|
| `HeroSlider.tsx`, `BandaBranduri.tsx`, `BandaLucru.tsx` | doar în istoricul git (șterse pe 26–27.09.2026) |
| cele 9 filmări din `public/videos/` | șterse, ~3 MB de filmări de stoc |
| banda roșie „site în lucru" | mutată ca text în subsol |

## Vezi și

`docs/nefolosite.md` — inventarul a tot ce stă degeaba în proiect, nu doar
componente: rute, fotografii, variabile CSS, unelte.
