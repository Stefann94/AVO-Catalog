/**
 * Datele structurate (JSON-LD) pe care le citește Google.
 *
 * ─── LA CE FOLOSESC ───────────────────────────────────────────────────────
 *
 * Sunt singura cale prin care îi spunem explicit lui Google „asta e un produs,
 * ăsta e prețul, ăsta e codul producătorului, asta e disponibilitatea". Din
 * ele se construiesc rezultatele bogate: prețul și starea stocului direct în
 * lista de rezultate.
 *
 * Contează mai ales la căutările după cod exact de produs, unde concurența
 * (inclusiv solarone.ro) NU trimite codul producătorului. Măsurat: fișele lor
 * au availability și brand, dar nu au nici gtin, nici mpn.
 *
 * ─── REGULA DE AUR ────────────────────────────────────────────────────────
 *
 * Nu se scrie niciun câmp pe care nu-l avem în date. Un `availability` greșit
 * sau un GTIN inventat sunt motive de penalizare în Merchant Center, iar un
 * câmp absent nu strică nimic. De aceea `curata()` scoate orice cheie goală.
 */

/**
 * Scrie obiectul ca `<script type="application/ld+json">`, cu `<` escapat.
 *
 * Escaparea nu e opțională: un `<` dintr-un nume de produs ar închide eticheta
 * `<script>` și ar rupe pagina. Vezi ghidul Next (02-guides/json-ld.md).
 */
export function jsonLd(obiect: object) {
  return {
    __html: JSON.stringify(obiect).replace(/</g, "\\u003c"),
  };
}

/** Scoate recursiv cheile fără valoare, ca să nu trimitem câmpuri goale. */
export function curata<T>(valoare: T): T {
  if (Array.isArray(valoare)) {
    return valoare.map(curata).filter((v) => v !== undefined && v !== null) as T;
  }
  if (valoare && typeof valoare === "object") {
    const rezultat: Record<string, unknown> = {};
    for (const [cheie, v] of Object.entries(valoare as Record<string, unknown>)) {
      const curatat = curata(v);
      if (curatat === undefined || curatat === null || curatat === "") continue;
      if (Array.isArray(curatat) && curatat.length === 0) continue;
      rezultat[cheie] = curatat;
    }
    return rezultat as T;
  }
  return valoare;
}

/**
 * „30.09.2026" → „2026-09-30”, formatul cerut de `priceValidUntil`.
 *
 * Întoarce `undefined` pentru orice altceva: mai bine lipsește câmpul decât să
 * conțină o dată pe care Google o interpretează greșit.
 */
export function dataIso(zzLLaaaa?: string | null): string | undefined {
  const m = zzLLaaaa?.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
}

/**
 * Disponibilitatea, tradusă în vocabularul schema.org.
 *
 * Doar valorile pe care le scrie chiar importul nostru în atributul
 * `pa_disponibilitate`. Orice altceva întoarce `undefined` — vezi regula de aur.
 */
export function disponibilitateSchema(text?: string | null): string | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase();
  if (t.includes("stoc epuizat") || t.includes("indisponibil")) return "https://schema.org/OutOfStock";
  if (t.includes("comand")) return "https://schema.org/BackOrder";
  if (t.includes("stoc")) return "https://schema.org/InStock";
  return undefined;
}
