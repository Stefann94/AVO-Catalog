/**
 * Cifra de titlu a unui produs — cea care ține locul fotografiei.
 *
 * Catalogul nu are imagini de produs: coloana `Images` nici nu există în CSV-ul
 * de import. Nu e o lipsă de acoperit cu un substituent gri — pentru cine
 * cumpără, cifra tehnică identifică produsul mai bine decât poza. Toate
 * panourile arată la fel într-o fotografie; „460 Wp" nu seamănă cu nimic.
 *
 * Regula stă aici, într-un singur loc, fiindcă o folosesc și cardurile de
 * ofertă, și fișa de produs. Dacă ar fi scrisă de două ori, s-ar despărți la
 * prima modificare — un produs ar apărea cu altă cifră pe card decât pe fișă.
 */

/** Perechea atribut → valoare, așa cum vine din WooGraphQL. */
export type Atribut = { nume: string; eticheta: string; valoare: string };

export type CifraTitlu = { valoare: string; unitate: string };

/**
 * Cifrele se scriu românește: 3.6 → „3,6".
 *
 * Valorile vin din două locuri cu formate diferite — atributele dau text
 * („460", „3.6"), meta dă număr. Trecem prin `Number` doar ce e numeric; ce nu
 * e rămâne neatins, ca o valoare neașteptată din catalog să ajungă pe ecran ca
 * atare, nu ca „NaN".
 */
export function cifra(valoare: string | number): string {
  const n = typeof valoare === "number" ? valoare : Number(String(valoare).replace(",", "."));
  return Number.isFinite(n) ? n.toLocaleString("ro-RO") : String(valoare);
}

/**
 * Prima cifră găsită, în ordinea în care catalogul o oferă.
 *
 * Ordinea nu e arbitrară: un panou are Wp, un invertor kW, un acumulator kWh,
 * iar un produs are practic doar una dintre ele.
 *
 * `capacitateKwh` vine din meta, nu din atributul `pa_capacitate-kwh`: acela e
 * un interval („15 - 30 kWh"), bun pentru filtrare, inutil ca cifră de titlu.
 * Meta ține valoarea exactă — 16.
 *
 * Întoarce `undefined` pentru jumătate din catalog: cleme, șuruburi, cabluri
 * n-au o cifră care să le definească. Cine folosește funcția trebuie să aibă o
 * variantă de rezervă — la noi, codul de model.
 */
export function cifraDeTitlu(
  atribute: Atribut[],
  capacitateKwh?: number | null
): CifraTitlu | undefined {
  const val = (nume: string) => atribute.find((a) => a.nume === nume)?.valoare;

  const wp = val("pa_putere-wp");
  if (wp) return { valoare: cifra(wp), unitate: "Wp" };

  const kw = val("pa_putere-kw");
  if (kw) return { valoare: cifra(kw), unitate: "kW" };

  if (typeof capacitateKwh === "number" && Number.isFinite(capacitateKwh)) {
    return { valoare: cifra(capacitateKwh), unitate: "kWh" };
  }
  return undefined;
}
