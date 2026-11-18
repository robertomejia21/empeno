// Lógica de cálculo de intereses y liquidaciones de empeños
import type { Empeno, CalculoLiquidacion, PeriodoInteres } from "./types";
import { parseFechaLocal, aISOLocal } from "./format";
import { diasHabilesDespues } from "./diasInhabiles";
import { porcentajePrestamo, AJUSTES_DEFAULT, type AjustesPrestamo, type ReglasCalculo } from "./ajustesBase";

const DIAS_POR_PERIODO: Record<PeriodoInteres, number> = {
  mensual: 30, // referencia para costo diario; el vencimiento usa mes calendario
  quincenal: 15,
  semanal: 7,
  diario: 1,
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
  Partial<Pick<Empeno, "almacenajePct" | "ivaPct" | "abonoCapital" | "estado">>;

/**
 * @param festivos Días festivos (YYYY-MM-DD) dados de alta en /configuracion.
 *   Junto con los domingos, no cuentan como día de retraso: un pago que vence
 *   en sábado no genera moratorios el domingo.
 */
export function calcularLiquidacion(
  empeno: EmpenoCalc,
  aFecha: Date = new Date(),
  reglas: readonly string[] | ReglasCalculo = []
): CalculoLiquidacion {
  const festivos = Array.isArray(reglas) ? (reglas as readonly string[]) : (reglas as ReglasCalculo).festivos;
  // Sin reglas explícitas (vistas previas) se cobra el mes completo, como antes.
  const modo = Array.isArray(reglas) ? null : (reglas as ReglasCalculo).desempeno;
  const dias = Math.max(0, diffDias(empeno.fechaInicio, aFecha));

  // Periodos transcurridos (mínimo 1: al pactar ya se devenga el primer periodo)
  const periodosTranscurridos = periodosDevengados(empeno.fechaInicio, empeno.periodo, aFecha);

  const almacenajePct = empeno.almacenajePct ?? 0;
  const ivaPct = empeno.ivaPct ?? 0;
  const abonoCapital = empeno.abonoCapital ?? 0;

  const interesPorPeriodo = empeno.montoPrestado * (empeno.tasaInteres / 100);
  const almacenajePorPeriodo = empeno.montoPrestado * (almacenajePct / 100);
  const ivaPorPeriodo = (interesPorPeriodo + almacenajePorPeriodo) * (ivaPct / 100);

  // Periodos que se cobran al desempeñar: los completos + el periodo en curso
  // según el modo de Ajustes (completo, proporcional por días o con gracia).
  const periodosCobrados = periodosACobrar(empeno, periodosTranscurridos, aFecha, modo);

  const interesAcumulado = interesPorPeriodo * periodosCobrados;
  const almacenajeAcumulado = almacenajePorPeriodo * periodosCobrados;
  const ivaAcumulado = ivaPorPeriodo * periodosCobrados;

  const capitalPendiente = Math.max(0, empeno.montoPrestado - abonoCapital);

  const diasParaVencer = -diffDias(empeno.fechaVencimiento, aFecha);
  // El retraso se cuenta en días hábiles: domingos y festivos no suman.
  const diasAtraso = diasParaVencer < 0 ? diasHabilesDespues(empeno.fechaVencimiento, aFecha, festivos) : 0;
  const vencido = diasAtraso > empeno.diasGracia;

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
    diasAtraso,
  };
}

/**
 * Fracción de periodos a cobrar al desempeñar hoy. El periodo en curso es el
 * n-ésimo (n = periodos devengados): va de inicio+(n-1) a inicio+n.
 */
