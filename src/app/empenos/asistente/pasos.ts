import {
  Banknote,
  CalendarDays,
  Camera,
  ClipboardList,
  FileText,
  FolderOpen,
  Percent,
  ReceiptText,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PasoDef {
  n: number;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
}

export const PASOS: PasoDef[] = [
  { n: 1, titulo: "Inicio de operación", descripcion: "Recepción del bien prendario", icono: ReceiptText },
  { n: 2, titulo: "Registro del cliente", descripcion: "CURP, nombre, dirección, teléfono", icono: UserRound },
  { n: 3, titulo: "Selección del departamento", descripcion: "Tipo de artículo empeñado", icono: FolderOpen },
  { n: 4, titulo: "Datos del bien", descripcion: "Características y avalúo", icono: ClipboardList },
  { n: 5, titulo: "Asignación del préstamo", descripcion: "Monto autorizado y salida de caja", icono: Banknote },
  { n: 6, titulo: "Asignación de intereses", descripcion: "Tasa según historial", icono: Percent },
  { n: 7, titulo: "Generación de contrato", descripcion: "Revisión y condiciones", icono: FileText },
  { n: 8, titulo: "Resguardo y evidencia", descripcion: "Fotos, condiciones, ubicación", icono: Camera },
  { n: 9, titulo: "Vigencia del contrato", descripcion: "30 días naturales", icono: CalendarDays },
];

export const TOTAL_PASOS = PASOS.length;
