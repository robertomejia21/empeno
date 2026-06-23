import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { obtenerCliente, listarEmpenos, listarMovimientos } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { EMPRESA } from "@/lib/compliance";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));

const estadoLabel: Record<string, string> = {
  activo: "Activo", refrendado: "Refrendado", vencido: "Vencido",
  desempenado: "Desempeñado", en_remate: "En remate", rematado: "Rematado",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await obtenerCliente(id);
  if (!cliente) return new Response("No encontrado", { status: 404 });

  const empenos = (await listarEmpenos()).filter((e) => e.clienteId === id);
  const idsEmp = new Set(empenos.map((e) => e.id));
  const pagos = (await listarMovimientos()).filter(
    (m) => m.esEntrada && m.empenoId && idsEmp.has(m.empenoId)
  );

  const activos = empenos.filter((e) => e.estado === "activo" || e.estado === "refrendado");
  const capitalVigente = activos.reduce((s, e) => s + e.montoPrestado, 0);
  const totalLiquidar = activos.reduce((s, e) => s + calcularLiquidacion(e).totalDesempeno, 0);
  const totalPagado = pagos.reduce((s, m) => s + m.monto, 0);

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();
  const oro = rgb(0.706, 0.325, 0.035);
  const gris = rgb(0.45, 0.43, 0.41);
  const negro = rgb(0.1, 0.09, 0.09);
  let y = 800;

  page.drawText(EMPRESA.nombre.toUpperCase(), { x: 40, y, size: 16, font: bold, color: oro });
  page.drawText("Estado de cuenta", { x: 40, y: y - 15, size: 10, font, color: gris });
  page.drawText(fecha(new Date().toISOString()), { x: width - 110, y, size: 10, font, color: gris });
  y -= 34;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1.5, color: oro });
  y -= 22;

  page.drawText("Cliente", { x: 40, y, size: 9, font, color: gris });
  y -= 14;
  page.drawText(`${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`, { x: 40, y, size: 12, font: bold, color: negro });
  y -= 14;
  page.drawText(`CURP: ${cliente.curp ?? "—"}   Tel: ${cliente.telefono ?? "—"}`, { x: 40, y, size: 9, font, color: gris });
  y -= 26;

  // Tabla de empeños
  page.drawText("EMPEÑOS", { x: 40, y, size: 10, font: bold, color: negro });
  y -= 16;
  const cols = [40, 110, 250, 330, 410, 500];
  const head = ["Folio", "Prenda", "Inicio", "Estado", "Préstamo", "A liquidar"];
  head.forEach((h, i) => page.drawText(h, { x: cols[i], y, size: 8, font: bold, color: gris }));
  y -= 6;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.6, color: gris });
  y -= 14;

  for (const e of empenos) {
    if (y < 120) break;
    const calc = calcularLiquidacion(e);
    const activo = e.estado === "activo" || e.estado === "refrendado";
    const fila = [
      e.folio,
      e.prenda.descripcion.slice(0, 22),
      fecha(e.fechaInicio),
      estadoLabel[e.estado] ?? e.estado,
      mxn.format(e.montoPrestado),
      activo ? mxn.format(calc.totalDesempeno) : "—",
    ];
    fila.forEach((c, i) => page.drawText(c, { x: cols[i], y, size: 8.5, font, color: negro }));
    y -= 16;
  }

  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.6, color: gris });
  y -= 20;

  // Totales
  const tot = (label: string, val: string, c = negro) => {
    page.drawText(label, { x: 330, y, size: 9, font, color: gris });
    const w = bold.widthOfTextAtSize(val, 11);
    page.drawText(val, { x: width - 40 - w, y, size: 11, font: bold, color: c });
    y -= 18;
  };
  tot("Capital vigente:", mxn.format(capitalVigente));
  tot("Total a liquidar:", mxn.format(totalLiquidar), oro);
  tot("Total pagado (histórico):", mxn.format(totalPagado), rgb(0.08, 0.5, 0.24));

  y -= 12;
  page.drawText("Documento informativo. No es un comprobante fiscal.", { x: 40, y, size: 8, font, color: gris });

  const bytes = await doc.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="estado-${cliente.apellidoPaterno}-${id.slice(0, 6)}.pdf"`,
    },
  });
}
