import "server-only";

// Integración con Evolution API (WhatsApp auto-hospedado en el VPS).
const URL = process.env.EVOLUTION_API_URL; // ej. http://localhost:8081
const KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE; // ej. empeno

export function whatsappHabilitado(): boolean {
  return Boolean(URL && KEY && INSTANCE);
}

/** Normaliza un teléfono mexicano a formato internacional (52 + 10 dígitos). */
export function formatearNumeroMX(telefono: string | null): string | null {
  if (!telefono) return null;
  let d = telefono.replace(/\D/g, "");
  if (d.length === 10) d = "52" + d;
  else if (d.length === 12 && d.startsWith("52")) {
    /* ya viene con 52 */
  } else if (d.length === 13 && d.startsWith("521")) {
    d = "52" + d.slice(3);
  } else if (d.length < 10) return null;
  return d;
}

export interface ResultadoWA {
  ok: boolean;
  error?: string;
}

/** Envía un mensaje de texto por WhatsApp vía Evolution API. */
export async function enviarWhatsApp(telefono: string | null, texto: string): Promise<ResultadoWA> {
  if (!whatsappHabilitado()) return { ok: false, error: "WhatsApp no configurado" };
  const numero = formatearNumeroMX(telefono);
  if (!numero) return { ok: false, error: "Teléfono inválido" };

  try {
    const res = await fetch(`${URL}/message/sendText/${INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY! },
      body: JSON.stringify({ number: numero, text: texto }),
      cache: "no-store",
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `Evolution ${res.status}: ${t.slice(0, 120)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

/** Envía una imagen (por URL) por WhatsApp vía Evolution API. */
export async function enviarWhatsAppMedia(
  telefono: string | null,
  urlImagen: string,
  caption: string
): Promise<ResultadoWA> {
  if (!whatsappHabilitado()) return { ok: false, error: "WhatsApp no configurado" };
  const numero = formatearNumeroMX(telefono);
  if (!numero) return { ok: false, error: "Teléfono inválido" };
  try {
    const res = await fetch(`${URL}/message/sendMedia/${INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY! },
      body: JSON.stringify({ number: numero, mediatype: "image", media: urlImagen, caption }),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `Evolution ${res.status}: ${(await res.text()).slice(0, 120)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

/** ¿Está conectada la instancia de WhatsApp? */
export async function estadoInstancia(): Promise<string> {
  if (!whatsappHabilitado()) return "no_configurado";
  try {
    const res = await fetch(`${URL}/instance/connectionState/${INSTANCE}`, {
      headers: { apikey: KEY! },
      cache: "no-store",
    });
    if (!res.ok) return "error";
    const data = await res.json();
    return data?.instance?.state ?? "desconocido";
  } catch {
    return "error";
  }
}
