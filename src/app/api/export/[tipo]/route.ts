import { listarEmpenos, listarMovimientos, listarClientes, listarPrendas, listarPagos, listarVentas, listarCotizaciones } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { calcularReporteSemanal, rangoSemanaActual } from "@/lib/reporteSemanal";
import { getUsuarioActual } from "@/lib/session";
import { puedeAcceder } from "@/lib/auth";

function csv(rows: (string | number | null)[][]): string {
  const esc = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

// El middleware exime a /api/* del control de rol por página (cada endpoint
// gestiona el suyo). Este mapa refleja desde qué página se ofrece cada
// descarga: si el rol no puede ver esa página, tampoco puede pedir el CSV
// directo — evita que un rol sin acceso a /reportes (cajero, cobranza, etc.)
// baje datos financieros completos saltándose la UI.
const RUTA_REQUERIDA: Record<string, string> = {
  empenos: "/reportes",
  caja: "/reportes",
  movimientos: "/reportes",
  pagos: "/reportes",
  clientes: "/reportes",
  prendas: "/reportes",
  semanal: "/",
  cotizaciones: "/cotizaciones",
};

export async function GET(req: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;

  const actual = await getUsuarioActual();
  if (!actual) return new Response("No autorizado", { status: 401 });
  const rutaRequerida = RUTA_REQUERIDA[tipo];
  if (!rutaRequerida || !puedeAcceder(actual.rol, rutaRequerida)) {
    return new Response("No autorizado", { status: 403 });
  }

  const q = (new URL(req.url).searchParams.get("q") ?? "").toLowerCase().trim();
  const match = (s: string) => !q || s.toLowerCase().includes(q);

  let rows: (string | number | null)[][] = [];
  let nombre = tipo;

  if (tipo === "empenos") {
    nombre = "empenos";
    const e = await listarEmpenos();
    rows = [["Contrato", "Cliente", "Prenda", "Departamento", "Prestado", "Interes%", "Almacenaje%", "IVA%", "Metodo", "Inicio", "Vence", "Estado", "A liquidar"]];
    for (const x of e) {
      const nombreCli = `${x.cliente.nombre} ${x.cliente.apellidoPaterno} ${x.cliente.apellidoMaterno}`;
      if (!match(`${x.folio} ${nombreCli} ${x.prenda.descripcion} ${x.estado}`)) continue;
      const c = calcularLiquidacion(x);
      rows.push([x.folio, nombreCli, x.prenda.descripcion, x.prenda.categoria, x.montoPrestado, x.tasaInteres, x.almacenajePct, x.ivaPct, x.metodoPago, x.fechaInicio, x.fechaVencimiento, x.estado, c.totalDesempeno]);
    }
  } else if (tipo === "movimientos" || tipo === "caja") {
    nombre = "caja";
    const m = await listarMovimientos();
    rows = [["Fecha", "Tipo", "Concepto", "Entrada/Salida", "Monto", "Referencia"]];
    for (const x of m) {
      if (!match(`${x.concepto} ${x.tipo} ${x.referencia ?? ""}`)) continue;
      rows.push([x.fecha, x.tipo, x.concepto, x.esEntrada ? "Entrada" : "Salida", x.monto, x.referencia]);
    }
  } else if (tipo === "clientes") {
    const c = await listarClientes();
    rows = [["Nombre", "CURP", "RFC", "Telefono", "Identificacion", "Numero", "Direccion"]];
    for (const x of c) {
      const nombreCli = `${x.nombre} ${x.apellidoPaterno} ${x.apellidoMaterno}`;
      if (!match(`${nombreCli} ${x.curp ?? ""} ${x.telefono ?? ""}`)) continue;
      rows.push([nombreCli, x.curp, x.rfc, x.telefono, x.tipoIdentificacion, x.numeroIdentificacion, x.direccion]);
    }
  } else if (tipo === "prendas") {
    const p = await listarPrendas();
    rows = [["Folio", "Descripcion", "Departamento", "Marca", "Modelo", "Serie", "Avaluo", "Estado", "Resguardo"]];
    for (const x of p) {
      if (!match(`${x.folio} ${x.descripcion} ${x.marca ?? ""} ${x.categoria}`)) continue;
      rows.push([x.folio, x.descripcion, x.categoria, x.marca, x.modelo, x.serie, x.valorAvaluo, x.estado, x.ubicacionResguardo]);
    }
  } else if (tipo === "pagos") {
    const pg = await listarPagos();
    rows = [["Recibo", "Refrendo No", "Tipo", "Fecha", "Intereses", "Almacenaje", "Moratorios", "IVA", "Abono capital", "Total", "Metodo", "Usuario"]];
    for (const x of pg) {
      rows.push([x.reciboNo, x.refrendoNo, x.tipo, x.fecha, x.intereses, x.almacenaje, x.moratorios, x.iva, x.abonoCapital, x.total, x.metodoPago, x.usuarioNombre]);
    }
  } else if (tipo === "semanal") {
    nombre = "reporte-semanal";
    const [empenos, pagos, ventas] = await Promise.all([listarEmpenos(), listarPagos(), listarVentas()]);
    const { desde, hasta } = rangoSemanaActual();
    const r = calcularReporteSemanal(empenos, pagos, ventas, desde, hasta);
    rows = [
      [`Información semanal casa empeño (${desde} a ${hasta})`, "", ""],
      ["Descripción", "Total", "Comentarios"],
      ["Ventas de vitrina", r.ventasVitrina, ""],
      ["Vehículos", "", ""],
      ["Empeños", r.vehiculos.empenos, ""],
      ["Refrendos", r.vehiculos.refrendos, ""],
      ["Desempeños", r.vehiculos.desempenos, ""],
      ["Artículos", "", ""],
      ["Empeños", r.articulos.empenos, ""],
      ["Refrendos", r.articulos.refrendos, ""],
      ["Desempeños", r.articulos.desempenos, ""],
    ];
  } else if (tipo === "cotizaciones") {
    nombre = "cotizaciones";
    const cot = await listarCotizaciones();
    const cab = ["#", "Bien", "Año", "Fecha", "Monto solicitado", "Monto a prestar", "Busqueda Facebook", "¿Se empeñó?", "Motivo (si no)", "Contacto"];
    const seEmp = (v: boolean | null) => (v === null ? "Pendiente" : v ? "Sí" : "No");
    const bloque = (titulo: string, lista: typeof cot) => {
      const r: (string | number | null)[][] = [[titulo, "", "", "", "", "", "", "", "", ""], cab];
      lista.forEach((c, i) => {
        if (!match(`${c.descripcion} ${c.folio} ${c.contacto ?? ""}`)) return;
        r.push([i + 1, c.descripcion, c.modelo, c.creadoEn.slice(0, 10), c.montoSolicitado, c.prestamoOfrecido, c.busquedaFacebook, seEmp(c.seEmpeno), c.motivoNo, c.contacto]);
      });
      return r;
    };
    rows = [
      ...bloque("DETALLES DEL VEHÍCULO", cot.filter((c) => c.tipo === "vehiculo")),
      ["", "", "", "", "", "", "", "", "", ""],
      ...bloque("DETALLES DEL ARTÍCULO", cot.filter((c) => c.tipo !== "vehiculo")),
    ];
  } else {
    return new Response("Tipo no válido", { status: 400 });
  }

  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}.csv"`,
    },
  });
}