function periodosACobrar(
  empeno: Pick<Empeno, "fechaInicio" | "periodo"> & Partial<Pick<Empeno, "estado">>,
  n: number,
  aFecha: Date,
  modo: ReglasCalculo["desempeno"] | null
): number {
  if (!modo || modo.modo === "completo") return n;
  const inicioPeriodo = sumarPeriodos(empeno.fechaInicio, empeno.periodo, n - 1);
  const finPeriodo = sumarPeriodos(empeno.fechaInicio, empeno.periodo, n);
  const diasPeriodo = Math.max(1, diffDias(inicioPeriodo, parseFechaLocal(finPeriodo)));
  const diasEnCurso = Math.min(diasPeriodo, Math.max(0, diffDias(inicioPeriodo, aFecha)));
  if (modo.modo === "proporcional") {
    // Mínimo un día: liquidar el mismo día del contrato/refrendo cobra 1 día.
    return n - 1 + Math.max(1, diasEnCurso) / diasPeriodo;
  }
  // "gracia": dentro de los primeros días de un periodo NUEVO (después de un
  // vencimiento o de un refrendo) no se cobra ese periodo. El primer mes de un
  // empeño recién hecho siempre se cobra.
  const periodoNuevo = n > 1 || empeno.estado === "refrendado";
  if (periodoNuevo && diasEnCurso <= modo.diasGracia) return n - 1;
  return n;
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
 * Préstamo sugerido según la regla de /configuracion: un % hasta cierto
 * avalúo y otro % arriba de él (ej. 50% hasta $10,000 y 40% arriba).
 */
export function prestamoSugeridoPorRegla(
  valorAvaluo: number,
  cfg: AjustesPrestamo = AJUSTES_DEFAULT.prestamo
): { monto: number; porcentaje: number } {
  const porcentaje = porcentajePrestamo(valorAvaluo, cfg);
  return { monto: prestamoSugerido(valorAvaluo, porcentaje), porcentaje };
}

/**
 * Tasa total mínima (interés + almacenaje + IVA) que NO requiere autorización
 * de Dirección General. 6.48% = (3% + 3%) × 1.08.
 */
export const TASA_MINIMA_LIBRE = 6.48;

/** IVA fijo de la sucursal (zona fronteriza). No es editable por el personal. */
export const IVA_FIJO = 8;

/**
 * "Desempeño extemporáneo" (Cláusula 11e del contrato): 6% del monto
 * prestado cuando el desempeño/refrendo ocurre después del vencimiento
 * (vencido los días de gracia). Es una SUGERENCIA precargada, no forzada —
 * el personal la puede ajustar o condonar según el caso.
 */
export const TASA_MORATORIOS = 6;

export function moratoriosSugeridos(montoPrestado: number, vencido: boolean): number {
  return vencido ? Math.round(montoPrestado * (TASA_MORATORIOS / 100) * 100) / 100 : 0;
}

/**
 * Tasa total por periodo, igual que en la boleta del sistema anterior:
 * (interés + almacenaje) × (1 + IVA). Ej. vehículo 5% + 5% + 8% IVA = 10.8%.
 */
export function tasaEfectiva(interesPct: number, almacenajePct = 0, ivaPct = IVA_FIJO): number {
  return round2((interesPct + almacenajePct) * (1 + ivaPct / 100));
}

/** ¿Estos cargos requieren autorización de Dirección? (tasa total de 6.48% o menor). */
export function requiereAutorizacionTasa(interesPct: number, almacenajePct = 0, ivaPct = IVA_FIJO): boolean {
  const total = tasaEfectiva(interesPct, almacenajePct, ivaPct);
  return total > 0 && total <= TASA_MINIMA_LIBRE;
}

/**
 * Días de gracia después del vencimiento antes de perder el bien:
 * 5 para automóviles y 3 para el resto de los artículos. Se precargan y el
 * personal los puede ajustar.
 */
export function diasGraciaSugeridos(esVehiculo: boolean): number {
  return esVehiculo ? 5 : 3;
}

/**
 * CAT (Costo Anual Total, sin IVA) que se informa en el sistema y en la
 * carátula del contrato: 120% para automóviles (5% + 5% × 12) y 240% para el
 * resto de los artículos (10% + 10% × 12).
 */
export const CAT_VEHICULO = 120;
export const CAT_ARTICULO = 240;
export function catPorTipo(esVehiculo: boolean): number {
  return esVehiculo ? CAT_VEHICULO : CAT_ARTICULO;
}

/** Tasa especial de vehículos (total): nunca se asigna sola, siempre con autorización de Dirección. */
export const TASA_ESPECIAL_DIRECCION = 6.48;

/** Cargos precargados por tipo de bien (chips de captura rápida). Todo es % sobre lo prestado. */
export interface PresetCargos {
  id: string;
  etiqueta: string;
  interes: number;
  almacenaje: number;
  vehiculo: boolean;
  requiereAutorizacion?: boolean;
}

export const PRESETS_CARGOS: PresetCargos[] = [
  { id: "automovil", etiqueta: "Automóvil", interes: 5, almacenaje: 5, vehiculo: true },
  { id: "automovil-frecuente", etiqueta: "Automóvil · frecuente", interes: 4, almacenaje: 4, vehiculo: true },
  { id: "articulo", etiqueta: "Artículo", interes: 10, almacenaje: 10, vehiculo: false },
  { id: "automovil-especial", etiqueta: "Automóvil · especial", interes: 3, almacenaje: 3, vehiculo: true, requiereAutorizacion: true },
];

/** ¿El producto del catálogo es de vehículos (resguardo o GPS)? */
export function productoEsVehiculo(p: { nombre: string; modalidad: string | null }): boolean {
  return p.modalidad !== null || /VEH[IÍ]CULO/i.test(p.nombre);
}

/**
 * Desglosa un producto del catálogo en interés y almacenaje.
 * El catálogo guarda la tasa como se conocía en el sistema anterior:
 *  - Vehículos: tasa TOTAL con IVA (10.8 → 5% interés + 5% almacenaje + IVA).
 *  - Artículos: tasa por concepto con IVA (10.8 → 10% interés + 10% almacenaje + IVA = 21.6%).
 */
export function desgloseProducto(p: { nombre: string; modalidad: string | null; tasa: number }): {
  interes: number;
  almacenaje: number;
} {
  const base = p.tasa / (1 + IVA_FIJO / 100);
  const porConcepto = productoEsVehiculo(p) ? base / 2 : base;
  const v = round4(porConcepto);
  return { interes: v, almacenaje: v };
}

/**
 * Cargos sugeridos según el tipo de bien y el historial del cliente:
 *  - Vehículos: 5% interés + 5% almacenaje + IVA = 10.8%; con más de 3 empeños
 *    4% + 4% + IVA = 8.64%. El 3% + 3% (6.48%) es precio especial con
 *    autorización de Dirección: se elige a mano, nunca en automático.
 *  - Artículos: 10% interés + 10% almacenaje + IVA = 21.6%, sin descuento por historial.
 * `tasa` es la tasa total (con IVA) para mostrar.
 */
export function tasaPorHistorial(
  empenosPrevios: number,
  esVehiculo = true
): {
  tasa: number;
  interes: number;
  almacenaje: number;
  presetId: string;
  nivel: string;
  requiereAutorizacion: boolean;
} {
  const id = !esVehiculo ? "articulo" : empenosPrevios > 3 ? "automovil-frecuente" : "automovil";
  const p = PRESETS_CARGOS.find((x) => x.id === id)!;
  return {
    tasa: tasaEfectiva(p.interes, p.almacenaje),
    interes: p.interes,
    almacenaje: p.almacenaje,
    presetId: p.id,
    nivel: id === "automovil-frecuente" ? "Frecuente (+3 empeños)" : "Regular",
    requiereAutorizacion: false,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
