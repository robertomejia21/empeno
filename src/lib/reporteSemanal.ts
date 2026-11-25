// Informe semanal de la operación: se envía cada semana.
// Desglosa por modalidad (Vehículos vs Artículos) los empeños, refrendos y
// desempeños, más las ventas de vitrina. Los importes son en MXN.
import type { EmpenoConDetalle, Pago, Venta, CategoriaPrenda, Prenda } from "@/lib/types";
import { aISOLocal } from "@/lib/format";

export interface FilaModalidad {
  empenos: number; // capital prestado en empeños nuevos de la semana
  refrendos: number; // total pagado en refrendos de la semana
  desempenos: number; // total pagado en desempeños de la semana
}

export interface VentaVehiculoDetalle {
  folio: string;
  descripcion: string;
  fecha: string;
  precio: number;
}

export interface ReporteSemanal {
  desde: string; // ISO date (inicio del periodo)
  hasta: string; // ISO date (fin del periodo)
  ventasVitrina: number; // ventas de artículos (no vehículos)
  ventasVehiculos: number; // ventas de vehículos
  ventasVehiculosDetalle: VentaVehiculoDetalle[];
  vehiculos: FilaModalidad;
  articulos: FilaModalidad;
}

/** Rango sábado–viernes de la semana que contiene `hoy` (semana operativa de la casa de empeño). */
export function rangoSemanaActual(hoy: Date = new Date()): { desde: string; hasta: string } {
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dow = (base.getDay() + 1) % 7; // sábado = 0 … viernes = 6
  const sabado = new Date(base);
  sabado.setDate(base.getDate() - dow);
  const viernes = new Date(sabado);
  viernes.setDate(sabado.getDate() + 6);
  return { desde: aISOLocal(sabado), hasta: aISOLocal(viernes) };
}

/** Rango del mes calendario que contiene `hoy` (día 1 al último día del mes). */
export function rangoMesActual(hoy: Date = new Date()): { desde: string; hasta: string } {
  const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  return { desde: aISOLocal(primero), hasta: aISOLocal(ultimo) };
}

const esVehiculoCat = (c: CategoriaPrenda) => c === "Vehículos";

export function calcularReporteSemanal(
  empenos: EmpenoConDetalle[],
  pagos: Pago[],
  ventas: Venta[],
  desde: string,
  hasta: string,
  prendas: Pick<Prenda, "id" | "categoria" | "descripcion" | "marca" | "submarca" | "modelo">[] = []
): ReporteSemanal {
  const enRango = (f: string) => {
    const d = f.slice(0, 10);
    return d >= desde && d <= hasta;
  };

  const vehiculos: FilaModalidad = { empenos: 0, refrendos: 0, desempenos: 0 };
  const articulos: FilaModalidad = { empenos: 0, refrendos: 0, desempenos: 0 };

  // Para clasificar cada pago necesitamos saber si el empeño es de vehículo.
  const esVehPorEmpeno = new Map<string, boolean>();
  for (const e of empenos) esVehPorEmpeno.set(e.id, esVehiculoCat(e.prenda.categoria));

  // Empeños nuevos de la semana → capital prestado. Se usa la fecha de
  // creación: el refrendo mueve fechaInicio al día del pago, y con ella cada
  // refrendo contaba otra vez como empeño nuevo.
  for (const e of empenos) {
    if (e.estado === "borrador" || e.estado === "cancelado") continue;
    if (!enRango(aISOLocal(new Date(e.creadoEn)))) continue;
    (esVehiculoCat(e.prenda.categoria) ? vehiculos : articulos).empenos += e.montoPrestado;
  }

  // Refrendos y desempeños de la semana → total pagado.
  for (const p of pagos) {
    if (!enRango(p.fecha)) continue;
    if (p.tipo !== "refrendo" && p.tipo !== "desempeno") continue;
    const fila = esVehPorEmpeno.get(p.empenoId) ? vehiculos : articulos;
    if (p.tipo === "refrendo") fila.refrendos += p.total;
    else fila.desempenos += p.total;
  }

  // Ventas: se separan los vehículos de la vitrina para dejar claro qué
  // unidades se vendieron y por cuánto.
  const prendaPorId = new Map<string, { categoria: CategoriaPrenda; descripcion: string }>();
  for (const e of empenos) prendaPorId.set(e.prendaId, { categoria: e.prenda.categoria, descripcion: e.prenda.descripcion });
  for (const p of prendas) {
    const desc = p.descripcion || [p.marca, p.submarca, p.modelo].filter(Boolean).join(" ");
    prendaPorId.set(p.id, { categoria: p.categoria, descripcion: desc });
  }
  let ventasVitrina = 0;
  let ventasVehiculos = 0;
  const ventasVehiculosDetalle: VentaVehiculoDetalle[] = [];
  for (const v of ventas) {
    if (!enRango(v.fecha)) continue;
    const pr = prendaPorId.get(v.prendaId);
    if (pr && esVehiculoCat(pr.categoria)) {
      ventasVehiculos += v.precio;
      ventasVehiculosDetalle.push({ folio: v.folio, descripcion: pr.descripcion || "Vehículo", fecha: v.fecha.slice(0, 10), precio: v.precio });
    } else {
      ventasVitrina += v.precio;
    }
  }
  ventasVehiculosDetalle.sort((a, b) => a.fecha.localeCompare(b.fecha));

  return { desde, hasta, ventasVitrina, ventasVehiculos, ventasVehiculosDetalle, vehiculos, articulos };
}

