export interface PasoDef {
  n: number;
  titulo: string;
  descripcion: string;
  color: string; // color del diagrama PRENDAFLEX
  icono: string;
}

export const PASOS: PasoDef[] = [
  { n: 1, titulo: "Inicio de operación", descripcion: "Recepción del bien prendario", color: "#0d9488", icono: "🧾" },
  { n: 2, titulo: "Registro del cliente", descripcion: "CURP, nombre, dirección, teléfono", color: "#1d4ed8", icono: "👤" },
  { n: 3, titulo: "Selección del departamento", descripcion: "Tipo de artículo empeñado", color: "#ea580c", icono: "🗂️" },
  { n: 4, titulo: "Datos del bien", descripcion: "Características y avalúo", color: "#16a34a", icono: "📋" },
  { n: 5, titulo: "Asignación del préstamo", descripcion: "Monto autorizado y salida de caja", color: "#b45309", icono: "💰" },
  { n: 6, titulo: "Asignación de intereses", descripcion: "Tasa según historial", color: "#7c3aed", icono: "％" },
  { n: 7, titulo: "Generación de contrato", descripcion: "Revisión y condiciones", color: "#16a34a", icono: "📄" },
  { n: 8, titulo: "Resguardo y evidencia", descripcion: "Fotos, condiciones, ubicación", color: "#0284c7", icono: "📷" },
  { n: 9, titulo: "Vigencia del contrato", descripcion: "30 días naturales", color: "#ea580c", icono: "📅" },
];

export const TOTAL_PASOS = PASOS.length;
