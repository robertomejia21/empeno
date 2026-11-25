// Abonos parciales al refrendo.
//
// Si el cliente no completa el refrendo, lo que entrega se registra como
// ABONO (pago tipo "abono") ligado al refrendo pendiente (refrendoNo =
// refrendos hechos + 1). El abono protege la prenda de pasar a remate hasta
// el siguiente vencimiento, aunque siguen corriendo los moratorios del
// sistema. Cuando los abonos cubren el refrendo, se registra el refrendo y el
// contrato se renueva; si el cliente desempeña, lo abonado se descuenta.
import type { Empeno, Pago } from "./types";
import { calcularVencimiento } from "./interes";

const r2 = (n: number) => Math.round(n * 100) / 100;

export interface AbonosPendientes {
  /** Número del refrendo al que se aplican los abonos. */
  refrendoNo: number;
  abonos: Pago[];
  /** Suma de lo abonado al refrendo pendiente. */
  total: number;
}

/** Abonos hechos al refrendo en curso (los pagos deben ser de un solo empeño). */
export function abonosRefrendoPendiente(pagosEmpeno: Pago[]): AbonosPendientes {
  const refrendoNo = pagosEmpeno.filter((p) => p.tipo === "refrendo").length + 1;
  const abonos = pagosEmpeno
    .filter((p) => p.tipo === "abono" && p.refrendoNo === refrendoNo)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  return { refrendoNo, abonos, total: r2(abonos.reduce((s, p) => s + p.total, 0)) };
}

/**
 * Fecha hasta la que un abono protege la prenda: el siguiente vencimiento
 * (antes de él debe quedar cubierto el refrendo). null si no hay abonos.
 */
export function protegidoHasta(
  e: Pick<Empeno, "fechaVencimiento" | "periodo" | "plazoPeriodos">,
  pendientes: AbonosPendientes
): string | null {
  if (pendientes.abonos.length === 0) return null;
  return calcularVencimiento(e.fechaVencimiento, e.periodo, e.plazoPeriodos);
}

/**
 * Aplica un abono a los conceptos del refrendo en orden de prelación:
 * moratorios → intereses → almacenaje → IVA. Devuelve cuánto se aplicó a cada uno.
 */
export function aplicarAbono(
  monto: number,
  pendiente: { moratorios: number; intereses: number; almacenaje: number; iva: number }
): { moratorios: number; intereses: number; almacenaje: number; iva: number } {
  let resto = r2(monto);
  const toma = (max: number) => {
    const t = r2(Math.min(Math.max(0, max), resto));
    resto = r2(resto - t);
    return t;
  };
  const moratorios = toma(pendiente.moratorios);
  const intereses = toma(pendiente.intereses);
  const almacenaje = toma(pendiente.almacenaje);
  const iva = toma(pendiente.iva);
  return { moratorios, intereses, almacenaje, iva };
}

/** Lo que falta por cubrir de cada concepto, descontando lo ya abonado. */
export function pendientePorConcepto(
  cargos: { moratorios: number; intereses: number; almacenaje: number; iva: number },
  abonos: Pago[]
) {
  const pagado = abonos.reduce(
    (acc, p) => ({
      moratorios: acc.moratorios + p.moratorios,
      intereses: acc.intereses + p.intereses,
      almacenaje: acc.almacenaje + p.almacenaje,
      iva: acc.iva + p.iva,
    }),
    { moratorios: 0, intereses: 0, almacenaje: 0, iva: 0 }
  );
  return {
    moratorios: r2(Math.max(0, cargos.moratorios - pagado.moratorios)),
    intereses: r2(Math.max(0, cargos.intereses - pagado.intereses)),
    almacenaje: r2(Math.max(0, cargos.almacenaje - pagado.almacenaje)),
    iva: r2(Math.max(0, cargos.iva - pagado.iva)),
  };
}
