// Informe semanal de la operación: se envía cada semana.
// Desglosa por modalidad (Vehículos vs Artículos) los empeños, refrendos y
// desempeños, más las ventas de vitrina. Los importes son en MXN.
import type { EmpenoConDetalle, Pago, Venta, CategoriaPrenda } from "@/lib/types";
import { aISOLocal } from "@/lib/format";

export interface FilaModalidad {
  empenos: number; // capital prestado en empeños nuevos de la semana
  refrendos: number; // total pagado en refrendos de la semana
  desempenos: number; // total pagado en desempeños de la semana
}

export interface ReporteSemanal {
  desde: string; // ISO date (lunes)
  hasta: string; // ISO date (domingo)
  ventasVitrina: number;
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
  hasta: string
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

  // Empeños nuevos de la semana → capital prestado.
  for (const e of empenos) {
    if (!enRango(e.fechaInicio)) continue;
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

  const ventasVitrina = ventas
    .filter((v) => enRango(v.fecha))
    .reduce((s, v) => s + v.precio, 0);

  return { desde, hasta, ventasVitrina, vehiculos, articulos };
}
