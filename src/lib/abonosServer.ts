// Datos de abonos al refrendo para los formularios de cobro (solo servidor).
import type { Empeno } from "./types";
import { listarPagosEmpeno } from "./db/repo";
import { abonosRefrendoPendiente, pendientePorConcepto } from "./abonos";
import { calcularVencimiento, cargosPeriodo } from "./interes";

export async function infoAbonosRefrendo(
  e: Pick<Empeno, "id" | "montoPrestado" | "tasaInteres" | "almacenajePct" | "ivaPct" | "fechaVencimiento" | "periodo" | "plazoPeriodos">,
  moratorios: number
) {
  const pend = abonosRefrendoPendiente(await listarPagosEmpeno(e.id));
  const c = cargosPeriodo(e);
  return {
    abonos: pend.abonos.map((p) => ({ fecha: p.fecha, total: p.total })),
    total: pend.total,
    pendiente: pendientePorConcepto({ moratorios, intereses: c.interes, almacenaje: c.almacenaje, iva: c.iva }, pend.abonos),
    protegeHasta: calcularVencimiento(e.fechaVencimiento, e.periodo, e.plazoPeriodos),
  };
}
