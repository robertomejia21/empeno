// Lógica de cálculo de intereses y liquidaciones de empeños
import type { Empeno, CalculoLiquidacion, PeriodoInteres } from "./types";

const DIAS_POR_PERIODO: Record<PeriodoInteres, number> = {
  mensual: 30,
  quincenal: 15,
  semanal: 7,
};

export function diasPorPeriodo(periodo: PeriodoInteres): number {
  return DIAS_POR_PERIODO[periodo];
}

function diffDias(desde: string, hasta: Date): number {
  const d0 = new Date(desde + (desde.length === 10 ? "T00:00:00" : ""));
  const ms = hasta.getTime() - d0.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * Calcula la liquidación de un empeño a una fecha dada.
 *
 * Modelo común en México: interés simple por periodo. El interés se cobra
 * por periodos completos o iniciados a partir de la fecha de inicio.
 * - Desempeño (liquidar): capital + interés acumulado.
 * - Refrendo (renovar): sólo el interés acumulado del periodo en curso.
 */
export function calcularLiquidacion(
  empeno: Pick<
    Empeno,
    | "montoPrestado"
    | "tasaInteres"
    | "periodo"
    | "fechaInicio"
    | "fechaVencimiento"
    | "diasGracia"
  >,
  aFecha: Date = new Date()
): CalculoLiquidacion {
  const dias = Math.max(0, diffDias(empeno.fechaInicio, aFecha));
  const diasPeriodo = DIAS_POR_PERIODO[empeno.periodo];

  // Periodos transcurridos (mínimo 1: al pactar ya se devenga el primer periodo)
  const periodosTranscurridos = Math.max(1, Math.ceil(dias / diasPeriodo));

  const interesPorPeriodo = empeno.montoPrestado * (empeno.tasaInteres / 100);
  const interesAcumulado = interesPorPeriodo * periodosTranscurridos;

  const diasParaVencer = -diffDias(empeno.fechaVencimiento, aFecha);
  const vencido = diasParaVencer < -empeno.diasGracia;

  return {
    capital: empeno.montoPrestado,
    interesAcumulado: round2(interesAcumulado),
    periodosTranscurridos,
    diasTranscurridos: dias,
    totalDesempeno: round2(empeno.montoPrestado + interesAcumulado),
    totalRefrendo: round2(interesPorPeriodo), // interés de un periodo para renovar
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
  const inicio = new Date(fechaInicioISO + "T00:00:00");
  const dias = DIAS_POR_PERIODO[periodo] * plazoPeriodos;
  inicio.setDate(inicio.getDate() + dias);
  return inicio.toISOString().slice(0, 10);
}

/** Préstamo sugerido como % del avalúo (default 50% — práctica común). */
export function prestamoSugerido(valorAvaluo: number, porcentaje = 50): number {
  return round2(valorAvaluo * (porcentaje / 100));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
