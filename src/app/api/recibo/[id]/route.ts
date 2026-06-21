import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { obtenerMovimiento } from "@/lib/db/repo";
import { EMPRESA } from "@/lib/compliance";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));

const tipoLabel: Record<string, string> = {
  prestamo: "Préstamo", desempeno: "Desempeño (liquidación)", refrendo: "Refrendo (interés)",
  abono: "Abono", venta: "Venta", gasto: "Gasto", apertura: "Apertura de caja",
  retiro: "Retiro", deposito: "Depósito", compra: "Compra directa",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await obtenerMovimiento(id);
  if (!m) return new Response("No encontrado", { status: 404 });

  const doc = await PDFDocument.create();
  const page = doc.addPage([420, 560]); // ticket
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const oro = rgb(0.706, 0.325, 0.035);
  const gris = rgb(0.45, 0.43, 0.41);
  const negro = rgb(0.1, 0.09, 0.09);
  let y = 520;

  const center = (t: string, size: number, f = font, color = negro) => {
    const w = f.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (width - w) / 2, y, size, font: f, color });
  };

  center(EMPRESA.nombre.toUpperCase(), 16, bold, oro);
  y -= 16;
  center("Recibo de pago", 10, font, gris);
  y -= 14;
  center(EMPRESA.razonSocial, 8, font, gris);
  y -= 24;
  page.drawLine({ start: { x: 30, y }, end: { x: width - 30, y }, thickness: 1, color: oro });
  y -= 24;

  const row = (label: string, value: string) => {
    page.drawText(label, { x: 36, y, size: 9, font, color: gris });
    const w = bold.widthOfTextAtSize(value, 10);
    page.drawText(value, { x: width - 36 - w, y, size: 10, font: bold, color: negro });
    y -= 20;
  };

  row("Folio movimiento:", m.id.slice(0, 8).toUpperCase());
  row("Fecha:", fechaHora(m.fecha));
  row("Concepto:", m.concepto.slice(0, 28));
  row("Tipo:", tipoLabel[m.tipo] ?? m.tipo);
  if (m.referencia) row("Referencia:", m.referencia);

  y -= 8;
  page.drawRectangle({ x: 30, y: y - 44, width: width - 60, height: 52, color: rgb(0.98, 0.95, 0.86) });
  page.drawText(m.esEntrada ? "TOTAL RECIBIDO" : "TOTAL", { x: 44, y: y - 16, size: 9, font, color: gris });
  page.drawText(mxn.format(m.monto), { x: 44, y: y - 36, size: 20, font: bold, color: oro });
  y -= 80;

  center("Gracias por su pago.", 9, font, gris);
  y -= 14;
  center(EMPRESA.nom, 7, font, gris);

  const bytes = await doc.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${m.id.slice(0, 8)}.pdf"`,
    },
  });
}
