import type { Resguardo } from "./types";

export const RESGUARDO_VACIO: Resguardo = {
  tipo: "Matriz",
  calle: null,
  numero: null,
  colonia: null,
  ciudad: null,
  cp: null,
  referencia: null,
  mapsUrl: null,
};

/** Arma el resumen legible que se muestra en listados y exportes. */
export function resumenResguardo(r: Resguardo): string {
  if (r.tipo === "Matriz" && !r.calle) return "Matriz";
  const calle = [r.calle, r.numero].filter(Boolean).join(" ");
  const partes = [calle, r.colonia, r.ciudad, r.cp ? `C.P. ${r.cp}` : null].filter(Boolean);
  const dir = partes.join(", ");
  return [r.tipo, dir || null, r.referencia].filter(Boolean).join(" · ");
}

/** Dirección en una línea, sin el prefijo de tipo (para el detalle). */
export function direccionResguardo(r: Resguardo): string | null {
  const calle = [r.calle, r.numero].filter(Boolean).join(" ");
  const partes = [calle, r.colonia, r.ciudad, r.cp ? `C.P. ${r.cp}` : null].filter(Boolean);
  return partes.length ? partes.join(", ") : null;
}
