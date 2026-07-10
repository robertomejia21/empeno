// Utilidades de formato para México (MXN, fechas en español)

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

export function formatMXN(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "$0.00";
  return mxn.format(n);
}

const fechaLarga = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const fechaCorta = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const fechaHora = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Convierte una cadena ISO a Date sin corrimiento de zona horaria.
 * `new Date("2026-07-09")` se interpreta como medianoche UTC; en Mexicali
 * (UTC-7) eso cae el día 8. Las fechas de sólo día se arman en hora local.
 */
export function parseFechaLocal(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(a, m - 1, d);
  }
  return new Date(iso);
}

/** Fecha ISO (YYYY-MM-DD) de un Date, en hora local. */
export function aISOLocal(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return fechaCorta.format(parseFechaLocal(iso));
}

export function formatFechaLarga(iso: string | null | undefined): string {
  if (!iso) return "—";
  return fechaLarga.format(parseFechaLocal(iso));
}

export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return fechaHora.format(parseFechaLocal(iso));
}

export function formatPorcentaje(n: number): string {
  return `${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })}%`;
}

/** Fecha ISO (YYYY-MM-DD) de hoy en zona local */
export function hoyISO(): string {
  return aISOLocal(new Date());
}
