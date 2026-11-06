// Lista de chequeo vehicular que llena el mecánico para un avalúo más preciso.
// Tomada del formato "08.CHECKLIST MECANICO".
export const CHECKLIST_MECANICO = [
  "Batería",
  "Gasolina",
  "Luces traseras",
  "Luces bajas",
  "Luces altas",
  "Luz de freno",
  "Intermitentes",
  "Direccionales",
  "Sistema de arranque",
  "Voltaje en funcionamiento",
  "Bujías",
  "Alternador",
  "Tren delantero y trasero",
  "Rodamientos",
  "Tripoides (Transmisión)",
  "Gomas y bujes",
  "Frenos delanteros",
  "Frenos traseros",
  "Bolsa de aire",
  "Cinturones de seguridad",
  "Rayón",
  "Golpes",
  "Claxón",
  "Manijas de puertas",
  "Aire acondicionado",
  "Calefacción",
  "Seguros de puertas",
  "Espejos retrovisores laterales",
  "Espejo retrovisor interior",
] as const;

export const CHECKLIST_OPCIONES = ["bueno", "regular", "malo", "na"] as const;
export type ChecklistValor = (typeof CHECKLIST_OPCIONES)[number];

export const CHECKLIST_ETIQUETA: Record<ChecklistValor, string> = {
  bueno: "Bueno",
  regular: "Regular",
  malo: "Malo",
  na: "N/A",
};

// Revisión de vehículos en resguardo, calificada Bueno / Regular / Malo.
// Tomada del formato "01.CHECKLIST DIARIO" (hoja "Checklist de revisión de vehículos").
export const PUNTOS_REVISION = [
  "Aceite",
  "Llantas",
  "Frenos",
  "Luces",
  "Batería",
  "Fluidos",
  "Carrocería",
  "Interior",
] as const;
export type PuntoRevision = (typeof PUNTOS_REVISION)[number];

export const CALIFICACIONES_REVISION = ["B", "R", "M"] as const;
export type CalificacionRevision = (typeof CALIFICACIONES_REVISION)[number];
export const CALIFICACION_ETIQUETA: Record<CalificacionRevision, string> = { B: "Bueno", R: "Regular", M: "Malo" };

/** Responsable habitual del checklist (según el formato de la sucursal). */
export const RESPONSABLE_CHECKLIST_DEFAULT = "José Fernando Mesa Martínez";
