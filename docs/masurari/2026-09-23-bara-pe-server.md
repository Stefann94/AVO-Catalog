# 23.09.2026 — bara pe server, stilurile în pagină

Două modificări încercate, una păstrată, una dată înapoi. Toate cifrele de mai
jos sunt măsurate pe site-ul viu (avo-catalog.vercel.app) cu
`tools/masurare/masoara.mjs`: Lighthouse 13 mobil, rețea „Slow 4G" simulată,
procesor încetinit de 4 ori, mediana din 3 rulări după LCP.

Cerința sub care s-a lucrat: **site-ul trebuie să arate absolut identic.**

## De unde a pornit

`tools/masurare/diagnostic.mjs`, pe fișa de produs. LCP-ul de 3,4 s se
descompunea așa:

| | |
|---|---|
| Răspunsul serverului | 178 ms (13%) |
| Până browserul cere imaginea | 29 ms (2%) |
| Descărcarea imaginii | 100 ms (7%) |
| **Imaginea sosită, dar nedesenată** | **1080 ms (78%)** |

Deci nici serverul, nici imaginile. Firul principal era ocupat: 1014 ms calcul
de stiluri, 772 ms execuție JavaScript.

## Ce s-a păstrat: bara randată pe server

`Navbar.tsx` avea 441 de rânduri sub `"use client"` — se trimitea întreagă în
browser pe fiecare pagină, deși pe o fișă de produs nimic din ea nu
reacționează la nimic. Au rămas în browser două stări, în
`navbar/NavbarInteractiv.tsx` (190 de rânduri): hamburgerul și sticla barei.
Restul intră acolo ca marcaj gata făcut.

| Pagină | Perf înainte | Perf după | Blocare înainte | Blocare după |
|---|---|---|---|---|
| Acasă | 81 | 82 | 183 ms | 184 ms |
| **Catalog** | **74** | **79** | **434 ms** | **287 ms** |
| Categorie | 84 | 84 | 151 ms | 156 ms |
| Fișă produs | 87 | 87 | 158 ms | **125 ms** |

Câștigul e concentrat exact unde era greutatea: catalogul, cu 140 de produse,
a urcat 5 puncte și a scăpat de o treime din timpul de blocare.

**Verificarea că nu s-a schimbat nimic vizual:** capturi ale paginilor
întregi la 1440, 390 și 360 px, înainte și după — identice pixel cu pixel pe
catalog, categorie și fișă. Prima pagină nu se poate compara așa (videoul din
hero e în alt cadru la fiecare captură), deci acolo s-a comparat marcajul
barei, literă cu literă: singura diferență e amprenta din numele fișierului
siglei, care se schimbă la fiecare construcție.

## Ce s-a dat înapoi: `experimental.inlineCss`

Foaia de stil bloca desenarea 150 ms, iar lanțul document → stil → font dura
597 ms. Documentația lui Next recomandă inlinierea exact pentru cazul nostru.
Măsurată, era mai rea:

| | fără | cu |
|---|---|---|
| Performance, mediana | **83** | 77 |
| LCP, mediana | **3,91 s** | 4,04 s |
| FCP, prima pagină | **1,44 s** | 2,05 s |
| HTML, fișă de produs | **77 KB** | 360 KB |

Cauza e în ultimul rând: Next scrie stilurile de două ori — 89 KB în `<style>`
și încă o dată, cu escape, în datele React din aceeași pagină. ~280 KB în plus
la fiecare document, ~50 KB după comprimare. Pe o rețea lentă costă mai mult
decât drumul economisit.

`cssChunking` nu ajută: tot CSS-ul vine dintr-un singur fișier Tailwind
importat în layout, deci n-are ce să fie tăiat pe rute.

## Două piste verificate și abandonate

- **„14 KB de JavaScript pentru browsere vechi"**, raportate de Lighthouse:
  în realitate `next/dist/build/polyfills/polyfill-module.js` are **1,4 KB**.
  Estimarea auditului e o euristică, nu o măsurătoare.
- **`optimizePackageImports` pentru `lucide-react`**: e deja în lista
  implicită a lui Next. Nimic de câștigat.

## Ce limitează acum, și ce ar costa

**JavaScript-ul e 85% framework.** Din 582 KB necomprimați pe o fișă: 223 KB
react-dom, 162 KB runtime-ul Next, 110 KB React. Codul nostru e ~87 KB. Mutarea
barei pe server a scos 10 KB — restul componentelor ar da tot atât. Sub ~500 KB
nu se poate coborî cât timp folosim App Router.

**Trei lucruri rămân, toate cu preț de schimbare vizibilă sau de comportament:**

1. **Catalogul arată 140 de produse deodată** — 1407 KB de HTML, cel mai slab
   scor (79). Repararea înseamnă paginare, adică alt design.
2. **Paginile de categorie se randează la cerere** (TTFB 267 ms față de
   ~130 ms pe cele statice), din cauza filtrului `?brand=` citit pe server.
   Mutat în browser, paginile devin statice — dar o adresă filtrată deschisă
   direct ar arăta o clipă toate produsele, înainte de filtrare.
3. **Videourile din hero** decid LCP-ul primei pagini și țin firul principal
   ocupat 1,1 s cu decodare. Pornirea lor după prima desenare ar ajuta, dar
   înseamnă că videoul începe cu o fracțiune de secundă mai târziu.

Niciuna nu s-a făcut. Toate trei sunt decizii de design, nu de implementare.
