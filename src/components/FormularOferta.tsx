"use client";

import { useState } from "react";
import { BUTON_PLIN } from "./stiluri";
import { FIRMA } from "@/lib/site";

/**
 * Formularul de cerere de ofertă.
 *
 * ─── DE CE DESCHIDE E-MAILUL, ÎN LOC SĂ TRIMITĂ SINGUR ────────────────────
 *
 * Ca să trimită singur, ar trebui un server care primește cererea și o pune
 * pe e-mail. Site-ul e generat static, iar WordPress-ul din spate nu expune
 * nicio rută de formular. Cea mai proastă variantă ar fi un formular care
 * afișează „mulțumim, am primit cererea" fără ca nimeni s-o primească: omul
 * pleacă mulțumit și așteaptă un răspuns care nu vine.
 *
 * Așa, butonul deschide programul de e-mail cu destinatarul, subiectul și
 * mesajul deja scrise. Cererea pleacă din adresa clientului, deci răspunsul
 * ajunge sigur unde trebuie, iar conversația rămâne în căsuța lui.
 *
 * Când WordPress-ul va avea o rută de formular (sau un serviciu de e-mail),
 * se schimbă doar funcția `trimite`, nu și câmpurile.
 */

const CAMP =
  "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-[15px] text-gray-900 " +
  "placeholder:text-gray-400 focus:border-avo-600 focus:outline-none focus:ring-2 focus:ring-avo-600/20";
const ETICHETA = "block text-[13px] font-semibold text-gray-900";

export default function FormularOferta({ produs }: { produs?: string }) {
  const [firma, setFirma] = useState("");
  const [persoana, setPersoana] = useState("");
  const [telefon, setTelefon] = useState("");
  const [produse, setProduse] = useState(produs ?? "");
  const [mesaj, setMesaj] = useState("");

  const trimite = (e: React.FormEvent) => {
    e.preventDefault();
    const subiect = `Cerere ofertă${firma ? ` — ${firma}` : ""}`;
    const corp = [
      produse && `Produse și cantități:\n${produse}`,
      mesaj && `Detalii:\n${mesaj}`,
      "",
      persoana && `Persoană de contact: ${persoana}`,
      firma && `Firmă: ${firma}`,
      telefon && `Telefon: ${telefon}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.location.href = `mailto:${FIRMA.email}?subject=${encodeURIComponent(
      subiect,
    )}&body=${encodeURIComponent(corp)}`;
  };

  return (
    <form onSubmit={trimite} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="produse" className={ETICHETA}>
          Produse și cantități
        </label>
        <textarea
          id="produse"
          rows={4}
          required
          value={produse}
          onChange={(e) => setProduse(e.target.value)}
          placeholder={"Ex.: 10 × SUN-10K-SG05LP3-EU-SM2\n20 × panou Canadian CS6.2-48TD-460"}
          className={CAMP}
        />
        <p className="mt-1.5 text-[12px] text-gray-500">
          Codul produsului ajută cel mai mult: îl găsești pe fiecare fișă, la „Cod produs”.
        </p>
      </div>

      <div>
        <label htmlFor="firma" className={ETICHETA}>
          Firmă
        </label>
        <input id="firma" value={firma} onChange={(e) => setFirma(e.target.value)} className={CAMP} />
      </div>

      <div>
        <label htmlFor="persoana" className={ETICHETA}>
          Persoană de contact
        </label>
        <input
          id="persoana"
          value={persoana}
          onChange={(e) => setPersoana(e.target.value)}
          className={CAMP}
        />
      </div>

      <div>
        <label htmlFor="telefon" className={ETICHETA}>
          Telefon
        </label>
        <input
          id="telefon"
          type="tel"
          inputMode="tel"
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
          className={CAMP}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="mesaj" className={ETICHETA}>
          Detalii despre proiect <span className="font-normal text-gray-500">(opțional)</span>
        </label>
        <textarea
          id="mesaj"
          rows={3}
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          placeholder="Termen, loc de livrare, dacă e nevoie de montaj."
          className={CAMP}
        />
      </div>

      <div className="sm:col-span-2">
        <button type="submit" className={`${BUTON_PLIN} w-full sm:w-auto`}>
          Deschide e-mailul cu cererea completată
        </button>
        <p className="mt-2.5 text-[12px] leading-relaxed text-gray-500">
          Butonul deschide programul tău de e-mail, cu mesajul gata scris către{" "}
          <span className="font-semibold text-gray-700">{FIRMA.email}</span>. Îl poți
          citi și modifica înainte să-l trimiți.
        </p>
      </div>
    </form>
  );
}
