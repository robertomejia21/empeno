// Días inhábiles en México: domingos + los días de descanso obligatorio
// federales (Art. 74 LFT). Se usa solo para avisar al personal cuando una
// fecha de pago cae en un día que la sucursal no abre — la fecha de pago
// registrada en el sistema NUNCA se recorre por esto (ver refrendarEmpeno:
// el vencimiento siempre se ancla al periodo anterior, no al día de pago).
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

/** true si la fecha (YYYY-MM-DD) es domingo o festivo oficial. */
export function esDiaInhabil(fechaISO: string): boolean {
  const [a, m, d] = fechaISO.split("-").map(Number);
  const fecha = new Date(a, m - 1, d);
  if (fecha.getDay() === 0) return true;
  return festivosMexico(a).includes(fechaISO);
}
