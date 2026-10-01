import type { Produs } from "@/lib/produs";
import { caArticol } from "../CardProdus";
import BandaProduse from "./BandaProduse";

/* ══════════════════════════════════════════════════════════════════════════
   OFERTE LA CONTAINER
   ──────────────────────────────────────────────────────────────────────────
   „Comenzile la container se ofertează separat" scrie în capul secțiunii
   „Condiții B2B". Propoziția aia nu ducea nicăieri: cine o citea n-avea de
   unde afla CARE produse se pot comanda așa. Informația exista în WooCommerce
   de la bun început, în câmpul `pretContainer` — pe 28 de produse, toate
   panouri, de la cinci mărci.

   ─── PREȚUL NU E AICI, ȘI NU E O SCĂPARE ────────────────────────────────

   Câmpul `pretContainer` are la toate cele 28 aceeași valoare: „la cerere".
   Nu există o cifră de arătat, deci cardul rămâne cel obișnuit, cu prețul de
   catalog pe bucată — care e real — iar descrierea spune limpede că prețul de
   container se cere separat. Un preț de container inventat ar fi ieșit la
   iveală la prima cerere de ofertă.

   Ce aduce secțiunea nu e o cifră nouă, e APARTENENȚA: lista celor care se pot
   comanda la container întreg. Aia lipsea.

   ─── ORDINEA ────────────────────────────────────────────────────────────

   După prețul de catalog, descrescător. Panourile astea costă între 54 și 119
   € bucata, deci ordinea nu schimbă mare lucru vizual — dar pune în față
   modulele de putere mare, cele pentru care o comandă la container chiar are
   sens.

   ─── LINKUL DIN SUBSOL ──────────────────────────────────────────────────

   Duce la categoria produselor din secțiune, citită din produsele însele, nu
   scrisă de mână: dacă mâine `pretContainer` apare și pe altceva decât
   panouri, linkul urmează, nu rămâne în urmă.
   ══════════════════════════════════════════════════════════════════════════ */

/** Câte produse intră în secțiune: cinci pe rând, două rânduri. */
const PE_BANDA = 10;

export default function OferteContainer({ produse = [] }: { produse?: Produs[] }) {
  const cuContainer = produse
    .filter((p) => (p.pretContainer ?? "").trim() !== "")
    .sort((a, b) => (b.pret ?? 0) - (a.pret ?? 0));

  const alese = cuContainer.slice(0, PE_BANDA).map(caArticol);

  // Categoria cea mai des întâlnită în secțiune — ținta linkului din subsol.
  const nrPeCategorie = new Map<string, { slug: string; nume: string; n: number }>();
  for (const p of cuContainer) {
    if (!p.categorie) continue;
    const intrare = nrPeCategorie.get(p.categorie.slug) ?? {
      slug: p.categorie.slug,
      nume: p.categorie.nume,
      n: 0,
    };
    intrare.n += 1;
    nrPeCategorie.set(p.categorie.slug, intrare);
  }
  const categorie = [...nrPeCategorie.values()].sort((a, b) => b.n - a.n)[0];

  return (
    <BandaProduse
      titlu="Oferte la container"
      /* Fond alb: deasupra e lichidarea pe `canvas`, dedesubt „Cum comanzi". */
      fundal="bg-white"
      descriere={
        <>
          Produsele care se pot comanda la container întreg. Prețul de container
          se dă la cerere, separat de prețul de catalog de pe card, iar
          transportul se stabilește odată cu oferta.
        </>
      }
      articole={alese}
      link={
        categorie
          ? { text: `Vezi toate din ${categorie.nume}`, adresa: `/catalog/${categorie.slug}` }
          : { text: "Vezi toate produsele", adresa: "/catalog" }
      }
      nota={
        <>
          Prețurile de pe carduri sunt cele de catalog, în lei, cu TVA inclus, pe
          bucată. Cantitatea dintr-un container, prețul și termenul se
          stabilesc prin ofertă.
        </>
      }
    />
  );
}
