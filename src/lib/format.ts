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

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return fechaCorta.format(new Date(iso));
}

export function formatFechaLarga(iso: string | null | undefined): string {
  if (!iso) return "—";
  return fechaLarga.format(new Date(iso));
}

export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return fechaHora.format(new Date(iso));
}

export function formatPorcentaje(n: number): string {
  return `${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })}%`;
}

/** Fecha ISO (YYYY-MM-DD) de hoy en zona local */
export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}
