import "server-only";

// Integración con Green API (https://green-api.com) para enviar WhatsApp.
// Variables (en .env.local y en Vercel):
//   GREEN_API_URL          → host de la instancia (ej. https://7103.api.greenapi.com).
//                            Si se omite, se usa https://api.green-api.com
//   GREEN_API_ID_INSTANCE  → idInstance de la consola de Green API
//   GREEN_API_TOKEN        → apiTokenInstance de la consola de Green API
//   WHATSAPP_PREFIJO_MX    → opcional; prefijo de los celulares de México en el
//                            chatId. Por defecto "521" (formato interno de WhatsApp).
const URL = (process.env.GREEN_API_URL || "https://api.green-api.com").replace(/\/+$/, "");
const ID_INSTANCE = process.env.GREEN_API_ID_INSTANCE;
const TOKEN = process.env.GREEN_API_TOKEN;
const PREFIJO_MX = process.env.WHATSAPP_PREFIJO_MX || "521";

export function whatsappHabilitado(): boolean {
  return Boolean(ID_INSTANCE && TOKEN);
}

// La normalización vive en lib/telefono.ts (pura, también se usa en el navegador).
import { formatearNumeroMX } from "./telefono";
export { formatearNumeroMX };

/** chatId de Green API: número + "@c.us". Los celulares de México van como 521 + 10 dígitos. */
function chatId(telefono: string | null): string | null {
  const numero = formatearNumeroMX(telefono);
  if (!numero) return null;
  const esMX = numero.length === 12 && numero.startsWith("52");
  return `${esMX ? PREFIJO_MX + numero.slice(2) : numero}@c.us`;
}

function endpoint(metodo: string): string {
  return `${URL}/waInstance${ID_INSTANCE}/${metodo}/${TOKEN}`;
}

export interface ResultadoWA {
  ok: boolean;
  error?: string;
}

async function postGreen(metodo: string, body: Record<string, unknown>): Promise<ResultadoWA> {
  try {
    const res = await fetch(endpoint(metodo), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `Green API ${res.status}: ${t.slice(0, 120)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

/** Envía un mensaje de texto por WhatsApp vía Green API. */
export async function enviarWhatsApp(telefono: string | null, texto: string): Promise<ResultadoWA> {
  if (!whatsappHabilitado()) return { ok: false, error: "WhatsApp no configurado" };
  const id = chatId(telefono);
  if (!id) return { ok: false, error: "Teléfono inválido" };
  return postGreen("sendMessage", { chatId: id, message: texto });
}

/** Envía una imagen (por URL pública) por WhatsApp vía Green API. */
export async function enviarWhatsAppMedia(
  telefono: string | null,
  urlImagen: string,
  caption: string
): Promise<ResultadoWA> {
  if (!whatsappHabilitado()) return { ok: false, error: "WhatsApp no configurado" };
  const id = chatId(telefono);
  if (!id) return { ok: false, error: "Teléfono inválido" };
  const nombre = urlImagen.split("?")[0].split("/").pop() || "imagen.jpg";
  return postGreen("sendFileByUrl", {
    chatId: id,
    urlFile: urlImagen,
    fileName: /\.\w{2,4}$/.test(nombre) ? nombre : `${nombre}.jpg`,
    caption,
  });
}

/**
 * ¿Está conectada la instancia de WhatsApp? Devuelve los mismos estados que
 * usa la UI: "open" (autorizada), "connecting", "close", "error" o "no_configurado".
 */
export async function estadoInstancia(): Promise<string> {
  if (!whatsappHabilitado()) return "no_configurado";
  try {
    const res = await fetch(endpoint("getStateInstance"), { cache: "no-store" });
    if (!res.ok) return "error";
    const data = await res.json();
    const estado: string = data?.stateInstance ?? "";
    if (estado === "authorized") return "open";
    if (estado === "starting" || estado === "notAuthorized") return "connecting";
    if (estado === "blocked" || estado === "sleepMode" || estado === "yellowCard") return "close";
    return "desconocido";
  } catch {
    return "error";
  }
}
