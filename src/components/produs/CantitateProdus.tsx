"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { BUTON_PLIN } from "../stiluri";

/**
 * Selectorul de cantitate și îndemnul, dintr-o bucată.
 *
 * ─── DE CE E SINGURA PARTE CU JAVASCRIPT DIN FIȘĂ ─────────────────────────
 *
 * Restul paginii e server component: preț, specificații, disponibilitate — tot
 * conținut care nu se schimbă sub deget. Doar rândul ăsta are stare, așa că
 * doar el pleacă în browser. Dacă ar fi stat în același fișier cu fișa,
 * întreaga pagină ar fi ajuns în pachetul de JavaScript degeaba.
 *
 * ─── CE FACE, DE FAPT ─────────────────────────────────────────────────────
 *
 * Nu e un buton de „adaugă în coș": magazinul n-are coș, iar comanda se face
 * prin ofertă. Cantitatea are totuși rost, și e chiar rostul comercial al
 * site-ului: catalogul are DOUĂ prețuri pentru aceeași poziție, iar al doilea
 * se deschide la un prag. Selectorul spune, în timp real, în care dintre cele
 * două se află cantitatea cerută.
 *
 * Adică răspunde la întrebarea pe care și-o pune un cumpărător B2B pe fișă:
 * „cât trebuie să iau ca să prind prețul bun?".
 *
 * ─── DE CE NU CALCULEAZĂ TOTALUL ──────────────────────────────────────────
 *
 * Ar însemna să afirmăm un preț final. Peste catalog se aplică statutul de
 * partener (Gold −10%, Platinum −15%), transportul și TVA-ul, iar cum se
 * combină se stabilește în ofertă. Un total afișat aici ar fi prima cifră de
 * pe site care nu se potrivește cu factura.
 *
 * ─── PRAGUL, CÂND E NUMERIC ȘI CÂND NU ────────────────────────────────────
 *
 * Importatorul scrie două forme: „12 buc" la invertoare, acumulatori și restul,
 * „4 paleți" la panouri (tools/catalog-import/parse-catalog.js). Prima se poate
 * compara cu o cantitate, a doua nu — nu știm nicăieri în proiect câte panouri
 * intră pe un palet, iar o presupunere aici ar produce o cifră falsă.
 *
 * Deci: prag în bucăți → mesaj care se schimbă cu cantitatea; prag în paleți →
 * aceeași informație, scrisă o dată, fără socoteală. Nu e o limitare de
 * moment; e refuzul de a inventa echivalența.
 */

/**
 * Extrage numărul dintr-un prag exprimat în bucăți.
 *
 * Ancorat la început și cu limită de cuvânt la final, ca „12 buc" să treacă,
 * iar „4 paleți" să nu se strecoare prin cifra din față.
 */
function pragInBucati(prag?: string): number | null {
  if (!prag) return null;
  const m = prag.match(/^\s*(\d+)\s*(buc|bucăți|bucati)\b/i);
  return m ? Number(m[1]) : null;
}

const eur = (n: number) => n.toLocaleString("ro-RO");

export default function CantitateProdus({
  unitate,
  pretVolum,
  prag,
  hrefOferta = "/cerere-oferta",
}: {
  unitate: string;
  pretVolum?: number;
  prag?: string;
  hrefOferta?: string;
}) {
  const [cantitate, setCantitate] = useState(1);

  const pragNumeric = pragInBucati(prag);
  const areVolum = Boolean(pretVolum && prag);
  const laVolum = pragNumeric !== null && cantitate >= pragNumeric;
  const ramase = pragNumeric !== null ? pragNumeric - cantitate : null;

  return (
    <div>
      {/* Rândul de comandă.

          Stepper și buton pe același rând, ca în orice fișă de produs: mâna
          alege cantitatea și continuă spre dreapta. Sub `sm` trec unul sub
          altul, cu butonul lat — pe telefon e ținta care contează.

          Stepper-ul are 44px, ca butonul: e aceeași înălțime de comandă
          folosită peste tot în proiect, iar minus/plus rămân ținte atingibile
          cu degetul. */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="inline-flex h-11 shrink-0 items-center rounded-lg border border-gray-300 bg-white">
          <button
            type="button"
            onClick={() => setCantitate((c) => Math.max(1, c - 1))}
            disabled={cantitate <= 1}
            aria-label="Scade cantitatea"
            className="flex h-11 w-11 items-center justify-center rounded-l-lg text-gray-600 transition-colors hover:text-avo-700 disabled:text-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
          >
            <Minus size={16} />
          </button>

          {/* `inputMode="numeric"` deschide tastatura de cifre pe telefon fără
              să facă din câmp un `type="number"` — acela adaugă săgeți proprii
              în browser, care s-ar bate cu cele două butoane de aici. */}
          <input
            type="text"
            inputMode="numeric"
            value={cantitate}
            onChange={(e) => {
              const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
              setCantitate(Number.isFinite(n) && n > 0 ? n : 1);
            }}
            aria-label={`Cantitate, în ${unitate}`}
            className="h-11 w-16 border-x border-gray-300 bg-white text-center text-[15px] font-bold text-gray-900 focus:outline-none focus:bg-avo-50"
          />

          <button
            type="button"
            onClick={() => setCantitate((c) => c + 1)}
            aria-label="Crește cantitatea"
            className="flex h-11 w-11 items-center justify-center rounded-r-lg text-gray-600 transition-colors hover:text-avo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avo-600"
          >
            <Plus size={16} />
          </button>
        </div>

        <Link href={hrefOferta} className={`${BUTON_PLIN} flex-1`}>
          Cere ofertă
        </Link>
      </div>

      {/* Mesajul de prag.

          `aria-live="polite"` fiindcă textul se schimbă fără ca focusul să se
          mute: cine folosește un cititor de ecran apasă „+" și altfel n-ar afla
          niciodată că tocmai a trecut pragul. „polite" nu întrerupe, anunță
          când se face liniște.

          Înălțimea e rezervată (`min-h`), ca rândul de sub el să nu salte când
          mesajul trece de la o formă la alta. */}
      {areVolum ? (
        <p
          aria-live="polite"
          className="mt-3 min-h-[20px] text-[13px] leading-5"
        >
          {pragNumeric === null ? (
            <span className="text-gray-500">
              Prețul la volum, {eur(pretVolum!)} €, se aplică de la {prag}.
            </span>
          ) : laVolum ? (
            <span className="font-semibold text-avo-700">
              La {cantitate} {unitate} se aplică prețul la volum: {eur(pretVolum!)} € /{" "}
              {unitate}.
            </span>
          ) : (
            <span className="text-gray-500">
              Încă {ramase} {unitate} până la prețul la volum de {eur(pretVolum!)} €.
            </span>
          )}
        </p>
      ) : (
        <p className="mt-3 min-h-[20px] text-[13px] leading-5 text-gray-500">
          Cantitatea intră în cererea de ofertă.
        </p>
      )}
    </div>
  );
}
