// Constantes y reglas de cumplimiento para casas de empeño en México.
// Basado en LFPIORPI (Ley Antilavado), NOM-179-SCFI y normativa PROFECO/SAT.

/** Valor de la UMA diaria 2026 (MXN). Actualizar cada año (DOF). */
export const UMA_DIARIA_2026 = 113.14;

/**
 * Umbrales LFPIORPI para metales preciosos / actividad vulnerable (en UMA).
 * - Identificación: a partir de este monto se integra expediente KYC del cliente.
 * - Aviso: a partir de este monto en efectivo se presenta aviso al SAT/UIF.
 */
export const UMBRAL_IDENTIFICACION_UMA = 805;
export const UMBRAL_AVISO_UMA = 1605;

export const UMBRAL_IDENTIFICACION_MXN = Math.round(UMBRAL_IDENTIFICACION_UMA * UMA_DIARIA_2026 * 100) / 100;
export const UMBRAL_AVISO_MXN = Math.round(UMBRAL_AVISO_UMA * UMA_DIARIA_2026 * 100) / 100;

export type NivelAlertaPLD = "ok" | "identificacion" | "aviso";

export interface EvaluacionPLD {
  nivel: NivelAlertaPLD;
  requiereIdentificacion: boolean;
  requiereAviso: boolean;
  etiqueta: string;
}

/** Evalúa una operación por su monto frente a los umbrales LFPIORPI. */
export function evaluarPLD(monto: number): EvaluacionPLD {
  if (monto >= UMBRAL_AVISO_MXN) {
    return {
      nivel: "aviso",
      requiereIdentificacion: true,
      requiereAviso: true,
      etiqueta: "Aviso al SAT/UIF",
    };
  }
  if (monto >= UMBRAL_IDENTIFICACION_MXN) {
    return {
      nivel: "identificacion",
      requiereIdentificacion: true,
      requiereAviso: false,
      etiqueta: "Requiere identificación (KYC)",
    };
  }
  return { nivel: "ok", requiereIdentificacion: false, requiereAviso: false, etiqueta: "Sin obligación" };
}

/** Datos de la empresa (editables en Configuración). */
export const EMPRESA = {
  nombre: "Turbo Presta",
  nombreCorto: "Turbo Presta",
  razonSocial: "Turbo Presta El Dorado, S.A. de C.V.",
  rfc: "WOR110209AA4",
  registroProfeco: "RPCE-PENDIENTE",
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
