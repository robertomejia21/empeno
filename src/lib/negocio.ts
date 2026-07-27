// Datos del proveedor (razón social) para el contrato PROFECO.
// Tomados del contrato de adhesión registrado.
export const PROVEEDOR = {
  razonSocial: "WORKLINE COMPANY, S. DE R.L. DE C.V.",
  marca: "TURBO PRESTA EL DORADO",
  domicilio: "Calle Lázaro Cárdenas No. 401, Colonia Victoria Residencial, C.P. 21395, Mexicali, Baja California, México",
  rfc: "WOR110209AA4",
  telefono: "",
  correo: "",
  paginaWeb: "empeno.vercel.app",
  registroRPCA: "2089-2022",
  registroFecha: "06 de junio de 2022",
} as const;

export const PROFECO = {
  telefonos: "55 68 87 22 · 01-800-468-87-22",
  paginaWeb: "www.gob.mx/profeco",
} as const;

/** Número de periodos al año según el periodo del contrato. */
export function periodosPorAnio(periodo: "mensual" | "quincenal" | "semanal"): number {
  return periodo === "mensual" ? 12 : periodo === "quincenal" ? 24 : 52;
}