/** Semana operativa anterior (sábado–viernes). */
export function rangoSemanaPasada(hoy: Date = new Date()): { desde: string; hasta: string } {
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7);
  return rangoSemanaActual(base);
}

/** Mes calendario anterior. */
export function rangoMesPasado(hoy: Date = new Date()): { desde: string; hasta: string } {
  return rangoMesActual(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
}

function mxn(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** Atajos de periodo comunes (para selectores). */
export function atajosPeriodo(hoy: Date = new Date()) {
  return [
    { clave: "semana", label: "Esta semana", ...rangoSemanaActual(hoy) },
    { clave: "semana_pasada", label: "Semana pasada", ...rangoSemanaPasada(hoy) },
    { clave: "mes", label: "Este mes", ...rangoMesActual(hoy) },
    { clave: "mes_pasado", label: "Mes pasado", ...rangoMesPasado(hoy) },
  ];
}

/** Renglones del informe (descripción, total) — compartidos por la tarjeta, el CSV y el PDF. */
export function filasInforme(r: ReporteSemanal): { desc: string; total?: number; seccion?: boolean; detalle?: boolean; comentario?: string }[] {
  return [
    { desc: "Ventas de vitrina (artículos)", total: r.ventasVitrina },
    { desc: "Venta de vehículos", total: r.ventasVehiculos, comentario: `${r.ventasVehiculosDetalle.length} unidad(es)` },
    ...r.ventasVehiculosDetalle.map((v) => ({ desc: `${v.descripcion} · ${v.folio}`, total: v.precio, detalle: true, comentario: fechaCorta(v.fecha) })),
    { desc: "Vehículos", seccion: true },
    { desc: "Empeños", total: r.vehiculos.empenos },
    { desc: "Refrendos", total: r.vehiculos.refrendos },
    { desc: "Desempeños", total: r.vehiculos.desempenos },
    { desc: "Artículos", seccion: true },
    { desc: "Empeños", total: r.articulos.empenos },
    { desc: "Refrendos", total: r.articulos.refrendos },
    { desc: "Desempeños", total: r.articulos.desempenos },
  ];
}

/** Texto del reporte para mandarlo por WhatsApp o correo a Dirección. */
export function textoReporte(r: ReporteSemanal, sucursal: string): string {
  const fila = (t: string, f: FilaModalidad) =>
    [`*${t}*`, `• Empeños: ${mxn(f.empenos)}`, `• Refrendos: ${mxn(f.refrendos)}`, `• Desempeños: ${mxn(f.desempenos)}`].join("\n");
  return [
    `📊 Reporte ${sucursal}`,
    `Del ${fechaCorta(r.desde)} al ${fechaCorta(r.hasta)}`,
    "",
    `Ventas de vitrina: ${mxn(r.ventasVitrina)}`,
    `Venta de vehículos: ${mxn(r.ventasVehiculos)}${r.ventasVehiculosDetalle.length ? ` (${r.ventasVehiculosDetalle.length})` : ""}`,
    ...r.ventasVehiculosDetalle.map((v) => `  – ${v.descripcion}: ${mxn(v.precio)}`),
    "",
    fila("Vehículos", r.vehiculos),
    "",
    fila("Artículos", r.articulos),
  ].join("\n");
}
