import "server-only";
import { headers } from "next/headers";

// Rate-limit simple en memoria por IP, para Server Actions públicas (sin
// login) que tienen efecto real: crear un registro, mandar WhatsApp, etc.
// No sirve entre múltiples instancias/servidores, pero es instantáneo de
// implementar y suficiente para el volumen bajo de una sola sucursal.
const HITS = new Map<string, number[]>();

/**
 * ¿Esta IP ya superó el máximo de intentos para `clave` en la ventana de
 * tiempo? Cada `clave` (ej. "cotiza-vehiculo", "agendar-gps") lleva su
 * propio contador por IP.
 */
export async function limitadoPorIP(
  clave: string,
  maxPorVentana = 5,
  ventanaMs = 10 * 60 * 1000
): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
  const llave = `${clave}:${ip}`;
  const ahora = Date.now();
  const arr = (HITS.get(llave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (arr.length >= maxPorVentana) {
    HITS.set(llave, arr);
    return true;
  }
  arr.push(ahora);
  HITS.set(llave, arr);
  return false;
}
