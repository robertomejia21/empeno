// Las fotos de prendas se suben con un timestamp epoch (ms) en el nombre de
// archivo (ver subirFotoPrenda / subirArchivoPrenda en actions.ts) — de ahí
// se puede recuperar la fecha real de cada foto sin guardar un campo aparte.

/** Extrae la fecha de subida de una URL de foto, si trae un timestamp epoch embebido. */
export function fechaDeFotoUrl(url: string): string | null {
  const m = url.match(/(\d{13})/);
  if (!m) return null;
  const ms = Number(m[1]);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) return null;
  return d.toISOString();
}
