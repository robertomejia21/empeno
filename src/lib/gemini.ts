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

/**
 * Extrae los datos de una credencial de elector (INE) mexicana usando Gemini.
 * Recibe la imagen en base64 y su mimetype.
 */
export async function extraerDatosINE(base64: string, mime: string): Promise<DatosINE | null> {
  if (!KEY) return null;
  const prompt =
    "Eres un lector de credenciales para votar (INE) mexicanas. Extrae los datos de la imagen y " +
    "responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con estas llaves exactas: " +
    "nombre, apellidoPaterno, apellidoMaterno, curp, claveElector, domicilio, fechaNacimiento (formato YYYY-MM-DD), sexo (H o M). " +
    "Si un dato no es legible usa null. No inventes datos.";

  try {
    const res = await fetch(
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
    if (!res.ok) return null;
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!txt) return null;
    const json = JSON.parse(txt.replace(/```json|```/g, "").trim());
    return {
      nombre: json.nombre ?? null,
      apellidoPaterno: json.apellidoPaterno ?? null,
      apellidoMaterno: json.apellidoMaterno ?? null,
      curp: json.curp ?? null,
      claveElector: json.claveElector ?? null,
      domicilio: json.domicilio ?? null,
      fechaNacimiento: json.fechaNacimiento ?? null,
      sexo: json.sexo ?? null,
    };
  } catch {
    return null;
  }
}
