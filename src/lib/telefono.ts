// Normalización de teléfonos de México, a prueba de cómo los capture el personal.
// Acepta (con o sin espacios, guiones, paréntesis o "+"):
//   6861571095        → 10 dígitos (forma normal)
//   5216861571095     → 52 + 1 + 10 (formato de WhatsApp)
//   526861571095      → 52 + 10
//   16861571095       → 1 + 10 (prefijo antiguo de celular)
//   0446861571095     → 044/045 + 10 (prefijo antiguo de celular)
//   016861571095      → 01 + 10 (larga distancia antigua)
//   00526861571095    → 00 + 52 + … (marcación internacional)
//   1571095           → 7 dígitos locales: se antepone la lada de la sucursal (686, Mexicali)
// Este módulo es puro: se usa igual en el navegador y en el servidor.

/** Lada de la sucursal (Mexicali). Se antepone cuando capturan solo 7 dígitos. */
export const LADA_LOCAL = "686";

/**
 * Devuelve los 10 dígitos nacionales del teléfono (ej. "6861571095"),
 * o null si no se puede interpretar como un número de México.
 */
export function telefonoNacionalMX(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  let d = telefono.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2); // marcación internacional 00 52 …

  if (d.length === 7) return LADA_LOCAL + d;
  if (d.length === 10) return d;
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  if (d.length === 12 && d.startsWith("52")) return d.slice(2);
  if (d.length === 12 && d.startsWith("01")) return d.slice(2);
  if (d.length === 13 && d.startsWith("521")) return d.slice(3);
  if (d.length === 13 && (d.startsWith("044") || d.startsWith("045"))) return d.slice(3);
  return null;
}

/** Formato internacional 52 + 10 dígitos (ej. "526861571095"), o null si es inválido. */
export function formatearNumeroMX(telefono: string | null | undefined): string | null {
  const nacional = telefonoNacionalMX(telefono);
  return nacional ? "52" + nacional : null;
}

/** ¿Se puede interpretar como teléfono de México? */
export function telefonoValidoMX(telefono: string | null | undefined): boolean {
  return telefonoNacionalMX(telefono) !== null;
}

/**
 * Valor a guardar en la BD: los 10 dígitos si se pudo normalizar; si no, el
 * texto tal cual (recortado) para no perder lo que capturaron. Vacío → null.
 */
export function telefonoParaGuardar(telefono: string | null | undefined): string | null {
  const t = (telefono ?? "").trim();
  if (!t) return null;
  return telefonoNacionalMX(t) ?? t;
}

/** Muestra el teléfono como "686 157 1095" (o tal cual si no es de México). */
export function formatearTelefonoVista(telefono: string | null | undefined): string {
  const n = telefonoNacionalMX(telefono);
  if (!n) return telefono ?? "";
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}
