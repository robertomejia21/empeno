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

/** Datos de la empresa (placeholder editable en Configuración). */
export const EMPRESA = {
  nombre: "Empeño Suite",
  razonSocial: "Casa de Empeño Demo, S.A. de C.V.",
  rfc: "XAXX010101000",
  registroProfeco: "RPCE-PENDIENTE",
  nom: "NOM-179-SCFI-2016",
};

/** Precio de referencia de metales (MXN/gramo de oro puro 24k). Editable. */
export const PRECIO_ORO_24K_GRAMO = 1750;
export const PRECIO_PLATA_GRAMO = 22;
