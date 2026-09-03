/**
 * Brandurile din catalog.
 *
 * Numărate din CSV-ul de import (Catalog Solar One 09.2026): 17 valori
 * distincte în atributul `Brand`, pe 148 din cele 172 de produse. Restul de 24
 * sunt structuri de montaj și accesorii generice, fără marcă proprie.
 *
 * Ordinea e după numărul de produse. Primele cinci acoperă 82% din catalog.
 *
 * `produse` nu se afișează încă nicăieri, dar decide ordinea din bandă și va fi
 * folosit de secțiunea de branduri, când o facem. La primul import care aduce
 * date reale, cifrele se recalculează din GraphQL.
 *
 * Fiecare intrare are o siglă în public/branduri/<slug>.png. Siglele sunt
 * normalizate ca siluete albe pe fond transparent — vezi comentariul din
 * BandaBranduri pentru motiv.
 */
export type Brand = {
  slug: string;
  nume: string;
  produse: number;
};

export const BRANDURI: Brand[] = [
  { slug: "deye", nume: "Deye", produse: 55 },
  { slug: "k2-systems", nume: "K2 Systems", produse: 28 },
  { slug: "aiko-solar", nume: "Aiko Solar", produse: 14 },
  { slug: "growatt", nume: "Growatt", produse: 14 },
  { slug: "canadian-solar", nume: "Canadian Solar", produse: 9 },
  { slug: "pytes", nume: "Pytes", produse: 5 },
  { slug: "felicity", nume: "Felicity Solar", produse: 5 },
  { slug: "jinko-solar", nume: "Jinko Solar", produse: 3 },
  { slug: "eastron", nume: "Eastron", produse: 3 },
  { slug: "dyness", nume: "Dyness", produse: 2 },
  { slug: "solis", nume: "Solis", produse: 2 },
  { slug: "top-cable", nume: "Top Cable", produse: 2 },
  { slug: "staubli", nume: "Stäubli", produse: 2 },
  { slug: "tongwei-solar", nume: "Tongwei Solar", produse: 1 },
  { slug: "ulica-solar", nume: "Ulica Solar", produse: 1 },
  { slug: "pcenersys", nume: "PCEnersys", produse: 1 },
  { slug: "hailei", nume: "Hailei", produse: 1 },
];
