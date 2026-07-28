import "server-only";
import QRCode from "qrcode";
import { APP_URL } from "@/lib/negocio";

/** Genera un código QR como data URL (PNG). */
export async function generarQR(texto: string, ancho = 240): Promise<string> {
  return QRCode.toDataURL(texto, { width: ancho, margin: 1, errorCorrectionLevel: "M" });
}

/** URL pública de una prenda (lo que codifica su QR). */
export function urlPrenda(id: string): string {
  return `${APP_URL}/prendas/${id}`;
}
