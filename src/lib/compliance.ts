// Constantes y reglas de cumplimiento para casas de empeño en México.
// Basado en el manual "PLD INTEGRADO 2026" de la empresa (LFPIORPI art. 17
// fracciones IV, VI y VIII; reforma DOF 16/jul/2025 y Reglamento 2026),
// NOM-179-SCFI y normativa PROFECO/SAT.

/**
 * UMA diaria 2026 (MXN): vigente del 1 de febrero de 2026 al 31 de enero de 2027.
 * En enero de cada año sigue aplicando la UMA del año anterior. Actualizar cada año (DOF).
 */
export const UMA_DIARIA_2026 = 117.31;
export const UMA_VIGENCIA = "1 de febrero de 2026 al 31 de enero de 2027";

export function umaAMXN(uma: number): number {
  return Math.round(uma * UMA_DIARIA_2026 * 100) / 100;
}

/** Actividades vulnerables que realiza la casa de empeño (manual PLD, sección VII). */
export type ActividadPLD = "prestamo" | "joyeria" | "vehiculo";

export interface ReglaActividadPLD {
  nombre: string;
  fraccion: string;
  /** UMA a partir de las cuales se identifica al cliente. null = SIEMPRE. */
  identificacionUMA: number | null;
  /** UMA a partir de las cuales se presenta Aviso a la UIF (vía SAT). */
  avisoUMA: number;
  /** UMA a partir de las cuales NO se acepta efectivo en ninguna proporción (art. 32). */
  efectivoMaxUMA: number | null;
}

export const ACTIVIDADES_PLD: Record<ActividadPLD, ReglaActividadPLD> = {
  prestamo: {
    nombre: "Préstamos prendarios",
    fraccion: "IV",
    identificacionUMA: null,
    avisoUMA: 1605,
    efectivoMaxUMA: null,
  },
  joyeria: {
    nombre: "Joyas, piedras y metales preciosos (compra y venta)",
    fraccion: "VI",
    identificacionUMA: 805,
    avisoUMA: 1605,
    efectivoMaxUMA: null,
  },
  vehiculo: {
    nombre: "Venta de vehículos",
    fraccion: "VIII",
    identificacionUMA: 3210,
    avisoUMA: 6420,
    efectivoMaxUMA: 3210,
  },
};

/** Ventana de acumulación de operaciones para Avisos (Reglamento 2026): seis meses móviles. */
export const MESES_ACUMULACION = 6;

/** Se alerta cuando lo acumulado llega a este % del umbral de Aviso (margen para analizar y reportar). */
export const PCT_ALERTA_PREVIA_AVISO = 80;

export type NivelAlertaPLD = "ok" | "identificacion" | "cerca_aviso" | "aviso" | "efectivo_prohibido";

export interface EvaluacionPLD {
  nivel: NivelAlertaPLD;
  requiereIdentificacion: boolean;
  requiereAviso: boolean;
  /** El monto obliga a no recibir efectivo. */
  efectivoProhibido: boolean;
  /** Se recibió efectivo cuando estaba prohibido. */
  efectivoIndebido: boolean;
  /** Lo acumulado ya está cerca del umbral de Aviso. */
  cercaDeAviso: boolean;
  etiqueta: string;
}

/**
 * Evalúa una operación frente a los umbrales del manual PLD.
 * @param monto       importe de esta operación
 * @param acumulado   suma de las operaciones del mismo cliente y actividad en
 *                    los últimos 6 meses, INCLUYENDO esta (si no se pasa, = monto)
 * @param efectivo    true si la operación se pagó (o se va a pagar) en efectivo
 */
export function evaluarOperacionPLD(
  actividad: ActividadPLD,
  monto: number,
  acumulado: number = monto,
  efectivo = false
): EvaluacionPLD {
  const r = ACTIVIDADES_PLD[actividad];
  const total = Math.max(monto, acumulado);
  const umbralAviso = umaAMXN(r.avisoUMA);
  const requiereIdentificacion = r.identificacionUMA === null || monto >= umaAMXN(r.identificacionUMA);
  const requiereAviso = total >= umbralAviso;
  const cercaDeAviso = !requiereAviso && total >= umbralAviso * (PCT_ALERTA_PREVIA_AVISO / 100);
  const efectivoProhibido = r.efectivoMaxUMA !== null && monto >= umaAMXN(r.efectivoMaxUMA);
  const efectivoIndebido = efectivoProhibido && efectivo;

  let nivel: NivelAlertaPLD = "ok";
  let etiqueta = r.identificacionUMA === null ? "Identificación (siempre)" : "Sin obligación";
  if (requiereIdentificacion && r.identificacionUMA !== null) {
    nivel = "identificacion";
    etiqueta = "Requiere identificación y expediente";
  }
  if (cercaDeAviso) {
    nivel = "cerca_aviso";
    etiqueta = `Cerca del umbral de Aviso (${PCT_ALERTA_PREVIA_AVISO}%)`;
  }
  if (requiereAviso) {
    nivel = "aviso";
    etiqueta = "Aviso a la UIF/SAT";
  }
  if (efectivoIndebido) {
    nivel = "efectivo_prohibido";
    etiqueta = "Efectivo prohibido (art. 32)";
  }
  return { nivel, requiereIdentificacion, requiereAviso, efectivoProhibido, efectivoIndebido, cercaDeAviso, etiqueta };
}

