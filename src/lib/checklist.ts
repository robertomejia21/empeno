// Lista de chequeo vehicular que llena el mecánico para un avalúo más preciso.
// Tomada del formato "08.CHECKLIST MECANICO".
export const CHECKLIST_MECANICO = [
  "Batería",
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
  "Cauchos",
  "Rodamientos",
  "Tripoides",
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
