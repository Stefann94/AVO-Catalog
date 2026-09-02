import { revalidatePath, revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { ETICHETA_WP } from "@/lib/graphql-client";

/**
 * Punctul de intrare pentru notificările din WordPress.
 *
 * Fără el, o modificare făcută în WooCommerce apare pe site abia după ce expiră
 * cache-ul — până la o oră. Plugin-ul din tools/wordpress apelează ruta asta la
 * salvarea unui produs sau a setărilor, iar pagina se împrospătează la
 * următoarea vizită.
 *
 * Ruta e publică prin natura ei: WordPress trebuie s-o poată apela de pe alt
 * server. Ce o protejează e secretul comun din antetul `x-avo-secret`.
 */

// Ruta nu trebuie prerandată niciodată: fiecare apel trebuie executat.
export const dynamic = "force-dynamic";

/** Ce se golește când notificarea nu cere altceva anume. */
const ETICHETE_IMPLICITE = [ETICHETA_WP];

/**
 * Comparație în timp constant.
 *
 * Un `===` obișnuit iese la primul caracter diferit, iar diferența de timp e
 * măsurabilă în rețea: cu suficiente încercări, secretul poate fi ghicit
 * caracter cu caracter. Lungimea rămâne observabilă, ceea ce e acceptabil —
 * secretul e generat aleator, nu ghicit după lungime.
 */
function secretCorect(primit: string, asteptat: string): boolean {
  const a = Buffer.from(primit, "utf8");
  const b = Buffer.from(asteptat, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Păstrează doar șirurile dintr-o valoare venită din exterior. */
function listaDeSiruri(valoare: unknown): string[] {
  if (!Array.isArray(valoare)) return [];
  return valoare.filter((v): v is string => typeof v === "string" && v.trim() !== "");
}

export async function POST(cerere: Request) {
  const asteptat = process.env.REVALIDATE_SECRET;

  // Variabila nelipsită din configurare ar face ruta să accepte orice. Mai bine
  // refuzăm tot, cu un mesaj care spune limpede ce lipsește.
  if (!asteptat) {
    console.error(
      "REVALIDATE_SECRET nu e setat. Ruta /api/revalidate refuză orice cerere până e configurat."
    );
    return Response.json(
      { ok: false, eroare: "Ruta nu e configurată pe server." },
      { status: 503 }
    );
  }

  const primit = cerere.headers.get("x-avo-secret") ?? "";
  if (!secretCorect(primit, asteptat)) {
    return Response.json({ ok: false, eroare: "Secret invalid." }, { status: 401 });
  }

  // Corpul e opțional: o notificare fără el golește tot ce vine din WordPress.
  let corp: { tags?: unknown; paths?: unknown } = {};
  try {
    corp = await cerere.json();
  } catch {
    // Corp gol sau JSON invalid — rămâne comportamentul implicit.
  }

  const etichete = listaDeSiruri(corp.tags);
  const cai = listaDeSiruri(corp.paths);
  const deGolit = etichete.length > 0 ? etichete : ETICHETE_IMPLICITE;

  // `expire: 0` face ca prima cerere de după notificare să aștepte datele
  // proaspete. Varianta recomandată, `"max"`, ar servi o dată conținut vechi și
  // ar reîmprospăta în fundal — adică exact experiența pe care o eliminăm:
  // colegul dă refresh imediat după ce a salvat și trebuie să vadă schimbarea,
  // nu s-o vadă la al doilea refresh.
  for (const eticheta of deGolit) {
    revalidateTag(eticheta, { expire: 0 });
  }

  if (cai.length > 0) {
    for (const cale of cai) revalidatePath(cale);
  } else {
    // Plasă de siguranță pentru paginile prerandate: etichetele golesc datele,
    // iar asta marchează și HTML-ul deja generat pentru regenerare.
    revalidatePath("/", "layout");
  }

  return Response.json({
    ok: true,
    etichete: deGolit,
    cai: cai.length > 0 ? cai : ["/ (layout)"],
    moment: new Date().toISOString(),
  });
}

/**
 * Un GET nu trebuie să poată declanșa revalidarea: browserele, preîncărcătoarele
 * și crawlerele emit GET-uri singure, iar ruta ar fi apelată accidental.
 */
export async function GET() {
  return Response.json(
    { ok: false, eroare: "Folosește POST cu antetul x-avo-secret." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
