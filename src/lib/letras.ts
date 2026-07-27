// Convierte un monto en pesos a letras (para el contrato). Soporta 0..999,999,999.
const UNI = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DEC = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CEN = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function centenas(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let txt = CEN[c];
  if (resto > 0) {
    let r: string;
    if (resto < 30) r = UNI[resto];
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      r = DEC[d] + (u > 0 ? " y " + UNI[u] : "");
    }
    txt = (txt ? txt + " " : "") + r;
  }
  return txt.trim();
}

function seccion(n: number, singular: string, plural: string): string {
  if (n === 0) return "";
  if (n === 1) return singular;
  return centenas(n) + " " + plural;
}

function enteroALetras(n: number): string {
  if (n === 0) return "cero";
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones > 0) partes.push(seccion(millones, "un millón", "millones"));
  if (miles > 0) partes.push(seccion(miles, "mil", "mil"));
  if (resto > 0) partes.push(centenas(resto));
  return partes.join(" ").replace(/\s+/g, " ").trim();
}

/** "MIL DOSCIENTOS PESOS 00/100 M.N." */
export function pesosALetras(monto: number): string {
  const entero = Math.floor(Math.abs(monto));
  const centavos = Math.round((Math.abs(monto) - entero) * 100);
  const letras = enteroALetras(entero).toUpperCase();
  return `${letras} PESOS ${String(centavos).padStart(2, "0")}/100 M.N.`;
}
