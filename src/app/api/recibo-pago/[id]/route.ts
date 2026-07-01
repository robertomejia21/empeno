import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { obtenerPago, obtenerEmpeno } from "@/lib/db/repo";
import { EMPRESA } from "@/lib/compliance";

const mxn = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  }).format(new Date(iso));

const tituloTipo: Record<string, string> = { refrendo: "REFRENDO", abono: "ABONO", desempeno: "DESEMPEÑO" };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pago = await obtenerPago(id);
  if (!pago) return new Response("No encontrado", { status: 404 });
  const emp = await obtenerEmpeno(pago.empenoId);

  const W = 300;
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, 780]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const negro = rgb(0.1, 0.09, 0.09);
  const gris = rgb(0.4, 0.4, 0.4);
  let y = 758;

  const center = (t: string, size: number, f = font, color = negro) => {
    const w = f.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (W - w) / 2, y, size, font: f, color });
    y -= size + 3;
  };
  const left = (t: string, size = 8, f = font) => { page.drawText(t, { x: 14, y, size, font: f, color: negro }); };
  const row = (label: string, val: string, f = font) => {
    page.drawText(label, { x: 14, y, size: 8.5, font, color: negro });
    const w = f.widthOfTextAtSize(val, 8.5);
    page.drawText(val, { x: W - 14 - w, y, size: 8.5, font: f, color: negro });
    y -= 13;
  };
  const dashed = () => { page.drawText("- ".repeat(24), { x: 14, y: y + 2, size: 7, font, color: gris }); y -= 8; };

  // Encabezado
  center(EMPRESA.nombre.toUpperCase(), 12, bold);
  center("SUCURSAL: MATRIZ", 8);
  center(EMPRESA.razonSocial, 7, font, gris);
  center(`R.F.C.: ${EMPRESA.rfc}`, 7, font, gris);
  y -= 4;
  center(tituloTipo[pago.tipo] ?? "PAGO", 13, bold);
  y -= 2;

  left(`CONTRATO No.: ${emp?.folio ?? "—"}`, 9, bold); y -= 13;
  left(`RECIBO No.: ${pago.reciboNo}`); y -= 12;
  if (pago.tipo === "refrendo") { left(`REFRENDO No.: ${pago.refrendoNo}`); y -= 12; }
  left(`FECHA: ${fechaHora(pago.fecha)}`); y -= 12;
  left(`CLIENTE: ${emp ? `${emp.cliente.nombre} ${emp.cliente.apellidoPaterno} ${emp.cliente.apellidoMaterno}` : "—"}`); y -= 16;

  // Conceptos
  const conceptos: [string, number][] = [
    ["ABONO CAPITAL:", pago.abonoCapital],
    ["INTERESES:", pago.intereses],
    ["ALMACENAJE:", pago.almacenaje],
    ["GASTOS ADMIN.:", pago.gastosAdmin],
    ["MORATORIOS:", pago.moratorios],
    ["RENTA GPS:", pago.rentaGps],
    ["RENTA SEGURO:", pago.rentaSeguro],
    ["GASTOS VENTA:", pago.gastosVenta],
    ["PENSIÓN:", pago.pension],
    ["IVA:", pago.iva],
  ];
  for (const [l, v] of conceptos) row(l, mxn.format(v));

  dashed();
  row("SUBTOTAL:", mxn.format(pago.subtotal), bold);
  row("DESCUENTO:", mxn.format(pago.descuento));
  dashed();
  page.drawText("TOTAL:", { x: 14, y, size: 12, font: bold, color: negro });
  const tw = bold.widthOfTextAtSize(mxn.format(pago.total), 12);
  page.drawText(mxn.format(pago.total), { x: W - 14 - tw, y, size: 12, font: bold, color: negro });
  y -= 18;

  row("EFECTIVO:", mxn.format(pago.efectivo));
  row("TARJETA:", mxn.format(pago.tarjeta));
  row("TRANSFERENCIA:", mxn.format(pago.transferencia));
  row("CAMBIO:", mxn.format(pago.cambio), bold);
  y -= 8;
  left(`USUARIO: ${pago.usuarioNombre ?? "—"}`, 7, font); y -= 20;

  center("¡GRACIAS POR SU PREFERENCIA!", 8, bold);
  center("VUELVA PRONTO", 7, font, gris);

  const bytes = await doc.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${pago.reciboNo}.pdf"`,
    },
  });
}
