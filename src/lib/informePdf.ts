// PDF del Informe de operación (mismo contenido que la tarjeta del tablero).
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { EMPRESA } from "@/lib/compliance";
import { filasInforme, type ReporteSemanal } from "@/lib/reporteSemanal";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const fechaCorta = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};

export async function informePdf(r: ReporteSemanal): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oro = rgb(0.706, 0.325, 0.035);
  const gris = rgb(0.45, 0.43, 0.41);
  const negro = rgb(0.1, 0.09, 0.09);
  const banda = rgb(0.98, 0.93, 0.87);

  let page = doc.addPage([595, 842]);
  const { width } = page.getSize();
  const izq = 40;
  const der = width - 40;
  let y = 800;

  const encabezado = () => {
    page.drawText(`${EMPRESA.nombre.toUpperCase()} ${EMPRESA.sucursal}`, { x: izq, y, size: 15, font: bold, color: oro });
    page.drawText("Informe de operación", { x: izq, y: y - 16, size: 10, font, color: gris });
    const periodo = `Del ${fechaCorta(r.desde)} al ${fechaCorta(r.hasta)}`;
    page.drawText(periodo, { x: der - font.widthOfTextAtSize(periodo, 10), y, size: 10, font: bold, color: negro });
    const gen = `Generado ${fechaCorta(new Date().toISOString())}`;
    page.drawText(gen, { x: der - font.widthOfTextAtSize(gen, 8), y: y - 16, size: 8, font, color: gris });
    y -= 30;
    page.drawLine({ start: { x: izq, y }, end: { x: der, y }, thickness: 1.5, color: oro });
    y -= 22;
    page.drawText("DESCRIPCIÓN", { x: izq, y, size: 8, font: bold, color: gris });
    page.drawText("COMENTARIOS", { x: 330, y, size: 8, font: bold, color: gris });
    page.drawText("TOTAL", { x: der - bold.widthOfTextAtSize("TOTAL", 8), y, size: 8, font: bold, color: gris });
    y -= 8;
    page.drawLine({ start: { x: izq, y }, end: { x: der, y }, thickness: 0.5, color: gris });
    y -= 16;
  };

  const recortar = (t: string, max: number, f = font, size = 10) => {
    if (f.widthOfTextAtSize(t, size) <= max) return t;
    let s = t;
    while (s.length > 1 && f.widthOfTextAtSize(s + "…", size) > max) s = s.slice(0, -1);
    return s + "…";
  };

  encabezado();
  for (const f of filasInforme(r)) {
    if (y < 60) {
      page = doc.addPage([595, 842]);
      y = 800;
      encabezado();
    }
    if (f.seccion) {
      page.drawRectangle({ x: izq, y: y - 5, width: der - izq, height: 18, color: banda });
      const t = f.desc.toUpperCase();
      page.drawText(t, { x: (izq + der) / 2 - bold.widthOfTextAtSize(t, 9) / 2, y, size: 9, font: bold, color: oro });
      y -= 22;
      continue;
    }
    const size = f.detalle ? 9 : 10;
    const fuente = font;
    const x = f.detalle ? izq + 14 : izq;
    page.drawText(recortar(f.detalle ? `– ${f.desc}` : f.desc, 330 - x - 8, fuente, size), { x, y, size, font: fuente, color: f.detalle ? gris : negro });
    if (f.comentario) page.drawText(recortar(f.comentario, 120, font, 8.5), { x: 330, y, size: 8.5, font, color: gris });
    const total = mxn.format(f.total ?? 0);
    page.drawText(total, { x: der - bold.widthOfTextAtSize(total, size), y, size, font: f.detalle ? font : bold, color: f.detalle ? gris : negro });
    y -= 6;
    page.drawLine({ start: { x: izq, y }, end: { x: der, y }, thickness: 0.3, color: rgb(0.85, 0.84, 0.82) });
    y -= 14;
  }

  // Totales por modalidad
  const totVeh = r.vehiculos.refrendos + r.vehiculos.desempenos;
  const totArt = r.articulos.refrendos + r.articulos.desempenos;
  y -= 10;
  const resumen: [string, number][] = [
    ["Ingresos por ventas (vitrina + vehículos)", r.ventasVitrina + r.ventasVehiculos],
    ["Cobrado en refrendos y desempeños", totVeh + totArt],
    ["Capital prestado en empeños nuevos", r.vehiculos.empenos + r.articulos.empenos],
  ];
  for (const [t, v] of resumen) {
    if (y < 50) { page = doc.addPage([595, 842]); y = 800; }
    page.drawText(t, { x: izq, y, size: 10, font: bold, color: negro });
    const s = mxn.format(v);
    page.drawText(s, { x: der - bold.widthOfTextAtSize(s, 10), y, size: 10, font: bold, color: negro });
    y -= 16;
  }

  return doc.save();
}
