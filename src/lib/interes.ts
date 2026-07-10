// Lógica de cálculo de intereses y liquidaciones de empeños
import type { Empeno, CalculoLiquidacion, PeriodoInteres } from "./types";
import { parseFechaLocal, aISOLocal } from "./format";

const DIAS_POR_PERIODO: Record<PeriodoInteres, number> = {
  mensual: 30, // referencia para costo diario; el vencimiento usa mes calendario
  quincenal: 15,
  semanal: 7,
};

export function diasPorPeriodo(periodo: PeriodoInteres): number {
  return DIAS_POR_PERIODO[periodo];
}

/** Días completos entre dos fechas, comparando días de calendario (sin horas). */
function diffDias(desde: string, hasta: Date): number {
  const d0 = parseFechaLocal(desde);
  const a = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()).getTime();
  const b = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Suma `n` periodos a una fecha.
 * Mensual = mes calendario (el 08/jul vence el 08/ago), no 30 días.
 * Si el día no existe en el mes destino (31/ene → feb) se ajusta al último día.
 */
export function sumarPeriodos(fechaISO: string, periodo: PeriodoInteres, n: number): string {
  const f = parseFechaLocal(fechaISO);
  if (periodo === "mensual") {
    const dia = f.getDate();
    const ultimoDiaDestino = new Date(f.getFullYear(), f.getMonth() + n + 1, 0).getDate();
    return aISOLocal(new Date(f.getFullYear(), f.getMonth() + n, Math.min(dia, ultimoDiaDestino)));
  }
  return aISOLocal(
    new Date(f.getFullYear(), f.getMonth(), f.getDate() + DIAS_POR_PERIODO[periodo] * n)
  );
}

/** Periodos devengados: el 1.º se cobra al pactar; luego uno por cada vencimiento alcanzado. */
function periodosDevengados(inicioISO: string, periodo: PeriodoInteres, aFecha: Date): number {
  let n = 1;
  while (n < 600 && diffDias(sumarPeriodos(inicioISO, periodo, n), aFecha) > 0) n++;
  return n;
}

/**
 * Calcula la liquidación de un empeño a una fecha dada.
 *
 * Modelo común en México: interés simple por periodo. El interés se cobra
 * por periodos completos o iniciados a partir de la fecha de inicio.
 * - Desempeño (liquidar): capital + interés acumulado.
 * - Refrendo (renovar): sólo el interés acumulado del periodo en curso.
 */
type EmpenoCalc = Pick<
  Empeno,
  "montoPrestado" | "tasaInteres" | "periodo" | "fechaInicio" | "fechaVencimiento" | "diasGracia"
> &
  Partial<Pick<Empeno, "almacenajePct" | "ivaPct" | "abonoCapital">>;

export function calcularLiquidacion(empeno: EmpenoCalc, aFecha: Date = new Date()): CalculoLiquidacion {
  const dias = Math.max(0, diffDias(empeno.fechaInicio, aFecha));

  // Periodos transcurridos (mínimo 1: al pactar ya se devenga el primer periodo)
  const periodosTranscurridos = periodosDevengados(empeno.fechaInicio, empeno.periodo, aFecha);

  const almacenajePct = empeno.almacenajePct ?? 0;
  const ivaPct = empeno.ivaPct ?? 0;
  const abonoCapital = empeno.abonoCapital ?? 0;

  const interesPorPeriodo = empeno.montoPrestado * (empeno.tasaInteres / 100);
  const almacenajePorPeriodo = empeno.montoPrestado * (almacenajePct / 100);
  const ivaPorPeriodo = (interesPorPeriodo + almacenajePorPeriodo) * (ivaPct / 100);

  const interesAcumulado = interesPorPeriodo * periodosTranscurridos;
  const almacenajeAcumulado = almacenajePorPeriodo * periodosTranscurridos;
  const ivaAcumulado = ivaPorPeriodo * periodosTranscurridos;

  const capitalPendiente = Math.max(0, empeno.montoPrestado - abonoCapital);

  const diasParaVencer = -diffDias(empeno.fechaVencimiento, aFecha);
  const vencido = diasParaVencer < -empeno.diasGracia;

  return {
    capital: round2(capitalPendiente),
    interesAcumulado: round2(interesAcumulado),
    almacenajeAcumulado: round2(almacenajeAcumulado),
    ivaAcumulado: round2(ivaAcumulado),
    periodosTranscurridos,
    diasTranscurridos: dias,
    totalDesempeno: round2(capitalPendiente + interesAcumulado + almacenajeAcumulado + ivaAcumulado),
    totalRefrendo: round2(interesPorPeriodo + almacenajePorPeriodo + ivaPorPeriodo),
    vencido,
    diasParaVencer,
  };
}

/** Calcula la fecha de vencimiento a partir del inicio, periodo y plazo. */
export function calcularVencimiento(
  fechaInicioISO: string,
  periodo: PeriodoInteres,
  plazoPeriodos: number
): string {
  return sumarPeriodos(fechaInicioISO, periodo, plazoPeriodos);
}

/** Préstamo sugerido como % del avalúo (default 50% — práctica común). */
export function prestamoSugerido(valorAvaluo: number, porcentaje = 50): number {
  return round2(valorAvaluo * (porcentaje / 100));
}

/**
 * Tasa de interés mensual sugerida según el historial del cliente
 * (basado en el flujo PRENDAFLEX):
 *  - Cliente regular: 10.80%
 *  - Más de 3 empeños: 8.64%
 *  - Más de 5 empeños: 6.48%
 */
export function tasaPorHistorial(empenosPrevios: number): {
  tasa: number;
  nivel: string;
  requiereAutorizacion: boolean;
} {
  if (empenosPrevios > 5)
    return { tasa: 6.48, nivel: "Preferente (+5 empeños)", requiereAutorizacion: true };
  if (empenosPrevios > 3)
    return { tasa: 8.64, nivel: "Frecuente (+3 empeños)", requiereAutorizacion: false };
  return { tasa: 10.8, nivel: "Regular", requiereAutorizacion: false };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
