// Días inhábiles: domingos + los días festivos que Dirección da de alta en
// /configuracion (se pueden precargar los de descanso obligatorio, Art. 74 LFT).
// - No cuentan como día de retraso al decidir si un empeño ya está vencido
//   (y por lo tanto si se sugieren moratorios). Ver calcularLiquidacion.
// - También se usan para avisar al personal cuando una fecha de pago cae en
//   un día que la sucursal no abre. La fecha de pago registrada NUNCA se
//   recorre por esto (ver refrendarEmpeno: el vencimiento se ancla al periodo
//   anterior, no al día de pago).
import { aISOLocal } from "@/lib/format";

/** n-ésimo lunes del mes (mes 0-indexado), como fecha local. */
function lunesN(anio: number, mes: number, n: number): Date {
  const d = new Date(anio, mes, 1);
  let contados = 0;
  while (true) {
    if (d.getDay() === 1) {
      contados++;
      if (contados === n) return new Date(d);
    }
    d.setDate(d.getDate() + 1);
  }
}

/** Festivos oficiales (descanso obligatorio, Art. 74 LFT) de un año, en formato YYYY-MM-DD. */
export function festivosMexico(anio: number): string[] {
  const fechas: Date[] = [
    new Date(anio, 0, 1), // 1 de enero
    lunesN(anio, 1, 1), // 1er lunes de febrero — Día de la Constitución
    lunesN(anio, 2, 3), // 3er lunes de marzo — Natalicio de Benito Juárez
    new Date(anio, 4, 1), // 1 de mayo — Día del Trabajo
    new Date(anio, 8, 16), // 16 de septiembre — Independencia
    lunesN(anio, 10, 3), // 3er lunes de noviembre — Revolución
    new Date(anio, 11, 25), // 25 de diciembre
  ];
  // Transmisión del Poder Ejecutivo Federal: cada 6 años, a partir de 1934.
  if ((anio - 1934) % 6 === 0) fechas.push(new Date(anio, 11, 1));
  return fechas.map(aISOLocal);
}

/** Nombres de los festivos oficiales, en el mismo orden que festivosMexico(). */
export function festivosMexicoConNombre(anio: number): { fecha: string; nombre: string }[] {
  const nombres = [
    "Año Nuevo",
    "Día de la Constitución",
    "Natalicio de Benito Juárez",
    "Día del Trabajo",
    "Día de la Independencia",
    "Día de la Revolución",
    "Navidad",
    "Transmisión del Poder Ejecutivo",
  ];
  return festivosMexico(anio).map((fecha, i) => ({ fecha, nombre: nombres[i] }));
}

/**
 * true si la fecha (YYYY-MM-DD) es domingo o uno de los días festivos dados de
 * alta en /configuracion. Si no se pasa la lista, se usan los oficiales (LFT).
 */
export function esDiaInhabil(fechaISO: string, festivos?: readonly string[]): boolean {
  const [a, m, d] = fechaISO.split("-").map(Number);
  const fecha = new Date(a, m - 1, d);
  if (fecha.getDay() === 0) return true;
  return (festivos ?? festivosMexico(a)).includes(fechaISO);
}

/**
 * Días hábiles de retraso: cuenta los días después de `desdeISO` hasta `hasta`
 * (inclusive), saltando domingos y festivos. Si el pago vence el sábado y hoy
 * es lunes, el retraso es 1 día (el domingo no cuenta).
 */
export function diasHabilesDespues(desdeISO: string, hasta: Date, festivos: readonly string[]): number {
  const [a, m, d] = desdeISO.split("-").map(Number);
  const cursor = new Date(a, m - 1, d);
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  let n = 0;
  // Tope de seguridad: 10 años de días.
  for (let i = 0; i < 3660 && cursor < fin; i++) {
    cursor.setDate(cursor.getDate() + 1);
    if (!esDiaInhabil(aISOLocal(cursor), festivos)) n++;
  }
  return n;
}