/** Inicio (YYYY-MM-DD) de la ventana móvil de acumulación que termina en `fechaISO`. */
export function inicioVentanaAcumulacion(fechaISO: string): string {
  const [a, m, d] = fechaISO.slice(0, 10).split("-").map(Number);
  const f = new Date(a, m - 1 - MESES_ACUMULACION, d);
  const mm = String(f.getMonth() + 1).padStart(2, "0");
  const dd = String(f.getDate()).padStart(2, "0");
  return `${f.getFullYear()}-${mm}-${dd}`;
}

export interface OperacionPLD {
  clienteId: string | null;
  actividad: ActividadPLD;
  monto: number;
  fecha: string; // YYYY-MM-DD (o ISO)
}

/** Suma lo operado por el cliente en la actividad dentro de los 6 meses que terminan en `fechaISO`. */
export function acumuladoCliente(
  ops: readonly OperacionPLD[],
  clienteId: string | null,
  actividad: ActividadPLD,
  fechaISO: string
): number {
  if (!clienteId) return 0;
  const desde = inicioVentanaAcumulacion(fechaISO);
  const hasta = fechaISO.slice(0, 10);
  return ops
    .filter((o) => o.clienteId === clienteId && o.actividad === actividad)
    .filter((o) => o.fecha.slice(0, 10) > desde && o.fecha.slice(0, 10) <= hasta)
    .reduce((s, o) => s + o.monto, 0);
}

/** Fecha local YYYY-MM-DD de un timestamp ISO (fecha en que se otorgó el préstamo). */
function fechaLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Actividad PLD de la venta/compra de una prenda según su categoría (null = no es actividad vulnerable). */
export function actividadPorCategoria(categoria: string | null | undefined): ActividadPLD | null {
  if (categoria === "Vehículos") return "vehiculo";
  if (categoria === "Joyería") return "joyeria";
  return null;
}

export interface OperacionPLDDetalle extends OperacionPLD {
  tipo: "Empeño" | "Venta" | "Compra";
  folio: string;
  efectivo: boolean;
  href: string;
}

/**
 * Arma la lista de operaciones vulnerables: empeños (fr. IV), ventas y compras
 * de joyería (fr. VI) y ventas de vehículos (fr. VIII). Ventas/compras de otras
 * categorías no son actividad vulnerable y se omiten.
 */
export function construirOperacionesPLD(datos: {
  empenos: readonly { id: string; folio: string; clienteId: string; montoPrestado: number; creadoEn: string; metodoPago: string; estado: string }[];
  ventas: readonly { folio: string; prendaId: string; clienteId: string | null; precio: number; fecha: string; metodoPago: string }[];
  compras: readonly { folio: string; prendaId: string; clienteId: string | null; monto: number; fecha: string }[];
  categoriaPrenda: (prendaId: string) => string | null | undefined;
}): OperacionPLDDetalle[] {
  const ops: OperacionPLDDetalle[] = [];
  for (const e of datos.empenos) {
    if (e.estado === "borrador" || e.estado === "cancelado") continue;
    ops.push({
      tipo: "Empeño", folio: e.folio, clienteId: e.clienteId, actividad: "prestamo",
      monto: e.montoPrestado, fecha: fechaLocal(e.creadoEn), efectivo: e.metodoPago === "efectivo", href: `/empenos/${e.id}`,
    });
  }
  for (const v of datos.ventas) {
    const actividad = actividadPorCategoria(datos.categoriaPrenda(v.prendaId));
    if (!actividad) continue;
    ops.push({
      tipo: "Venta", folio: v.folio, clienteId: v.clienteId, actividad,
      monto: v.precio, fecha: v.fecha, efectivo: v.metodoPago === "efectivo", href: "/ventas",
    });
  }
  for (const c of datos.compras) {
    if (actividadPorCategoria(datos.categoriaPrenda(c.prendaId)) !== "joyeria") continue;
    ops.push({
      tipo: "Compra", folio: c.folio, clienteId: c.clienteId, actividad: "joyeria",
      monto: c.monto, fecha: c.fecha, efectivo: true, href: "/compras",
    });
  }
  return ops.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// Compatibilidad: umbrales de joyería/metales (fracción VI) usados en pantallas antiguas.
export const UMBRAL_IDENTIFICACION_UMA = ACTIVIDADES_PLD.joyeria.identificacionUMA as number;
export const UMBRAL_AVISO_UMA = ACTIVIDADES_PLD.joyeria.avisoUMA;
export const UMBRAL_IDENTIFICACION_MXN = umaAMXN(UMBRAL_IDENTIFICACION_UMA);
export const UMBRAL_AVISO_MXN = umaAMXN(UMBRAL_AVISO_UMA);

/** Datos de la empresa (editables en Configuración). */
export const EMPRESA = {
  nombre: "Turbo Presta",
  nombreCorto: "Turbo Presta",
  // Igual que el contrato de adhesión registrado (ver PROVEEDOR en negocio.ts).
  razonSocial: "WORKLINE COMPANY, S. DE R.L. DE C.V.",
  rfc: "WOR110209AA4",
  registroProfeco: "2089-2022 (06/jun/2022)",
  nom: "NOM-179-SCFI-2016",
  // Encabezado y pie de los tickets impresos
  sucursal: "EL DORADO",
  direccion: "Blvd. Lázaro Cárdenas #4101",
  colonia: "Col. Islas Agrarias",
  ciudad: "Mexicali, B.C.",
  cp: "21230",
  telefono: "686 592 8288",
  whatsapp: "526865928288", // formato internacional, para las ligas wa.me
};

/** Precio de referencia de metales (MXN/gramo de oro puro 24k). Editable. */
export const PRECIO_ORO_24K_GRAMO = 1750;
export const PRECIO_PLATA_GRAMO = 22;
