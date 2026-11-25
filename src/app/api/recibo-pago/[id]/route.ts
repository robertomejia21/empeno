import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { obtenerPago, obtenerEmpeno, obtenerAjustes, listarPagosEmpeno } from "@/lib/db/repo";
import { calcularVencimiento, cargosPeriodo } from "@/lib/interes";
import { textoHorarioCorto } from "@/lib/ajustesBase";
import { EMPRESA } from "@/lib/compliance";
import { getUsuarioActual } from "@/lib/session";

const mxn = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  }).format(new Date(iso));

const tituloTipo: Record<string, string> = { refrendo: "REFRENDO", abono: "ABONO AL REFRENDO", desempeno: "DESEMPEÑO" };
const fechaCorta = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso.length === 10 ? iso + "T12:00:00" : iso));

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actual = await getUsuarioActual();
  if (!actual || actual.rol === "mecanico") return new Response("No autorizado", { status: 401 });
  const { id } = await params;
  const pago = await obtenerPago(id);
  if (!pago) return new Response("No encontrado", { status: 404 });
  const [emp, ajustes, pagosEmp] = await Promise.all([obtenerEmpeno(pago.empenoId), obtenerAjustes(), listarPagosEmpeno(pago.empenoId)]);
  // Abonos parciales ligados al mismo refrendo (anteriores a este recibo).
  const abonosPrevios = pagosEmp
    .filter((p) => p.tipo === "abono" && p.refrendoNo === pago.refrendoNo && p.id !== pago.id && p.fecha <= pago.fecha)
    .reduce((s, p) => s + p.total, 0);
  // En desempeño se descuentan los abonos al refrendo que estaba pendiente.
  const refrendosPrevios = pagosEmp.filter((p) => p.tipo === "refrendo" && p.fecha <= pago.fecha).length;
  const abonosRefrendoDesempeno = pagosEmp
    .filter((p) => p.tipo === "abono" && p.refrendoNo === refrendosPrevios + 1 && p.fecha <= pago.fecha)
    .reduce((s, p) => s + p.total, 0);

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

  // Logo: cubo isométrico de la marca. Trazado, no imagen, para que salga
  // nítido en la impresora térmica sin depender de escala de grises.
  const LOGO = 0.6; // escala sobre el viewBox de 48px
  const logoX = (W - 48 * LOGO) / 2;
  for (const d of [
    "M24 4 L42 13.5 L24 23 L6 13.5 Z", // cara superior
    "M6 13.5 L24 23 L24 44 L6 34.5 Z", // cara izquierda
    "M42 13.5 L24 23 L24 44 L42 34.5 Z", // cara derecha
  ]) {
    page.drawSvgPath(d, { x: logoX, y, scale: LOGO, borderColor: negro, borderWidth: 1.1 });
  }
  // El cubo baja hasta y-44*LOGO; el nombre necesita hueco para su ascendente.
  y -= 44 * LOGO + 16;

  // Encabezado
  center(EMPRESA.nombre.toUpperCase(), 12, bold);
  center(`SUCURSAL: ${EMPRESA.sucursal}`, 8);
  center(EMPRESA.direccion.toUpperCase(), 7, font, gris);
  center(`${EMPRESA.colonia.toUpperCase()}, C.P.: ${EMPRESA.cp}`, 7, font, gris);
  center(`R.F.C.: ${EMPRESA.rfc}  TEL.: ${EMPRESA.telefono}`, 7, font, gris);
  center(`HORARIO: ${textoHorarioCorto(ajustes.horario)}`, 6.5, font, gris);
  y -= 4;
  center(tituloTipo[pago.tipo] ?? "PAGO", 13, bold);
  y -= 2;

  const esAbono = pago.tipo === "abono";
  left(`CONTRATO No.: ${emp?.folio ?? "—"}`, 9, bold); y -= 13;
  left(`RECIBO No.: ${pago.reciboNo}`); y -= 12;
  if (pago.tipo === "refrendo") { left(`REFRENDO No.: ${pago.refrendoNo}`); y -= 12; }
  if (esAbono) { left(`APLICADO AL REFRENDO No.: ${pago.refrendoNo}`); y -= 12; }
  left(`FECHA: ${fechaHora(pago.fecha)}`); y -= 12;
  left(`CLIENTE: ${emp ? `${emp.cliente.nombre} ${emp.cliente.apellidoPaterno} ${emp.cliente.apellidoMaterno}` : "—"}`); y -= 16;

  // En el ticket en papel los importes en cero se dejan en blanco.
  const imp = (v: number) => (v > 0 ? mxn.format(v) : "");
  const esDesempeno = pago.tipo === "desempeno";
  const box = (lineas: string[], size = 7.5) => {
    const alto = lineas.length * (size + 3) + 8;
    page.drawRectangle({ x: 12, y: y - alto + size + 2, width: W - 24, height: alto, borderColor: negro, borderWidth: 1 });
    y -= 3;
    for (const l of lineas) center(l, size, bold);
    y -= 7;
  };

  if (esAbono) {
    // ---- ABONO PARCIAL: deja claro que NO es el refrendo completo ----
    const saldoAntes = pago.subtotal;
    const saldoDespues = Math.max(0, Math.round((saldoAntes - pago.total) * 100) / 100);
    const deudaTotal = saldoAntes + abonosPrevios;
    const cargos = emp ? cargosPeriodo(emp) : { interes: 0, almacenaje: 0, iva: 0 };
    const moratoriosDeuda = Math.max(0, Math.round((deudaTotal - cargos.interes - cargos.almacenaje - cargos.iva) * 100) / 100);
    const protegeHasta = emp ? calcularVencimiento(emp.fechaVencimiento, emp.periodo, emp.plazoPeriodos) : null;

    box(["ESTE PAGO ES SOLO UN ABONO (PAGO PARCIAL)", "NO CUBRE EL REFRENDO COMPLETO", "NO RENUEVA EL PERIODO DEL CONTRATO"]);

    left("DEUDA DEL REFRENDO", 8, bold); y -= 12;
    row("INTERESES:", mxn.format(cargos.interes));
    row("ALMACENAJE:", mxn.format(cargos.almacenaje));
    row("IVA:", mxn.format(cargos.iva));
    row("MORATORIOS:", mxn.format(moratoriosDeuda));
    dashed();
    row("TOTAL DEL REFRENDO:", mxn.format(deudaTotal), bold);
    if (abonosPrevios > 0) row("ABONOS ANTERIORES:", `- ${mxn.format(abonosPrevios)}`);
    row("SALDO ANTES DE ESTE ABONO:", mxn.format(saldoAntes), bold);
    y -= 4;

    left("APLICACIÓN DE ESTE ABONO", 8, bold); y -= 12;
    row("A MORATORIOS:", imp(pago.moratorios));
    row("A INTERESES:", imp(pago.intereses));
    row("A ALMACENAJE:", imp(pago.almacenaje));
    row("A IVA:", imp(pago.iva));
    dashed();
    page.drawText("ABONO:", { x: 14, y, size: 12, font: bold, color: negro });
    const aw = bold.widthOfTextAtSize(mxn.format(pago.total), 12);
    page.drawText(mxn.format(pago.total), { x: W - 14 - aw, y, size: 12, font: bold, color: negro });
    y -= 18;

    row("EFECTIVO RECIBIDO:", imp(pago.efectivo + pago.cambio));
    row("TARJETA:", imp(pago.tarjeta));
    row("TRANSFERENCIA:", imp(pago.transferencia));
    row("CAMBIO:", mxn.format(pago.cambio));
    dashed();
    page.drawText("SALDO PENDIENTE:", { x: 14, y, size: 11, font: bold, color: negro });
    const sw = bold.widthOfTextAtSize(mxn.format(saldoDespues), 11);
    page.drawText(mxn.format(saldoDespues), { x: W - 14 - sw, y, size: 11, font: bold, color: negro });
    y -= 18;

    if (protegeHasta) {
      box([
        `PRENDA PROTEGIDA DE REMATE HASTA EL ${fechaCorta(protegeHasta).toUpperCase()}`,
        "CUBRA EL SALDO ANTES DE ESA FECHA PARA",
        "COMPLETAR EL REFRENDO. LOS MORATORIOS SIGUEN",
        "APLICANDO CONFORME A LAS REGLAS DEL CONTRATO.",
      ], 6.5);
    }
  } else {
    // En desempeño se liquida el préstamo íntegro y los abonos previos se restan abajo;
    // en refrendo el abono a capital es un cargo más de la exhibición.
    if (pago.tipo === "refrendo") {
      center(abonosPrevios > 0 ? "PAGO QUE COMPLETA EL REFRENDO" : "PAGO COMPLETO DEL REFRENDO", 7.5, bold);
      y -= 2;
    }
    const conceptos: [string, number][] = [
      esDesempeno
        ? ["PRÉSTAMO:", emp?.montoPrestado ?? 0]
        : ["ABONO CAPITAL:", pago.abonoCapital],
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
    for (const [l, v] of conceptos) row(l, imp(v));

    dashed();
    row("SUBTOTAL:", mxn.format(pago.subtotal), bold);
    if (esDesempeno) row("ABONOS A CAPITAL:", imp(pago.abonoCapital));
    if (esDesempeno && abonosRefrendoDesempeno > 0) row("ABONOS AL REFRENDO:", `- ${mxn.format(abonosRefrendoDesempeno)}`);
    if (pago.tipo === "refrendo" && abonosPrevios > 0) row("ABONOS PREVIOS AL REFRENDO:", `- ${mxn.format(abonosPrevios)}`);
    row("DESCUENTO:", imp(pago.descuento));
    dashed();
    page.drawText("TOTAL:", { x: 14, y, size: 12, font: bold, color: negro });
    const tw = bold.widthOfTextAtSize(mxn.format(pago.total), 12);
    page.drawText(mxn.format(pago.total), { x: W - 14 - tw, y, size: 12, font: bold, color: negro });
    y -= 18;

    row("EFECTIVO RECIBIDO:", imp(pago.efectivo + pago.cambio));
    row("TARJETA:", imp(pago.tarjeta));
    row("TRANSFERENCIA:", imp(pago.transferencia));
    row("CAMBIO:", mxn.format(pago.cambio), bold);
  }
  y -= 8;
  left(`USUARIO: ${(pago.usuarioNombre ?? "—").toUpperCase()}`, 7, font); y -= 10;
  left(`CAJA: ${EMPRESA.sucursal}`, 7, font); y -= 20;

  center("¡GRACIAS POR TU PREFERENCIA,", 8, bold);
  center("VUELVA PRONTO!", 8, bold);
  center(`${EMPRESA.nombre.toUpperCase()} ${EMPRESA.sucursal}`, 7, font, gris);

  const bytes = await doc.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${pago.reciboNo}.pdf"`,
    },
  });
}
