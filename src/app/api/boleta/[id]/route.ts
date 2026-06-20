import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { obtenerEmpeno } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { EMPRESA } from "@/lib/compliance";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const fecha = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso)) : "—";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await obtenerEmpeno(id);
  if (!e) return new Response("No encontrado", { status: 404 });

  const calc = calcularLiquidacion(e);
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const oro = rgb(0.706, 0.325, 0.035);
  const gris = rgb(0.45, 0.43, 0.41);
  const negro = rgb(0.1, 0.09, 0.09);
  let y = 800;

  const text = (t: string, x: number, size = 10, f = font, color = negro) =>
    page.drawText(t, { x, y, size, font: f, color });
  const row = (label: string, value: string, x = 40) => {
    page.drawText(label, { x, y, size: 9, font, color: gris });
    page.drawText(value, { x: x + 95, y, size: 10, font: bold, color: negro });
  };

  // Encabezado
  text(EMPRESA.nombre.toUpperCase(), 40, 18, bold, oro);
  page.drawText("Contrato Prendario / Boleta de Empeño", { x: 40, y: y - 16, size: 10, font, color: gris });
  page.drawText(e.folio, { x: width - 140, y, size: 16, font: bold, color: negro });
  page.drawText(fecha(e.fechaInicio), { x: width - 140, y: y - 16, size: 9, font, color: gris });
  y -= 40;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1.5, color: oro });
  y -= 24;

  // Cliente
  text("DATOS DEL CLIENTE", 40, 11, bold);
  y -= 18;
  row("Nombre:", `${e.cliente.nombre} ${e.cliente.apellidoPaterno} ${e.cliente.apellidoMaterno}`);
  y -= 16; row("CURP:", e.cliente.curp ?? "—");
  y -= 16; row("Identificación:", `${e.cliente.tipoIdentificacion} ${e.cliente.numeroIdentificacion}`);
  y -= 16; row("Teléfono:", e.cliente.telefono ?? "—");
  y -= 16; row("Domicilio:", e.cliente.direccion ?? "—");
  y -= 28;

  // Prenda
  text("BIEN PRENDARIO", 40, 11, bold);
  y -= 18;
  row("Descripción:", e.prenda.descripcion);
  y -= 16; row("Departamento:", e.prenda.categoria);
  y -= 16;
  const carac = [e.prenda.marca, e.prenda.submarca, e.prenda.modelo, e.prenda.color, e.prenda.kilataje, e.prenda.placas, e.prenda.serie].filter(Boolean).join(" · ");
  row("Características:", carac || "—");
  y -= 16; row("Avalúo:", mxn.format(e.prenda.valorAvaluo));
  y -= 28;

  // Condiciones
  text("CONDICIONES DEL PRÉSTAMO", 40, 11, bold);
  y -= 20;
  const boxY = y;
  page.drawRectangle({ x: 40, y: boxY - 56, width: width - 80, height: 72, borderColor: negro, borderWidth: 1 });
  page.drawText("Monto prestado", { x: 52, y: boxY, size: 8, font, color: gris });
  page.drawText(mxn.format(e.montoPrestado), { x: 52, y: boxY - 14, size: 13, font: bold, color: negro });
  page.drawText("Interés", { x: 220, y: boxY, size: 8, font, color: gris });
  page.drawText(`${e.tasaInteres}% ${e.periodo}`, { x: 220, y: boxY - 14, size: 13, font: bold, color: negro });
  page.drawText("Total a liquidar (hoy)", { x: 380, y: boxY, size: 8, font, color: gris });
  page.drawText(mxn.format(calc.totalDesempeno), { x: 380, y: boxY - 14, size: 13, font: bold, color: oro });
  page.drawText("Fecha de inicio", { x: 52, y: boxY - 34, size: 8, font, color: gris });
  page.drawText(fecha(e.fechaInicio), { x: 52, y: boxY - 46, size: 10, font: bold, color: negro });
  page.drawText("Vencimiento", { x: 220, y: boxY - 34, size: 8, font, color: gris });
  page.drawText(fecha(e.fechaVencimiento), { x: 220, y: boxY - 46, size: 10, font: bold, color: negro });
  page.drawText("Días de gracia", { x: 380, y: boxY - 34, size: 8, font, color: gris });
  page.drawText(`${e.diasGracia} días`, { x: 380, y: boxY - 46, size: 10, font: bold, color: negro });
  y = boxY - 90;

  // Leyenda
  const leyenda =
    "El pignorante declara ser legítimo propietario del bien entregado en garantía. El refrendo o pago deberá realizarse dentro del plazo pactado. Transcurrido el vencimiento y los días de gracia sin pago ni refrendo, el bien podrá pasar a remate conforme a las políticas internas y la normativa aplicable (PROFECO/CONDUSEF, " + EMPRESA.nom + ").";
  const palabras = leyenda.split(" ");
  let linea = "";
  for (const w of palabras) {
    if ((linea + w).length > 95) {
      page.drawText(linea, { x: 40, y, size: 8, font, color: gris });
      y -= 11;
      linea = "";
    }
    linea += w + " ";
  }
  if (linea) { page.drawText(linea, { x: 40, y, size: 8, font, color: gris }); y -= 11; }
  y -= 50;

  // Firmas
  page.drawLine({ start: { x: 60, y }, end: { x: 250, y }, thickness: 0.8, color: negro });
  page.drawLine({ start: { x: 345, y }, end: { x: 535, y }, thickness: 0.8, color: negro });
  page.drawText("Firma del cliente", { x: 110, y: y - 12, size: 8, font, color: gris });
  page.drawText("Firma y sello de la casa de empeño", { x: 370, y: y - 12, size: 8, font, color: gris });

  const bytes = await doc.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="boleta-${e.folio}.pdf"`,
    },
  });
}
