import "server-only";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

export function geminiHabilitado(): boolean {
  return Boolean(KEY);
}

/** Formatos de imagen que acepta la API de Gemini. */
const MIMES_SOPORTADOS = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"];

type RespuestaJSON =
  | { ok: true; json: Record<string, unknown> }
  | { ok: false; error: string };

/** Envía una imagen + instrucción a Gemini y devuelve el JSON que responde. */
async function pedirJSON(prompt: string, base64: string, mime: string): Promise<RespuestaJSON> {
  if (!KEY) return { ok: false, error: "El lector no está configurado (falta GEMINI_API_KEY)." };
  if (!MIMES_SOPORTADOS.includes(mime)) {
    return { ok: false, error: `Formato no soportado (${mime}). Usa una foto JPG o PNG.` };
  }

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: base64 } }] }],
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
    console.error("[Gemini] respondió", res.status, detalle.slice(0, 300));
    if (res.status === 429) return { ok: false, error: "Se agotó la cuota del lector. Intenta en un momento." };
    if (res.status === 400) return { ok: false, error: "La imagen no pudo procesarse. Toma la foto de nuevo." };
    return { ok: false, error: `El servicio de lectura falló (${res.status}).` };
  }

  try {
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!txt) return { ok: false, error: "No se distinguió información en la imagen." };
    return { ok: true, json: JSON.parse(txt.replace(/```json|```/g, "").trim()) };
  } catch {
    return { ok: false, error: "La respuesta del lector no se entendió. Intenta de nuevo." };
  }
}

const str = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v);
  return s === "" || /^(null|n\/a|na|-)$/i.test(s) ? null : s;
};

// ---------------- INE ----------------

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

export type ResultadoINE = { ok: true; datos: DatosINE } | { ok: false; error: string };

export async function extraerDatosINE(base64: string, mime: string): Promise<ResultadoINE> {
  const r = await pedirJSON(
    "Eres un lector de credenciales para votar (INE) mexicanas. Extrae los datos de la imagen y " +
      "responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con estas llaves exactas: " +
      "nombre, apellidoPaterno, apellidoMaterno, curp, claveElector, domicilio, fechaNacimiento (formato YYYY-MM-DD), sexo (H o M). " +
      "Si un dato no es legible usa null. No inventes datos.",
    base64,
    mime
  );
  if (!r.ok) return r;
  const j = r.json;
  return {
    ok: true,
    datos: {
      nombre: str(j.nombre),
      apellidoPaterno: str(j.apellidoPaterno),
      apellidoMaterno: str(j.apellidoMaterno),
      curp: str(j.curp),
      claveElector: str(j.claveElector),
      domicilio: str(j.domicilio),
      fechaNacimiento: str(j.fechaNacimiento),
      sexo: str(j.sexo),
    },
  };
}

// ---------------- Vehículo (tarjeta de circulación / factura) ----------------

export interface DatosVehiculo {
  tipoVehiculo: string | null; // sedán, pick-up, SUV, motocicleta…
  marca: string | null;
  submarca: string | null; // línea/submarca
  modelo: string | null; // año
  color: string | null;
  placas: string | null;
  niv: string | null; // número de identificación vehicular (serie)
  numeroMotor: string | null;
  transmision: string | null;
  numeroFactura: string | null;
  emisorFactura: string | null;
}

export type ResultadoVehiculo = { ok: true; datos: DatosVehiculo } | { ok: false; error: string };

/**
 * Lee una tarjeta de circulación, factura o documento del vehículo y extrae
 * sus datos. Recibe la imagen en base64 y su mimetype.
 */
export async function extraerDatosVehiculo(base64: string, mime: string): Promise<ResultadoVehiculo> {
  const r = await pedirJSON(
    "Eres un lector de documentos vehiculares mexicanos (tarjeta de circulación, factura o placa). " +
      "Extrae los datos de la imagen y responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con estas llaves exactas: " +
      "tipoVehiculo (sedán, pick-up, SUV, motocicleta, etc.), marca, submarca, modelo (el AÑO del vehículo), color, " +
      "placas, niv (número de identificación vehicular o número de serie, 17 caracteres), numeroMotor, transmision, " +
      "numeroFactura, emisorFactura. Si un dato no aparece o no es legible usa null. No inventes datos.",
    base64,
    mime
  );
  if (!r.ok) return r;
  const j = r.json;
  return {
    ok: true,
    datos: {
      tipoVehiculo: str(j.tipoVehiculo),
      marca: str(j.marca),
      submarca: str(j.submarca),
      modelo: str(j.modelo),
      color: str(j.color),
      placas: str(j.placas),
      niv: str(j.niv),
      numeroMotor: str(j.numeroMotor),
      transmision: str(j.transmision),
      numeroFactura: str(j.numeroFactura),
      emisorFactura: str(j.emisorFactura),
    },
  };
}
