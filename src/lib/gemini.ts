import "server-only";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

export function geminiHabilitado(): boolean {
  return Boolean(KEY);
}

export interface DatosINE {
  nombre: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  curp: string | null;
  claveElector: string | null;
  domicilio: string | null;
  fechaNacimiento: string | null; // YYYY-MM-DD
  sexo: string | null;
}

export type ResultadoINE =
  | { ok: true; datos: DatosINE }
  | { ok: false; error: string };

/** Formatos de imagen que acepta la API de Gemini. */
const MIMES_SOPORTADOS = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"];

/**
 * Extrae los datos de una credencial de elector (INE) mexicana usando Gemini.
 * Recibe la imagen en base64 y su mimetype.
 */
export async function extraerDatosINE(base64: string, mime: string): Promise<ResultadoINE> {
  if (!KEY) {
    return { ok: false, error: "El lector de INE no está configurado (falta GEMINI_API_KEY)." };
  }
  if (!MIMES_SOPORTADOS.includes(mime)) {
    return { ok: false, error: `Formato no soportado (${mime}). Usa una foto JPG o PNG.` };
  }

  const prompt =
    "Eres un lector de credenciales para votar (INE) mexicanas. Extrae los datos de la imagen y " +
    "responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con estas llaves exactas: " +
    "nombre, apellidoPaterno, apellidoMaterno, curp, claveElector, domicilio, fechaNacimiento (formato YYYY-MM-DD), sexo (H o M). " +
    "Si un dato no es legible usa null. No inventes datos.";

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: base64 } }] },
          ],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }),
        cache: "no-store",
      }
    );
  } catch {
    return { ok: false, error: "No hay conexión con el servicio de lectura." };
  }

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    console.error("[INE] Gemini respondió", res.status, detalle.slice(0, 300));
    if (res.status === 429) return { ok: false, error: "Se agotó la cuota del lector. Intenta en un momento." };
    if (res.status === 400) return { ok: false, error: "La imagen no pudo procesarse. Toma la foto de nuevo." };
    return { ok: false, error: `El servicio de lectura falló (${res.status}).` };
  }

  try {
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!txt) return { ok: false, error: "No se distinguieron datos en la imagen." };
    const json = JSON.parse(txt.replace(/```json|```/g, "").trim());
    return {
      ok: true,
      datos: {
        nombre: json.nombre ?? null,
        apellidoPaterno: json.apellidoPaterno ?? null,
        apellidoMaterno: json.apellidoMaterno ?? null,
        curp: json.curp ?? null,
        claveElector: json.claveElector ?? null,
        domicilio: json.domicilio ?? null,
        fechaNacimiento: json.fechaNacimiento ?? null,
        sexo: json.sexo ?? null,
      },
    };
  } catch {
    return { ok: false, error: "La respuesta del lector no se entendió. Intenta de nuevo." };
  }
}
