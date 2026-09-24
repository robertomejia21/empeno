"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  Cliente,
  Prenda,
  Empeno,
  MovimientoCaja,
  TipoIdentificacion,
  CategoriaPrenda,
  PeriodoInteres,
  TipoMovimiento,
  EmpenoGuiadoPayload,
  Venta,
  MetodoPago,
  Compra,
  Apartado,
  CorteCaja,
  Resguardo,
  Cotizacion,
  CotizacionInput,
  EstadoCotizacion,
  Autorizacion,
  AutorizacionInput,
  CitaGps,
  CitaGpsInput,
  EstadoCitaGps,
  EncuestaInput,
  RolUsuario,
} from "@/lib/types";
import { getStore, nuevoId, siguienteFolio } from "@/lib/db/store";
import { calcularVencimiento, calcularLiquidacion, requiereAutorizacionTasa, TASA_MINIMA_LIBRE, IVA_FIJO } from "@/lib/interes";
import { supabaseConfigured, getServerSupabase } from "@/lib/supabase/server";
import { bitacoraAuto } from "@/lib/bitacora";
import { obtenerEmpeno, obtenerPrenda, listarEmpenos, listarMovimientos, contarRefrendos, listarCitasGps, obtenerCotizacion } from "@/lib/db/repo";
import { enviarWhatsApp, enviarWhatsAppMedia, formatearNumeroMX } from "@/lib/whatsapp";
import { limitadoPorIP } from "@/lib/rateLimit";
import { SUCURSAL, APP_URL } from "@/lib/negocio";
import { formatMXN, formatFecha, hoyISO } from "@/lib/format";
import { getUsuarioActual } from "@/lib/session";
import { RESGUARDO_VACIO, resumenResguardo } from "@/lib/resguardo";
import { CAMPOS_VEHICULO_VACIOS } from "@/lib/prenda";
import { extraerDatosINE, extraerDatosVehiculo, type ResultadoINE, type ResultadoVehiculo } from "@/lib/gemini";

function dividirDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  return m ? { mime: m[1], base64: m[2] } : null;
}

/** En modo demo (invitado) las operaciones de escritura no surten efecto. */
async function esInvitado(): Promise<boolean> {
  return (await getUsuarioActual())?.rol === "invitado";
}

/** Tope de descuento sin autorización adicional (% del subtotal). */
const DESCUENTO_TOPE_LIBRE = 20;
/** Tope absoluto de descuento, incluso con autorización de gerencia. */
const DESCUENTO_TOPE_GERENCIA = 50;

/**
 * Valida el % de descuento contra el subtotal: hasta 20% cualquier rol,
 * hasta 50% solo Dirección General o Gerente; más de 50% nunca se permite.
 */
function validarDescuento(descuento: number, subtotal: number, rol: RolUsuario | undefined): void {
  if (descuento <= 0 || subtotal <= 0) return;
  const pct = (descuento / subtotal) * 100;
  if (pct > DESCUENTO_TOPE_GERENCIA) {
    throw new Error(`El descuento no puede superar el ${DESCUENTO_TOPE_GERENCIA}% del subtotal.`);
  }
  if (pct > DESCUENTO_TOPE_LIBRE && rol !== "admin" && rol !== "gerente") {
    throw new Error(`Descuentos de más del ${DESCUENTO_TOPE_LIBRE}% requieren autorización de Gerencia o Dirección General.`);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Ley antilavado: ninguna entrada/salida de caja debe superar $999,999. */
const TOPE_AML = 999999;
function dividirMontoAML(total: number): number[] {
  if (total <= TOPE_AML) return [round2(total)];
  const partes: number[] = [];
  let resto = round2(total);
  while (resto > 0.009) {
    const parte = Math.min(resto, TOPE_AML);
    partes.push(round2(parte));
    resto = round2(resto - parte);
  }
  return partes;
}

function s(form: FormData, key: string): string {
  return (form.get(key) as string | null)?.trim() ?? "";
}
function sn(form: FormData, key: string): string | null {
  const v = s(form, key);
  return v === "" ? null : v;
}
function num(form: FormData, key: string): number {
  const v = parseFloat(s(form, key).replace(/,/g, ""));
  return Number.isFinite(v) ? v : 0;
}

/** Registra la salida de caja del préstamo (dividida por tope antilavado). */
async function registrarSalidaPrestamo(empenoId: string, folio: string, monto: number) {
  const partes = dividirMontoAML(monto);
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    for (let i = 0; i < partes.length; i++) {
      await sb.from("movimientos_caja").insert({
        tipo: "prestamo",
        monto: partes[i],
        es_entrada: false,
        concepto: `Préstamo empeño ${folio}${partes.length > 1 ? ` (parte ${i + 1}/${partes.length})` : ""}`,
        empeno_id: empenoId,
        referencia: folio,
      });
    }
  } else {
    const store = getStore();
    partes.forEach((m, i, arr) =>
      store.movimientos.push({
        id: nuevoId("m"),
        fecha: new Date().toISOString(),
        tipo: "prestamo",
        monto: m,
        esEntrada: false,
        concepto: `Préstamo empeño ${folio}${arr.length > 1 ? ` (parte ${i + 1}/${arr.length})` : ""}`,
        empenoId,
        referencia: folio,
        creadoEn: new Date().toISOString(),
      })
    );
  }
}

// ----------------- CLIENTES -----------------

export async function crearCliente(form: FormData) {
  if (await esInvitado()) return;
  const datos = {
    nombre: s(form, "nombre"),
    apellido_paterno: s(form, "apellidoPaterno"),
    apellido_materno: s(form, "apellidoMaterno"),
    curp: sn(form, "curp"),
    rfc: sn(form, "rfc"),
    telefono: sn(form, "telefono"),
    email: sn(form, "email"),
    tipo_identificacion: s(form, "tipoIdentificacion") || "INE",
    numero_identificacion: s(form, "numeroIdentificacion"),
    direccion: sn(form, "direccion"),
    fecha_nacimiento: sn(form, "fechaNacimiento"),
    foto: sn(form, "fotoCliente"),
    notas: sn(form, "notas"),
  };

  if (supabaseConfigured) {
    const { error } = await getServerSupabase().from("clientes").insert(datos);
    if (error) throw error;
  } else {
    const store = getStore();
    const cliente: Cliente = {
      id: nuevoId("c"),
      nombre: datos.nombre,
      apellidoPaterno: datos.apellido_paterno,
      apellidoMaterno: datos.apellido_materno,
      curp: datos.curp,
      rfc: datos.rfc,
      telefono: datos.telefono,
      email: datos.email,
      tipoIdentificacion: datos.tipo_identificacion as TipoIdentificacion,
      numeroIdentificacion: datos.numero_identificacion,
      direccion: datos.direccion,
      fechaNacimiento: datos.fecha_nacimiento,
      foto: datos.foto,
      notas: datos.notas,
      creadoEn: new Date().toISOString(),
    };
    store.clientes.push(cliente);
  }
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function actualizarCliente(id: string, form: FormData) {
  if (await esInvitado()) return;
  const datos = {
    nombre: s(form, "nombre"),
    apellido_paterno: s(form, "apellidoPaterno"),
    apellido_materno: s(form, "apellidoMaterno"),
    curp: sn(form, "curp"),
    rfc: sn(form, "rfc"),
    telefono: sn(form, "telefono"),
    email: sn(form, "email"),
    tipo_identificacion: s(form, "tipoIdentificacion") || "INE",
    numero_identificacion: s(form, "numeroIdentificacion"),
    direccion: sn(form, "direccion"),
    fecha_nacimiento: sn(form, "fechaNacimiento"),
    notas: sn(form, "notas"),
  };
  if (supabaseConfigured) {
    const { error } = await getServerSupabase().from("clientes").update(datos).eq("id", id);
    if (error) throw error;
  } else {
    const c = getStore().clientes.find((x) => x.id === id);
    if (c)
      Object.assign(c, {
        nombre: datos.nombre,
        apellidoPaterno: datos.apellido_paterno,
        apellidoMaterno: datos.apellido_materno,
        curp: datos.curp,
        rfc: datos.rfc,
        telefono: datos.telefono,
        email: datos.email,
        tipoIdentificacion: datos.tipo_identificacion as TipoIdentificacion,
        numeroIdentificacion: datos.numero_identificacion,
        direccion: datos.direccion,
        fechaNacimiento: datos.fecha_nacimiento,
        notas: datos.notas,
      });
  }
  revalidatePath("/clientes");
  redirect(`/clientes/${id}`);
}

// ----------------- INE / FOTO DE CLIENTE (IA) -----------------

/** Lee una INE (imagen dataURL) con IA y devuelve los datos para autollenar. */
export async function analizarINE(dataUrl: string): Promise<ResultadoINE> {
  if (await esInvitado()) {
    return { ok: false, error: "En la demo de sólo lectura no se procesan identificaciones." };
  }
  const p = dividirDataUrl(dataUrl);
  if (!p) return { ok: false, error: "El archivo no es una imagen válida." };
  return extraerDatosINE(p.base64, p.mime);
}

/** Lee un documento del vehículo (tarjeta de circulación/factura) y autollena. */
export async function analizarVehiculo(dataUrl: string): Promise<ResultadoVehiculo> {
  if (await esInvitado()) {
    return { ok: false, error: "En la demo de sólo lectura no se procesan documentos." };
  }
  const p = dividirDataUrl(dataUrl);
  if (!p) return { ok: false, error: "El archivo no es una imagen válida." };
  return extraerDatosVehiculo(p.base64, p.mime);
}

/** Sube una foto o documento del bien (empeño) al Storage y devuelve su URL. */
export async function subirArchivoPrenda(dataUrl: string): Promise<string | null> {
  if (await esInvitado()) return null;
  const p = dividirDataUrl(dataUrl);
  if (!p || !supabaseConfigured) return null;
  const sb = getServerSupabase();
  const ext = (p.mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = `empenos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage
    .from("prendas")
    .upload(path, Buffer.from(p.base64, "base64"), { contentType: p.mime, upsert: false });
  if (error) return null;
  return sb.storage.from("prendas").getPublicUrl(path).data.publicUrl;
}

/** Sube una foto del auto lavado, la guarda en la prenda y la envía al cliente por WhatsApp. */
export async function subirYEnviarFotoLavado(empenoId: string, dataUrl: string): Promise<{ ok: boolean }> {
  if (await esInvitado()) return { ok: false };
  const url = await subirArchivoPrenda(dataUrl);
  if (!url) return { ok: false };
  const e = await obtenerEmpeno(empenoId);
  if (!e) return { ok: false };
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data } = await sb.from("prendas").select("fotos").eq("id", e.prendaId).single();
    const fotos = [...(((data?.fotos as string[]) ?? [])), url];
    await sb.from("prendas").update({ fotos }).eq("id", e.prendaId);
  } else {
    const p = getStore().prendas.find((x) => x.id === e.prendaId);
    if (p) p.fotos = [...p.fotos, url];
  }
  const r = await enviarWhatsAppMedia(
    e.cliente.telefono,
    url,
    `Hola ${e.cliente.nombre}, foto de tu vehículo (${e.prenda.marca ?? "auto"}) en resguardo — contrato ${e.folio}.`
  );
  await bitacoraAuto("Foto del auto lavado enviada al cliente", null, e.folio);
  revalidatePath(`/empenos/${empenoId}`);
  return { ok: r.ok };
}

/** Sube la foto del cliente al Storage y devuelve su URL pública. */
export async function subirFotoCliente(dataUrl: string): Promise<string | null> {
  if (await esInvitado()) return null;
  const p = dividirDataUrl(dataUrl);
  if (!p || !supabaseConfigured) return null;
  const sb = getServerSupabase();
  const ext = p.mime.split("/")[1] || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage
    .from("clientes")
    .upload(path, Buffer.from(p.base64, "base64"), { contentType: p.mime, upsert: false });
  if (error) return null;
  return sb.storage.from("clientes").getPublicUrl(path).data.publicUrl;
}

// ----------------- PRENDAS / AVALÚOS -----------------

export async function crearPrenda(form: FormData) {
  if (await esInvitado()) return;
  const valorAvaluo = num(form, "valorAvaluo");
  const sugerido = form.get("montoPrestamoSugerido")
    ? num(form, "montoPrestamoSugerido")
    : Math.round(valorAvaluo * 0.5 * 100) / 100;
  const datos = {
    categoria: s(form, "categoria") || "Otro",
    descripcion: s(form, "descripcion"),
    marca: sn(form, "marca"),
    submarca: sn(form, "submarca"),
    modelo: sn(form, "modelo"),
    color: sn(form, "color"),
    serie: sn(form, "serie"),
    placas: sn(form, "placas"),
    metal: sn(form, "metal"),
    kilataje: sn(form, "kilataje"),
    gramos: form.get("gramos") ? num(form, "gramos") : null,
    valor_avaluo: valorAvaluo,
    monto_prestamo_sugerido: sugerido,
    estado: "en_avaluo",
    ubicacion_resguardo: sn(form, "ubicacionResguardo"),
    seguro: form.get("seguro") ? num(form, "seguro") : null,
    gps: sn(form, "gps"),
    garantia: sn(form, "garantia"),
    verificado: form.get("verificado") === "on",
    repuve_folio: sn(form, "repuveFolio"),
    modalidad: sn(form, "modalidad") as "gps" | "resguardo" | null,
    gps_mensual: form.get("gpsMensual") ? num(form, "gpsMensual") : null,
    gps_ubicacion: sn(form, "gpsUbicacion"),
    // No hay columna para "monto solicitado" — se antepone a las notas para
    // no perder el dato y poder comparar contra el avalúo a simple vista.
    notas: (() => {
      const solicitado = form.get("montoSolicitado") ? num(form, "montoSolicitado") : 0;
      const nota = sn(form, "notas");
      if (solicitado <= 0) return nota;
      const linea = `Monto solicitado por el cliente: ${solicitado.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}`;
      return nota ? `${linea}\n${nota}` : linea;
    })(),
  };

  if (supabaseConfigured) {
    const { error } = await getServerSupabase().from("prendas").insert(datos);
    if (error) throw error;
  } else {
    const store = getStore();
    const prenda: Prenda = {
      id: nuevoId("p"),
      folio: siguienteFolio(store.prendas, "PR"),
      categoria: datos.categoria as CategoriaPrenda,
      descripcion: datos.descripcion,
      marca: datos.marca,
      submarca: datos.submarca,
      modelo: datos.modelo,
      color: datos.color,
      serie: datos.serie,
      placas: datos.placas,
      metal: datos.metal,
      kilataje: datos.kilataje,
      gramos: datos.gramos,
      valorAvaluo,
      montoPrestamoSugerido: sugerido,
      estado: "en_avaluo",
      fotos: [],
      ubicacionResguardo: datos.ubicacion_resguardo,
      resguardo: RESGUARDO_VACIO,
      ...CAMPOS_VEHICULO_VACIOS,
      seguro: datos.seguro,
      gps: datos.gps,
      garantia: datos.garantia,
      verificado: datos.verificado,
      repuveFolio: datos.repuve_folio,
      modalidad: datos.modalidad,
      gpsMensual: datos.gps_mensual,
      gpsUbicacion: datos.gps_ubicacion,
      notas: datos.notas,
      creadoEn: new Date().toISOString(),
    };
    store.prendas.push(prenda);
  }
  revalidatePath("/prendas");
  redirect("/prendas");
}

// ----------------- EMPEÑOS -----------------

export async function crearEmpeno(form: FormData) {
  if (await esInvitado()) return;
  const fechaInicio = s(form, "fechaInicio") || hoyISO();
  const periodo = (s(form, "periodo") || "mensual") as PeriodoInteres;
  const plazoPeriodos = Math.max(1, Math.round(num(form, "plazoPeriodos")) || 1);
  const montoPrestado = num(form, "montoPrestado");
  const prendaId = s(form, "prendaId");
  const clienteId = s(form, "clienteId");
  const tasaInteres = num(form, "tasaInteres");
  // El formulario simple no captura almacenaje: los artículos (todo lo que no
  // sea Vehículos) lo cargan igual al interés (ej. 10.8% + 10.8% = 21.6%
  // mensual); los vehículos no cargan almacenaje por esta vía.
  const prendaCat = (await obtenerPrenda(prendaId))?.categoria;
  const almacenajePctForm = num(form, "almacenajePct");
  const almacenajePct = almacenajePctForm > 0 ? almacenajePctForm : prendaCat && prendaCat !== "Vehículos" ? tasaInteres : 0;
  // IVA fijo de la sucursal — no se toma del formulario, no es negociable.
  const ivaPct = IVA_FIJO;
  const metodoPago = (s(form, "metodoPago") || "efectivo") as MetodoPago;
  const comisionista = sn(form, "comisionista");
  const centroCosto = sn(form, "centroCosto");
  const realSucursal = form.get("realSucursal") ? num(form, "realSucursal") : null;
  const diasGracia = form.get("diasGracia") ? Math.round(num(form, "diasGracia")) : 7;
  const fechaVencimiento = calcularVencimiento(fechaInicio, periodo, plazoPeriodos);
  const especial = requiereAutorizacionTasa(tasaInteres);
  const estadoInicial = especial ? "borrador" : "activo";

  let empenoId: string;

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data, error } = await sb
      .from("empenos")
      .insert({
        cliente_id: clienteId,
        prenda_id: prendaId,
        monto_prestado: montoPrestado,
        tasa_interes: tasaInteres,
        almacenaje_pct: almacenajePct,
        iva_pct: ivaPct,
        metodo_pago: metodoPago,
        comisionista,
        centro_costo: centroCosto,
        real_sucursal: realSucursal,
        periodo,
        plazo_periodos: plazoPeriodos,
        fecha_inicio: fechaInicio,
        fecha_vencimiento: fechaVencimiento,
        dias_gracia: diasGracia,
        estado: estadoInicial,
        notas: sn(form, "notas"),
      })
      .select("id, folio")
      .single();
    if (error) throw error;
    empenoId = data.id;
    await sb.from("prendas").update({ estado: "empenada" }).eq("id", prendaId);
    if (!especial) {
      await registrarSalidaPrestamo(empenoId, data.folio, montoPrestado);
    } else {
      await solicitarAutorizacion({ tipo: "interes_especial", clienteNombre: null, bien: null, monto: montoPrestado, tasaSolicitada: tasaInteres, tasaEstandar: TASA_MINIMA_LIBRE, motivo: `Empeño ${data.folio} en borrador por tasa especial`, referencia: data.folio, empenoId });
    }
  } else {
    const store = getStore();
    const empeno: Empeno = {
      id: nuevoId("e"),
      folio: siguienteFolio(store.empenos, "EM"),
      clienteId,
      prendaId,
      montoPrestado,
      tasaInteres,
      almacenajePct,
      ivaPct,
      metodoPago,
      abonoCapital: 0,
      comisionista,
      centroCosto,
      realSucursal,
      periodo,
      plazoPeriodos,
      fechaInicio,
      fechaVencimiento,
      diasGracia,
      estado: estadoInicial,
      notas: sn(form, "notas"),
      firmaCliente: null,
      firmaFecha: null,
      creadoEn: new Date().toISOString(),
    };
    store.empenos.push(empeno);
    const prenda = store.prendas.find((p) => p.id === prendaId);
    if (prenda) prenda.estado = "empenada";
    if (!especial) {
      await registrarSalidaPrestamo(empeno.id, empeno.folio, montoPrestado);
    } else {
      await solicitarAutorizacion({ tipo: "interes_especial", clienteNombre: null, bien: null, monto: montoPrestado, tasaSolicitada: tasaInteres, tasaEstandar: TASA_MINIMA_LIBRE, motivo: `Empeño ${empeno.folio} en borrador por tasa especial`, referencia: empeno.folio, empenoId: empeno.id });
    }
    empenoId = empeno.id;
  }

  await bitacoraAuto("Empeño creado", `Préstamo ${montoPrestado} MXN`, null);
  revalidatePath("/empenos");
  revalidatePath("/caja");
  redirect(`/empenos/${empenoId}`);
}

/**
 * Refrendo: el cliente paga intereses/almacenaje/IVA (+ moratorios, abono a
 * capital, descuento), se renueva el periodo y se genera el recibo digital.
 */
export async function refrendarEmpeno(id: string, form?: FormData) {
  if (await esInvitado()) return;
  const e = await obtenerEmpeno(id);
  if (!e) return;

  // Desglose de un periodo
  const interesP = round2(e.montoPrestado * (e.tasaInteres / 100));
  const almacenajeP = round2(e.montoPrestado * (e.almacenajePct / 100));
  const ivaP = round2((interesP + almacenajeP) * (e.ivaPct / 100));

  const g = (k: string) => {
    const v = parseFloat(((form?.get(k) as string) ?? "").replace(/,/g, ""));
    return Number.isFinite(v) ? v : 0;
  };
  const abonoCapital = g("abonoCapital");
  const moratorios = g("moratorios");
  const descuento = g("descuento");
  const gastosAdmin = g("gastosAdmin");
  const metodoPago = ((form?.get("metodoPago") as string) || e.metodoPago || "efectivo") as MetodoPago;

  const subtotal = round2(interesP + almacenajeP + gastosAdmin + moratorios + ivaP);
  const u = await getUsuarioActual();
  validarDescuento(descuento, subtotal, u?.rol);
  const total = round2(Math.max(0, subtotal + abonoCapital - descuento));
  const recibido = g("recibido");
  const efectivo = metodoPago === "efectivo" ? (recibido > 0 ? Math.min(recibido, total) : total) : 0;
  const tarjeta = metodoPago === "tarjeta" ? total : 0;
  const transferencia = metodoPago === "transferencia" || metodoPago === "cheque" ? total : 0;
  const cambio = recibido > total ? round2(recibido - total) : 0;

  const refrendoNo = (await contarRefrendos(id)) + 1;
  const hoy = hoyISO();
  const nuevoVenc = calcularVencimiento(hoy, e.periodo, e.plazoPeriodos);

  const pagoBase = {
    empeno_id: id,
    cliente_id: e.clienteId,
    refrendo_no: refrendoNo,
    tipo: "refrendo",
    abono_capital: abonoCapital,
    intereses: interesP,
    almacenaje: almacenajeP,
    gastos_admin: gastosAdmin,
    moratorios,
    iva: ivaP,
    descuento,
    subtotal,
    total,
    efectivo,
    tarjeta,
    transferencia,
    cambio,
    metodo_pago: metodoPago,
    usuario_nombre: u?.nombre ?? null,
  };

  let pagoId = "";
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: pago, error } = await sb.from("pagos").insert(pagoBase).select("id").single();
    if (error) throw error;
    pagoId = pago.id;
    await sb
      .from("empenos")
      .update({
        fecha_inicio: hoy,
        fecha_vencimiento: nuevoVenc,
        estado: "refrendado",
        abono_capital: e.abonoCapital + abonoCapital,
      })
      .eq("id", id);
    await sb.from("movimientos_caja").insert({
      tipo: "refrendo", monto: total, es_entrada: true,
      concepto: `Refrendo ${e.folio} (recibo)`, empeno_id: id, referencia: e.folio,
    });
  } else {
    const store = getStore();
    pagoId = nuevoId("pg");
    const emp = store.empenos.find((x) => x.id === id);
    if (emp) {
      emp.fechaInicio = hoy;
      emp.fechaVencimiento = nuevoVenc;
      emp.estado = "refrendado";
      emp.abonoCapital += abonoCapital;
    }
    store.pagos.unshift({
      id: pagoId, reciboNo: 2554 + store.pagos.length, refrendoNo, empenoId: id, clienteId: e.clienteId,
      tipo: "refrendo", abonoCapital, intereses: interesP, almacenaje: almacenajeP, gastosAdmin,
      moratorios, rentaGps: 0, rentaSeguro: 0, gastosVenta: 0, pension: 0, iva: ivaP, descuento,
      subtotal, total, efectivo, tarjeta, transferencia, cambio, metodoPago,
      usuarioNombre: u?.nombre ?? null, fecha: new Date().toISOString(), creadoEn: new Date().toISOString(),
    });
    store.movimientos.push({
      id: nuevoId("m"), fecha: new Date().toISOString(), tipo: "refrendo", monto: total, esEntrada: true,
      concepto: `Refrendo ${e.folio} (recibo)`, empenoId: id, referencia: e.folio, creadoEn: new Date().toISOString(),
    });
  }
  await bitacoraAuto("Refrendo registrado", `${total} MXN`, e.folio);
  revalidatePath(`/empenos/${id}`);
  revalidatePath("/empenos");
  revalidatePath("/caja");
  if (e.clienteId) revalidatePath(`/clientes/${e.clienteId}`);
  redirect(`/api/recibo-pago/${pagoId}`);
}

/** Desempeño: el cliente liquida capital + interés y recupera su prenda. */
export async function desempenarEmpeno(id: string, form?: FormData) {
  if (await esInvitado()) return;
  const e = await obtenerEmpeno(id);
  if (!e) return;

  const calc = calcularLiquidacion(e);

  const g = (k: string) => {
    const v = parseFloat(((form?.get(k) as string) ?? "").replace(/,/g, ""));
    return Number.isFinite(v) ? v : 0;
  };
  const moratorios = g("moratorios");
  const gastosAdmin = g("gastosAdmin");
  const rentaGps = g("rentaGps");
  const rentaSeguro = g("rentaSeguro");
  const gastosVenta = g("gastosVenta");
  const pension = g("pension");
  const descuento = g("descuento");
  const metodoPago = ((form?.get("metodoPago") as string) || e.metodoPago || "efectivo") as MetodoPago;

  // El ticket muestra el PRÉSTAMO íntegro y resta los ABONOS a capital por separado,
  // igual que el formato en papel. El neto coincide con el capital pendiente.
  const subtotal = round2(
    e.montoPrestado + calc.interesAcumulado + calc.almacenajeAcumulado +
    gastosAdmin + moratorios + rentaGps + rentaSeguro + gastosVenta + pension + calc.ivaAcumulado
  );
  const u = await getUsuarioActual();
  validarDescuento(descuento, subtotal, u?.rol);
  const total = round2(subtotal - e.abonoCapital - descuento);
  const recibido = g("recibido");
  const efectivo = metodoPago === "efectivo" ? (recibido > 0 ? Math.min(recibido, total) : total) : 0;
  const tarjeta = metodoPago === "tarjeta" ? total : 0;
  const transferencia = metodoPago === "transferencia" || metodoPago === "cheque" ? total : 0;
  const cambio = recibido > total ? round2(recibido - total) : 0;

  const pagoBase = {
    empeno_id: id,
    cliente_id: e.clienteId,
    refrendo_no: 0,
    tipo: "desempeno",
    abono_capital: e.abonoCapital,
    intereses: calc.interesAcumulado,
    almacenaje: calc.almacenajeAcumulado,
    gastos_admin: gastosAdmin,
    moratorios,
    renta_gps: rentaGps,
    renta_seguro: rentaSeguro,
    gastos_venta: gastosVenta,
    pension,
    iva: calc.ivaAcumulado,
    descuento,
    subtotal,
    total,
    efectivo,
    tarjeta,
    transferencia,
    cambio,
    metodo_pago: metodoPago,
    usuario_nombre: u?.nombre ?? null,
  };

  let pagoId = "";
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: pago, error } = await sb.from("pagos").insert(pagoBase).select("id").single();
    if (error) throw error;
    pagoId = pago.id;
    await sb.from("empenos").update({ estado: "desempenado" }).eq("id", id);
    await sb.from("prendas").update({ estado: "desempenada" }).eq("id", e.prendaId);
    await sb.from("movimientos_caja").insert({
      tipo: "desempeno", monto: total, es_entrada: true,
      concepto: `Desempeño empeño ${e.folio}`, empeno_id: id, referencia: e.folio,
    });
  } else {
    const store = getStore();
    pagoId = nuevoId("pg");
    const emp = store.empenos.find((x) => x.id === id);
    if (emp) emp.estado = "desempenado";
    const prenda = store.prendas.find((p) => p.id === e.prendaId);
    if (prenda) prenda.estado = "desempenada";
    store.pagos.unshift({
      id: pagoId, reciboNo: 2554 + store.pagos.length, refrendoNo: 0, empenoId: id, clienteId: e.clienteId,
      tipo: "desempeno", abonoCapital: e.abonoCapital, intereses: calc.interesAcumulado,
      almacenaje: calc.almacenajeAcumulado, gastosAdmin, moratorios, rentaGps, rentaSeguro,
      gastosVenta, pension, iva: calc.ivaAcumulado, descuento,
      subtotal, total, efectivo, tarjeta, transferencia, cambio, metodoPago,
      usuarioNombre: u?.nombre ?? null, fecha: new Date().toISOString(), creadoEn: new Date().toISOString(),
    });
    store.movimientos.push({
      id: nuevoId("m"), fecha: new Date().toISOString(), tipo: "desempeno", monto: total, esEntrada: true,
      concepto: `Desempeño empeño ${e.folio}`, empenoId: e.id, referencia: e.folio, creadoEn: new Date().toISOString(),
    });
  }
  await bitacoraAuto("Desempeño registrado", `${total} MXN`, e.folio);
  revalidatePath(`/empenos/${id}`);
  revalidatePath("/empenos");
  revalidatePath("/caja");
  if (e.clienteId) revalidatePath(`/clientes/${e.clienteId}`);
  redirect(`/api/recibo-pago/${pagoId}`);
}

/**
 * Cancela un contrato que todavía no tiene movimientos (sin refrendos ni
 * abonos) — para corregir un error de captura. Libera la prenda (vuelve a
 * "en_avaluo") y revierte en caja el préstamo que se había entregado.
 * Si ya tiene pagos registrados, usa desempeño en su lugar.
 */
export async function cancelarEmpeno(id: string) {
  if (await esInvitado()) return;
  const e = await obtenerEmpeno(id);
  if (!e) return;
  if (e.estado !== "borrador" && e.estado !== "activo") {
    throw new Error("Solo se puede cancelar un contrato en borrador o activo.");
  }
  const refrendos = await contarRefrendos(id);
  if (e.abonoCapital > 0 || refrendos > 0) {
    throw new Error("Este contrato ya tiene pagos registrados; no se puede cancelar.");
  }

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    await sb.from("empenos").update({ estado: "cancelado" }).eq("id", id);
    await sb.from("prendas").update({ estado: "en_avaluo" }).eq("id", e.prendaId);
    await sb.from("movimientos_caja").insert({
      tipo: "cancelacion", monto: e.montoPrestado, es_entrada: true,
      concepto: `Cancelación empeño ${e.folio}`, empeno_id: id, referencia: e.folio,
    });
  } else {
    const store = getStore();
    const emp = store.empenos.find((x) => x.id === id);
    if (emp) emp.estado = "cancelado";
    const prenda = store.prendas.find((p) => p.id === e.prendaId);
    if (prenda) prenda.estado = "en_avaluo";
    store.movimientos.push({
      id: nuevoId("m"), fecha: new Date().toISOString(), tipo: "cancelacion", monto: e.montoPrestado, esEntrada: true,
      concepto: `Cancelación empeño ${e.folio}`, empenoId: id, referencia: e.folio, creadoEn: new Date().toISOString(),
    });
  }
  await bitacoraAuto("Empeño cancelado", `${e.montoPrestado} MXN revertidos`, e.folio);
  revalidatePath(`/empenos/${id}`);
  revalidatePath("/empenos");
  revalidatePath("/caja");
  if (e.clienteId) revalidatePath(`/clientes/${e.clienteId}`);
  redirect("/empenos");
}

/** Abono a capital: reduce el saldo del préstamo y entra a caja. */
export async function abonarCapital(id: string, form: FormData) {
  if (await esInvitado()) return;
  const monto = num(form, "monto");
  if (monto <= 0) return;

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data, error } = await sb.from("empenos").select("folio, abono_capital").eq("id", id).single();
    if (error) throw error;
    await sb.from("empenos").update({ abono_capital: Number(data.abono_capital ?? 0) + monto }).eq("id", id);
    await sb.from("movimientos_caja").insert({
      tipo: "abono", monto, es_entrada: true, concepto: `Abono a capital ${data.folio}`, empeno_id: id, referencia: data.folio,
    });
  } else {
    const store = getStore();
    const e = store.empenos.find((x) => x.id === id);
    if (!e) return;
    e.abonoCapital += monto;
    store.movimientos.push({
      id: nuevoId("m"), fecha: new Date().toISOString(), tipo: "abono", monto, esEntrada: true,
      concepto: `Abono a capital ${e.folio}`, empenoId: e.id, referencia: e.folio, creadoEn: new Date().toISOString(),
    });
  }
  await bitacoraAuto("Abono a capital", `${monto} MXN`, `empeño ${id}`);
  revalidatePath(`/empenos/${id}`);
  revalidatePath("/caja");
}

/**
 * Flujo guiado (asistente de 9 pasos): crea cliente (si es nuevo), prenda,
 * empeño y el movimiento de caja por la salida del préstamo.
 */
export async function crearEmpenoGuiado(
  data: EmpenoGuiadoPayload
): Promise<{ empenoId: string; folio: string }> {
  if (await esInvitado()) throw new Error("Modo demo: solo lectura, no se puede guardar.");
  const fechaVencimiento = calcularVencimiento(data.fechaInicio, data.periodo, data.plazoPeriodos);
  // Tasa especial (≤ 6.48%): el empeño se crea en BORRADOR hasta que Dirección autorice.
  const especial = requiereAutorizacionTasa(data.tasaInteres);
  const estadoInicial = especial ? "borrador" : "activo";
  const nombreClienteAut = data.clienteNuevo
    ? `${data.clienteNuevo.nombre} ${data.clienteNuevo.apellidoPaterno} ${data.clienteNuevo.apellidoMaterno}`.trim()
    : null;

  if (supabaseConfigured) {
    const sb = getServerSupabase();

    // 1) Cliente
    let clienteId = data.clienteExistenteId;
    if (!clienteId && data.clienteNuevo) {
      const cn = data.clienteNuevo;
      const { data: c, error } = await sb
        .from("clientes")
        .insert({
          nombre: cn.nombre,
          apellido_paterno: cn.apellidoPaterno,
          apellido_materno: cn.apellidoMaterno,
          curp: cn.curp,
          telefono: cn.telefono,
          direccion: cn.direccion,
          email: cn.email,
          fecha_nacimiento: cn.fechaNacimiento,
          tipo_identificacion: cn.tipoIdentificacion,
          numero_identificacion: cn.numeroIdentificacion,
          foto: cn.foto,
        })
        .select("id")
        .single();
      if (error) throw error;
      clienteId = c.id;
    }
    if (!clienteId) throw new Error("Cliente requerido");

    // 2) Prenda (queda empeñada)
    const { data: p, error: ep } = await sb
      .from("prendas")
      .insert({
        categoria: data.prenda.categoria,
        descripcion: data.prenda.descripcion,
        marca: data.prenda.marca,
        submarca: data.prenda.submarca,
        modelo: data.prenda.modelo,
        color: data.prenda.color,
        serie: data.prenda.serie,
        placas: data.prenda.placas,
        metal: data.prenda.metal,
        kilataje: data.prenda.kilataje,
        gramos: data.prenda.gramos,
        valor_avaluo: data.prenda.valorAvaluo,
        monto_prestamo_sugerido: Math.round(data.prenda.valorAvaluo * 0.5 * 100) / 100,
        estado: "empenada",
        fotos: data.prenda.fotos,
        ubicacion_resguardo: data.prenda.ubicacionResguardo,
        seguro: data.prenda.seguro,
        gps: data.prenda.gps,
        garantia: data.prenda.garantia,
        tipo_vehiculo: data.prenda.tipoVehiculo,
        transmision: data.prenda.transmision,
        numero_motor: data.prenda.numeroMotor,
        kilometraje: data.prenda.kilometraje,
        cilindros: data.prenda.cilindros,
        clave_vehicular: data.prenda.claveVehicular,
        nivel_gasolina: data.prenda.nivelGasolina,
        numero_factura: data.prenda.numeroFactura,
        emisor_factura: data.prenda.emisorFactura,
        valor_factura: data.prenda.valorFactura,
        fecha_factura: data.prenda.fechaFactura,
        aseguradora: data.prenda.aseguradora,
        poliza: data.prenda.poliza,
        danios: data.prenda.danios,
        gps_ubicacion: data.prenda.gpsUbicacion,
        seguro_mensual: data.prenda.seguroMensual,
        pension_mensual: data.prenda.pensionMensual,
        gps_mensual: data.prenda.gpsMensual,
        verificado: data.prenda.verificado,
        repuve_folio: data.prenda.repuveFolio,
        modalidad: data.prenda.modalidad ?? null,
        notas: data.prenda.notas,
      })
      .select("id")
      .single();
    if (ep) throw ep;

    // 3) Empeño
    const { data: e, error: ee } = await sb
      .from("empenos")
      .insert({
        cliente_id: clienteId,
        prenda_id: p.id,
        monto_prestado: data.montoPrestado,
        tasa_interes: data.tasaInteres,
        almacenaje_pct: data.almacenajePct,
        iva_pct: IVA_FIJO, // fijo de la sucursal, no lo que mande el cliente
        metodo_pago: data.metodoPago,
        comisionista: data.comisionista,
        centro_costo: data.centroCosto,
        periodo: data.periodo,
        plazo_periodos: data.plazoPeriodos,
        fecha_inicio: data.fechaInicio,
        fecha_vencimiento: fechaVencimiento,
        dias_gracia: data.diasGracia,
        estado: estadoInicial,
        notas: data.notas,
      })
      .select("id, folio")
      .single();
    if (ee) throw ee;

    if (especial) {
      await solicitarAutorizacion({
        tipo: "interes_especial",
        clienteNombre: nombreClienteAut,
        bien: data.prenda.descripcion,
        monto: data.montoPrestado,
        tasaSolicitada: data.tasaInteres,
        tasaEstandar: TASA_MINIMA_LIBRE,
        motivo: `Empeño ${e.folio} en borrador por tasa especial`,
        referencia: e.folio,
        empenoId: e.id,
      });
    }

    // 4) Salida de caja — solo si NO está en borrador (si es especial, se
    //    registra al aprobar la autorización, no antes).
    if (!especial) {
      await registrarSalidaPrestamo(e.id, e.folio, data.montoPrestado);
    }

    await bitacoraAuto("Empeño creado (asistente)", `Préstamo ${data.montoPrestado} MXN`, e.folio);
    revalidatePaths();
    return { empenoId: e.id, folio: e.folio };
  }

  // ---- memoria ----
  const store = getStore();
  const ts = new Date().toISOString();
  let clienteId = data.clienteExistenteId;
  if (!clienteId && data.clienteNuevo) {
    const cn = data.clienteNuevo;
    const c: Cliente = {
      id: nuevoId("c"),
      nombre: cn.nombre,
      apellidoPaterno: cn.apellidoPaterno,
      apellidoMaterno: cn.apellidoMaterno,
      curp: cn.curp,
      rfc: null,
      telefono: cn.telefono,
      email: cn.email,
      tipoIdentificacion: cn.tipoIdentificacion,
      numeroIdentificacion: cn.numeroIdentificacion,
      direccion: cn.direccion,
      fechaNacimiento: cn.fechaNacimiento,
      foto: cn.foto,
      notas: null,
      creadoEn: ts,
    };
    store.clientes.push(c);
    clienteId = c.id;
  }
  if (!clienteId) throw new Error("Cliente requerido");

  const prenda: Prenda = {
    id: nuevoId("p"),
    folio: siguienteFolio(store.prendas, "PR"),
    categoria: data.prenda.categoria,
    descripcion: data.prenda.descripcion,
    marca: data.prenda.marca,
    submarca: data.prenda.submarca,
    modelo: data.prenda.modelo,
    color: data.prenda.color,
    serie: data.prenda.serie,
    placas: data.prenda.placas,
    metal: data.prenda.metal,
    kilataje: data.prenda.kilataje,
    gramos: data.prenda.gramos,
    valorAvaluo: data.prenda.valorAvaluo,
    montoPrestamoSugerido: Math.round(data.prenda.valorAvaluo * 0.5 * 100) / 100,
    estado: "empenada",
    fotos: data.prenda.fotos,
    ubicacionResguardo: data.prenda.ubicacionResguardo,
    resguardo: RESGUARDO_VACIO,
    seguro: data.prenda.seguro,
    gps: data.prenda.gps,
    garantia: data.prenda.garantia,
    tipoVehiculo: data.prenda.tipoVehiculo,
    transmision: data.prenda.transmision,
    numeroMotor: data.prenda.numeroMotor,
    kilometraje: data.prenda.kilometraje,
    cilindros: data.prenda.cilindros,
    claveVehicular: data.prenda.claveVehicular,
    nivelGasolina: data.prenda.nivelGasolina,
    numeroFactura: data.prenda.numeroFactura,
    emisorFactura: data.prenda.emisorFactura,
    valorFactura: data.prenda.valorFactura,
    fechaFactura: data.prenda.fechaFactura,
    aseguradora: data.prenda.aseguradora,
    poliza: data.prenda.poliza,
    danios: data.prenda.danios,
    gpsUbicacion: data.prenda.gpsUbicacion,
    seguroMensual: data.prenda.seguroMensual,
    pensionMensual: data.prenda.pensionMensual,
    gpsMensual: data.prenda.gpsMensual,
    verificado: data.prenda.verificado,
    repuveFolio: data.prenda.repuveFolio,
    modalidad: data.prenda.modalidad ?? null,
    notas: data.prenda.notas,
    creadoEn: ts,
  };
  store.prendas.push(prenda);

  const empeno: Empeno = {
    id: nuevoId("e"),
    folio: siguienteFolio(store.empenos, "EM"),
    clienteId,
    prendaId: prenda.id,
    montoPrestado: data.montoPrestado,
    tasaInteres: data.tasaInteres,
    almacenajePct: data.almacenajePct,
    ivaPct: IVA_FIJO, // fijo de la sucursal, no lo que mande el cliente
    metodoPago: data.metodoPago,
    abonoCapital: 0,
    comisionista: data.comisionista,
    centroCosto: data.centroCosto,
    realSucursal: null,
    periodo: data.periodo,
    plazoPeriodos: data.plazoPeriodos,
    fechaInicio: data.fechaInicio,
    fechaVencimiento,
    diasGracia: data.diasGracia,
    estado: estadoInicial,
    notas: data.notas,
    firmaCliente: null,
    firmaFecha: null,
    creadoEn: ts,
  };
  store.empenos.push(empeno);
  if (especial) {
    await solicitarAutorizacion({
      tipo: "interes_especial",
      clienteNombre: nombreClienteAut,
      bien: data.prenda.descripcion,
      monto: data.montoPrestado,
      tasaSolicitada: data.tasaInteres,
      tasaEstandar: TASA_MINIMA_LIBRE,
      motivo: `Empeño ${empeno.folio} en borrador por tasa especial`,
      referencia: empeno.folio,
      empenoId: empeno.id,
    });
  }
  if (!especial) {
    await registrarSalidaPrestamo(empeno.id, empeno.folio, data.montoPrestado);
  }

  await bitacoraAuto("Empeño creado (asistente)", `Préstamo ${data.montoPrestado} MXN`, empeno.folio);
  revalidatePaths();
  return { empenoId: empeno.id, folio: empeno.folio };
}

// ----------------- NOTIFICACIONES (WhatsApp) -----------------

function mensajeRecordatorio(e: Awaited<ReturnType<typeof obtenerEmpeno>>): string {
  if (!e) return "";
  const calc = calcularLiquidacion(e);
  const venc = calc.vencido ? "venció" : "vence";
  return (
    `Hola ${e.cliente.nombre}, le recordamos su empeño *${e.folio}* ` +
    `(${e.prenda.descripcion}) que ${venc} el ${formatFecha(e.fechaVencimiento)}.\n\n` +
    `• Refrendo (solo interés): ${formatMXN(calc.totalRefrendo)}\n` +
    `• Liquidar (desempeño): ${formatMXN(calc.totalDesempeno)}\n\n` +
    `Acuda a refrendar o liquidar para conservar su prenda. ¡Gracias!`
  );
}

export async function enviarRecordatorioWhatsApp(empenoId: string) {
  if (await esInvitado()) return;
  const e = await obtenerEmpeno(empenoId);
  if (!e) return;
  const res = await enviarWhatsApp(e.cliente.telefono, mensajeRecordatorio(e));
  await bitacoraAuto(
    res.ok ? "Recordatorio WhatsApp enviado" : "Recordatorio WhatsApp falló",
    res.ok ? `a ${e.cliente.nombre}` : res.error ?? null,
    e.folio
  );
  revalidatePath("/recordatorios");
}

/** Envía recordatorios a todos los empeños vencidos o por vencer (≤3 días). Usado por el cron. */
export async function enviarRecordatoriosPendientes(): Promise<{ enviados: number; fallidos: number }> {
  const empenos = await listarEmpenos();
  let enviados = 0;
  let fallidos = 0;
  for (const e of empenos) {
    if (e.estado !== "activo" && e.estado !== "refrendado") continue;
    const calc = calcularLiquidacion(e);
    if (!(calc.vencido || calc.diasParaVencer <= 3)) continue;
    if (!e.cliente.telefono) continue;
    const res = await enviarWhatsApp(e.cliente.telefono, mensajeRecordatorio(e));
    if (res.ok) enviados++;
    else fallidos++;
  }
  await bitacoraAuto("Recordatorios automáticos", `${enviados} enviados, ${fallidos} fallidos`, null);
  return { enviados, fallidos };
}

/** Envía la foto del vehículo a su propietario por WhatsApp (prueba de resguardo). */
export async function enviarFotoVehiculo(empenoId: string) {
  if (await esInvitado()) return;
  const e = await obtenerEmpeno(empenoId);
  if (!e || !e.prenda.fotos[0]) return;
  const caption =
    `Hola ${e.cliente.nombre}, le compartimos la foto de su vehículo en resguardo ` +
    `(${e.prenda.garantia ?? e.prenda.descripcion}). Empeño ${e.folio}. Su unidad está segura con nosotros.`;
  const res = await enviarWhatsAppMedia(e.cliente.telefono, e.prenda.fotos[0], caption);
  await bitacoraAuto(
    res.ok ? "Foto de vehículo enviada" : "Foto de vehículo falló",
    res.ok ? `a ${e.cliente.nombre}` : res.error ?? null,
    e.folio
  );
  revalidatePath(`/empenos/${empenoId}`);
}

/** Envío semanal (sábado): foto del vehículo a cada propietario con empeño activo. */
export async function enviarFotosVehiculosSemanal(): Promise<{ enviados: number; fallidos: number }> {
  const empenos = await listarEmpenos();
  let enviados = 0;
  let fallidos = 0;
  for (const e of empenos) {
    if (e.estado !== "activo" && e.estado !== "refrendado") continue;
    if (e.prenda.categoria !== "Vehículos") continue;
    if (!e.prenda.fotos[0] || !e.cliente.telefono) continue;
    const caption =
      `Hola ${e.cliente.nombre}, foto semanal de su vehículo en resguardo ` +
      `(${e.prenda.garantia ?? e.prenda.descripcion}). Empeño ${e.folio}.`;
    const res = await enviarWhatsAppMedia(e.cliente.telefono, e.prenda.fotos[0], caption);
    if (res.ok) enviados++;
    else fallidos++;
  }
  await bitacoraAuto("Fotos semanales de vehículos", `${enviados} enviadas, ${fallidos} fallidas`, null);
  return { enviados, fallidos };
}

// ----------------- FOTOS (STORAGE) -----------------

export async function subirFotoPrenda(prendaId: string, formData: FormData) {
  if (await esInvitado()) return;
  const file = formData.get("foto") as File | null;
  if (!file || file.size === 0) return;

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${prendaId}/${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("prendas").upload(path, buf, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    const { data: pub } = sb.storage.from("prendas").getPublicUrl(path);
    const { data: p } = await sb.from("prendas").select("fotos").eq("id", prendaId).single();
    const fotos = [...(p?.fotos ?? []), pub.publicUrl];
    await sb.from("prendas").update({ fotos }).eq("id", prendaId);
  } else {
    const p = getStore().prendas.find((x) => x.id === prendaId);
    if (p) p.fotos.push(file.name);
  }
  await bitacoraAuto("Foto agregada a prenda", null, prendaId);
  revalidatePath(`/prendas/${prendaId}`);
  revalidatePath("/prendas");
}

/** Actualiza la ubicación de resguardo (Matriz o externa, con pin de mapa). */
export async function actualizarResguardo(prendaId: string, form: FormData) {
  if (await esInvitado()) return;
  const resguardo: Resguardo = {
    tipo: (s(form, "tipoUbicacion") || "Matriz") as Resguardo["tipo"],
    calle: sn(form, "calle"),
    numero: sn(form, "numero"),
    colonia: sn(form, "colonia"),
    ciudad: sn(form, "ciudad"),
    cp: sn(form, "cp"),
    referencia: sn(form, "referencia"),
    mapsUrl: sn(form, "mapsUrl"),
  };
  const resumen = resumenResguardo(resguardo);

  if (supabaseConfigured) {
    await getServerSupabase()
      .from("prendas")
      .update({
        ubicacion_resguardo: resumen,
        resguardo_tipo: resguardo.tipo,
        resguardo_calle: resguardo.calle,
        resguardo_numero: resguardo.numero,
        resguardo_colonia: resguardo.colonia,
        resguardo_ciudad: resguardo.ciudad,
        resguardo_cp: resguardo.cp,
        resguardo_referencia: resguardo.referencia,
        resguardo_maps_url: resguardo.mapsUrl,
      })
      .eq("id", prendaId);
  } else {
    const p = getStore().prendas.find((x) => x.id === prendaId);
    if (p) {
      p.ubicacionResguardo = resumen;
      p.resguardo = resguardo;
    }
  }
  revalidatePath(`/prendas/${prendaId}`);
}

export async function eliminarFotoPrenda(prendaId: string, url: string) {
  if (await esInvitado()) return;
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: p } = await sb.from("prendas").select("fotos").eq("id", prendaId).single();
    const fotos = (p?.fotos ?? []).filter((u: string) => u !== url);
    await sb.from("prendas").update({ fotos }).eq("id", prendaId);
    // Borrar del bucket (best-effort)
    const idx = url.indexOf("/prendas/");
    if (idx >= 0) {
      const path = url.slice(idx + "/prendas/".length);
      await sb.storage.from("prendas").remove([path]);
    }
  } else {
    const p = getStore().prendas.find((x) => x.id === prendaId);
    if (p) p.fotos = p.fotos.filter((u) => u !== url);
  }
  revalidatePath(`/prendas/${prendaId}`);
}

// ----------------- REMATES Y VENTAS -----------------

/** Envía un empeño vencido a remate: la prenda pasa a estar en venta. */
export async function enviarARemate(empenoId: string) {
  if (await esInvitado()) return;
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data, error } = await sb.from("empenos").select("prenda_id").eq("id", empenoId).single();
    if (error) throw error;
    await sb.from("empenos").update({ estado: "en_remate" }).eq("id", empenoId);
    await sb.from("prendas").update({ estado: "en_venta" }).eq("id", data.prenda_id);
  } else {
    const store = getStore();
    const e = store.empenos.find((x) => x.id === empenoId);
    if (!e) return;
    e.estado = "en_remate";
    const p = store.prendas.find((x) => x.id === e.prendaId);
    if (p) p.estado = "en_venta";
  }
  await bitacoraAuto("Empeño enviado a remate", null, `empeño ${empenoId}`);
  revalidatePath("/remates");
  revalidatePath("/empenos");
  revalidatePath("/prendas");
  revalidatePath("/ventas");
  revalidatePath("/tienda"); // catálogo público de remates
  // La prenda ya está a la venta: el cajero continúa en el punto de venta.
  redirect("/ventas");
}

/** Registra la venta de una prenda en venta. */
export async function registrarVenta(form: FormData) {
  if (await esInvitado()) return;
  const prendaId = s(form, "prendaId");
  const precio = num(form, "precio");
  const metodoPago = (s(form, "metodoPago") || "efectivo") as MetodoPago;
  const clienteId = sn(form, "clienteId");
  const notas = sn(form, "notas");

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: v, error } = await sb
      .from("ventas")
      .insert({ prenda_id: prendaId, cliente_id: clienteId, precio, metodo_pago: metodoPago, notas })
      .select("id, folio")
      .single();
    if (error) throw error;
    await sb.from("prendas").update({ estado: "vendida" }).eq("id", prendaId);
    // Si la prenda venía de un empeño en remate, marcarlo rematado
    await sb.from("empenos").update({ estado: "rematado" }).eq("prenda_id", prendaId).eq("estado", "en_remate");
    await sb.from("movimientos_caja").insert({
      tipo: "venta",
      monto: precio,
      es_entrada: true,
      concepto: `Venta ${v.folio}`,
      referencia: v.folio,
    });
  } else {
    const store = getStore();
    const venta: Venta = {
      id: nuevoId("v"),
      folio: siguienteFolio(store.ventas, "VT"),
      prendaId,
      clienteId,
      precio,
      metodoPago,
      fecha: new Date().toISOString(),
      notas,
      creadoEn: new Date().toISOString(),
    };
    store.ventas.push(venta);
    const p = store.prendas.find((x) => x.id === prendaId);
    if (p) p.estado = "vendida";
    const e = store.empenos.find((x) => x.prendaId === prendaId && x.estado === "en_remate");
    if (e) e.estado = "rematado";
    store.movimientos.push({
      id: nuevoId("m"),
      fecha: new Date().toISOString(),
      tipo: "venta",
      monto: precio,
      esEntrada: true,
      concepto: `Venta ${venta.folio}`,
      empenoId: null,
      referencia: venta.folio,
      creadoEn: new Date().toISOString(),
    });
  }
  await bitacoraAuto("Venta registrada", `${precio} MXN`, null);
  revalidatePath("/ventas");
  revalidatePath("/prendas");
  revalidatePath("/caja");
  revalidatePath("/remates");
  revalidatePath("/tienda"); // la prenda vendida sale del catálogo público
}

// ----------------- COMPRA DIRECTA -----------------

/** Compra directa: se adquiere un artículo (crea prenda en venta + salida de caja). */
export async function crearCompra(form: FormData) {
  if (await esInvitado()) return;
  const monto = num(form, "monto");
  const clienteId = sn(form, "clienteId");
  const prendaBase = {
    categoria: s(form, "categoria") || "Otro",
    descripcion: s(form, "descripcion"),
    marca: sn(form, "marca"),
    modelo: sn(form, "modelo"),
    color: sn(form, "color"),
    serie: sn(form, "serie"),
  };

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: p, error } = await sb
      .from("prendas")
      .insert({
        categoria: prendaBase.categoria,
        descripcion: prendaBase.descripcion,
        marca: prendaBase.marca,
        modelo: prendaBase.modelo,
        color: prendaBase.color,
        serie: prendaBase.serie,
        valor_avaluo: monto,
        monto_prestamo_sugerido: 0,
        estado: "en_venta",
        notas: sn(form, "notas"),
      })
      .select("id")
      .single();
    if (error) throw error;
    const { data: c, error: ec } = await sb
      .from("compras")
      .insert({ prenda_id: p.id, cliente_id: clienteId, monto, notas: sn(form, "notas") })
      .select("folio")
      .single();
    if (ec) throw ec;
    await sb.from("movimientos_caja").insert({
      tipo: "compra",
      monto,
      es_entrada: false,
      concepto: `Compra directa ${c.folio}`,
      referencia: c.folio,
    });
  } else {
    const store = getStore();
    const prenda: Prenda = {
      id: nuevoId("p"),
      folio: siguienteFolio(store.prendas, "PR"),
      categoria: prendaBase.categoria as CategoriaPrenda,
      descripcion: prendaBase.descripcion,
      marca: prendaBase.marca,
      submarca: null,
      modelo: prendaBase.modelo,
      color: prendaBase.color,
      serie: prendaBase.serie,
      placas: null,
      metal: null,
      kilataje: null,
      gramos: null,
      valorAvaluo: monto,
      montoPrestamoSugerido: 0,
      estado: "en_venta",
      fotos: [],
      ubicacionResguardo: null,
      resguardo: RESGUARDO_VACIO,
      ...CAMPOS_VEHICULO_VACIOS,
      seguro: null,
      gps: null,
      garantia: null,
      verificado: false,
      repuveFolio: null,
      notas: sn(form, "notas"),
      creadoEn: new Date().toISOString(),
    };
    store.prendas.push(prenda);
    const compra: Compra = {
      id: nuevoId("cp"),
      folio: siguienteFolio(store.compras, "CP"),
      prendaId: prenda.id,
      clienteId,
      monto,
      fecha: new Date().toISOString(),
      notas: sn(form, "notas"),
      creadoEn: new Date().toISOString(),
    };
    store.compras.push(compra);
    store.movimientos.push({
      id: nuevoId("m"),
      fecha: new Date().toISOString(),
      tipo: "compra",
      monto,
      esEntrada: false,
      concepto: `Compra directa ${compra.folio}`,
      empenoId: null,
      referencia: compra.folio,
      creadoEn: new Date().toISOString(),
    });
  }
  await bitacoraAuto("Compra directa", `${monto} MXN`, null);
  revalidatePath("/compras");
  revalidatePath("/prendas");
  revalidatePath("/caja");
  redirect("/compras");
}

// ----------------- APARTADOS (LAYAWAY) -----------------

/** Crea un apartado sobre una prenda en venta, con enganche inicial. */
export async function crearApartado(form: FormData) {
  if (await esInvitado()) return;
  const prendaId = s(form, "prendaId");
  const clienteId = s(form, "clienteId");
  const precioTotal = num(form, "precioTotal");
  const enganche = num(form, "enganche");

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: a, error } = await sb
      .from("apartados")
      .insert({
        prenda_id: prendaId,
        cliente_id: clienteId,
        precio_total: precioTotal,
        abonado: enganche,
        estado: "activo",
        notas: sn(form, "notas"),
      })
      .select("folio")
      .single();
    if (error) throw error;
    await sb.from("prendas").update({ estado: "apartada" }).eq("id", prendaId);
    if (enganche > 0) {
      await sb.from("movimientos_caja").insert({
        tipo: "abono",
        monto: enganche,
        es_entrada: true,
        concepto: `Enganche apartado ${a.folio}`,
        referencia: a.folio,
      });
    }
  } else {
    const store = getStore();
    const apartado: Apartado = {
      id: nuevoId("ap"),
      folio: siguienteFolio(store.apartados, "AP"),
      prendaId,
      clienteId,
      precioTotal,
      abonado: enganche,
      estado: "activo",
      fecha: new Date().toISOString(),
      notas: sn(form, "notas"),
      creadoEn: new Date().toISOString(),
    };
    store.apartados.push(apartado);
    const p = store.prendas.find((x) => x.id === prendaId);
    if (p) p.estado = "apartada";
    if (enganche > 0)
      store.movimientos.push({
        id: nuevoId("m"),
        fecha: new Date().toISOString(),
        tipo: "abono",
        monto: enganche,
        esEntrada: true,
        concepto: `Enganche apartado ${apartado.folio}`,
        empenoId: null,
        referencia: apartado.folio,
        creadoEn: new Date().toISOString(),
      });
  }
  revalidatePath("/apartados");
  revalidatePath("/prendas");
  revalidatePath("/caja");
}

/** Registra un abono a un apartado; si se completa, se liquida (prenda vendida). */
export async function abonarApartado(id: string, form: FormData) {
  if (await esInvitado()) return;
  const monto = num(form, "monto");

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: a, error } = await sb.from("apartados").select("*").eq("id", id).single();
    if (error) throw error;
    const nuevoAbonado = Number(a.abonado) + monto;
    const liquidado = nuevoAbonado >= Number(a.precio_total);
    await sb
      .from("apartados")
      .update({ abonado: nuevoAbonado, estado: liquidado ? "liquidado" : "activo" })
      .eq("id", id);
    if (liquidado) await sb.from("prendas").update({ estado: "vendida" }).eq("id", a.prenda_id);
    await sb.from("movimientos_caja").insert({
      tipo: "abono",
      monto,
      es_entrada: true,
      concepto: `Abono apartado ${a.folio}`,
      referencia: a.folio,
    });
  } else {
    const store = getStore();
    const a = store.apartados.find((x) => x.id === id);
    if (!a) return;
    a.abonado += monto;
    if (a.abonado >= a.precioTotal) {
      a.estado = "liquidado";
      const p = store.prendas.find((x) => x.id === a.prendaId);
      if (p) p.estado = "vendida";
    }
    store.movimientos.push({
      id: nuevoId("m"),
      fecha: new Date().toISOString(),
      tipo: "abono",
      monto,
      esEntrada: true,
      concepto: `Abono apartado ${a.folio}`,
      empenoId: null,
      referencia: a.folio,
      creadoEn: new Date().toISOString(),
    });
  }
  revalidatePath("/apartados");
  revalidatePath("/prendas");
  revalidatePath("/caja");
}

/** Cancela un apartado; la prenda vuelve a estar en venta. */
export async function cancelarApartado(id: string) {
  if (await esInvitado()) return;
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: a, error } = await sb.from("apartados").select("prenda_id").eq("id", id).single();
    if (error) throw error;
    await sb.from("apartados").update({ estado: "cancelado" }).eq("id", id);
    await sb.from("prendas").update({ estado: "en_venta" }).eq("id", a.prenda_id);
  } else {
    const store = getStore();
    const a = store.apartados.find((x) => x.id === id);
    if (!a) return;
    a.estado = "cancelado";
    const p = store.prendas.find((x) => x.id === a.prendaId);
    if (p) p.estado = "en_venta";
  }
  revalidatePath("/apartados");
  revalidatePath("/prendas");
}

// ----------------- CAJA -----------------

export async function registrarMovimiento(form: FormData) {
  if (await esInvitado()) return;
  const tipo = (s(form, "tipo") || "gasto") as TipoMovimiento;
  const entradas: TipoMovimiento[] = ["desempeno", "refrendo", "abono", "venta", "apertura", "deposito"];
  // "transferencia" puede ser entrada o salida según lo que elija el usuario
  // (a diferencia de los demás tipos, que ya implican una sola dirección).
  const esEntrada = tipo === "transferencia" ? form.get("direccion") === "entrada" : entradas.includes(tipo);
  const datos = {
    tipo,
    monto: num(form, "monto"),
    es_entrada: esEntrada,
    concepto: s(form, "concepto") || "Movimiento manual",
    referencia: sn(form, "referencia"),
  };
  if (supabaseConfigured) {
    const { error } = await getServerSupabase().from("movimientos_caja").insert(datos);
    if (error) throw error;
  } else {
    const mov: MovimientoCaja = {
      id: nuevoId("m"),
      fecha: new Date().toISOString(),
      tipo,
      monto: datos.monto,
      esEntrada: datos.es_entrada,
      concepto: datos.concepto,
      empenoId: null,
      referencia: datos.referencia,
      creadoEn: new Date().toISOString(),
    };
    getStore().movimientos.push(mov);
  }
  revalidatePath("/caja");
  revalidatePath("/corte");
}

// ----------------- CORTE DE CAJA -----------------

export async function registrarCorte(form: FormData) {
  if (await esInvitado()) return;
  const contado = num(form, "contado");
  const notas = sn(form, "notas");
  const hoy = hoyISO();

  const movs = await listarMovimientos();
  const esperado = movs.reduce((s, m) => s + (m.esEntrada ? m.monto : -m.monto), 0);
  const delDia = movs.filter((m) => m.fecha.slice(0, 10) === hoy);
  const entradasDia = delDia.filter((m) => m.esEntrada).reduce((s, m) => s + m.monto, 0);
  const salidasDia = delDia.filter((m) => !m.esEntrada).reduce((s, m) => s + m.monto, 0);
  const diferencia = Math.round((contado - esperado) * 100) / 100;
  const u = await getUsuarioActual();

  if (supabaseConfigured) {
    const { error } = await getServerSupabase().from("cortes_caja").insert({
      esperado, contado, diferencia, entradas_dia: entradasDia, salidas_dia: salidasDia,
      usuario_nombre: u?.nombre ?? null, notas,
    });
    if (error) throw error;
  } else {
    getStore().cortes.unshift({
      id: nuevoId("ct"), fecha: hoy, esperado, contado, diferencia,
      entradasDia, salidasDia, usuarioNombre: u?.nombre ?? null, notas,
      creadoEn: new Date().toISOString(),
    } as CorteCaja);
  }
  await bitacoraAuto("Corte de caja", `Esperado ${esperado} · contado ${contado} · dif ${diferencia}`, null);
  revalidatePath("/corte");
  revalidatePath("/caja");
}

/** Envía recordatorios de WhatsApp a todos los vencidos/por vencer (acción manual del día). */
export async function enviarRecordatoriosHoy() {
  if (await esInvitado()) return;
  await enviarRecordatoriosPendientes();
  revalidatePath("/recordatorios");
}

function revalidatePaths() {
  revalidatePath("/empenos");
  revalidatePath("/clientes");
  revalidatePath("/prendas");
  revalidatePath("/caja");
  revalidatePath("/");
}

// ----------------- COTIZACIONES -----------------

function sumarDiasISO(iso: string, dias: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export async function crearCotizacion(input: CotizacionInput): Promise<{ id: string; folio: string }> {
  if (await esInvitado()) return { id: "", folio: "" };
  const valuador = (await getUsuarioActual())?.nombre ?? null;
  const vigenciaDias = 1; // caduca en 24 h si no hay acción
  const vigenciaHasta = sumarDiasISO(hoyISO(), vigenciaDias);

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: existentes } = await sb.from("cotizaciones").select("folio");
    const folio = siguienteFolio(existentes ?? [], "COT");
    const { data, error } = await sb
      .from("cotizaciones")
      .insert({
        folio,
        tipo: input.tipo,
        categoria: input.categoria,
        descripcion: input.descripcion,
        prospecto_nombre: input.prospectoNombre,
        prospecto_telefono: input.prospectoTelefono,
        marca: input.marca,
        submarca: input.submarca,
        modelo: input.modelo,
        serie: input.serie,
        placas: input.placas,
        kilometraje: input.kilometraje,
        condicion: input.condicion,
        metal: input.metal,
        kilataje: input.kilataje,
        gramos: input.gramos,
        valor_mercado: input.valorMercado,
        valor_estimado: input.valorEstimado,
        monto_solicitado: input.montoSolicitado,
        busqueda_facebook: input.busquedaFacebook,
        porcentaje_prestamo: input.porcentajePrestamo,
        prestamo_ofrecido: input.prestamoOfrecido,
        contacto: input.contacto,
        vigencia_dias: vigenciaDias,
        vigencia_hasta: vigenciaHasta,
        estado: "vigente",
        fotos: input.fotos,
        valuador_nombre: valuador,
        notas: input.notas,
      })
      .select("id, folio")
      .single();
    if (error) throw error;
    await bitacoraAuto("Cotización creada", `${input.descripcion} · ${formatMXN(input.prestamoOfrecido)}`, data.folio);
    revalidatePath("/cotizaciones");
    return { id: data.id, folio: data.folio };
  }

  const store = getStore();
  const folio = siguienteFolio(store.cotizaciones, "COT");
  const cot: Cotizacion = {
    id: nuevoId("cot"),
    folio,
    tipo: input.tipo,
    categoria: input.categoria,
    descripcion: input.descripcion,
    clienteId: null,
    prospectoNombre: input.prospectoNombre,
    prospectoTelefono: input.prospectoTelefono,
    marca: input.marca,
    submarca: input.submarca,
    modelo: input.modelo,
    serie: input.serie,
    placas: input.placas,
    kilometraje: input.kilometraje,
    condicion: input.condicion,
    metal: input.metal,
    kilataje: input.kilataje,
    gramos: input.gramos,
    valorMercado: input.valorMercado,
    valorEstimado: input.valorEstimado,
    montoSolicitado: input.montoSolicitado,
    busquedaFacebook: input.busquedaFacebook,
    porcentajePrestamo: input.porcentajePrestamo,
    prestamoOfrecido: input.prestamoOfrecido,
    contacto: input.contacto,
    avaluoMecanico: null,
    comentarioMecanico: null,
    checklistMecanico: null,
    avaluoEstado: null,
    seEmpeno: null,
    motivoNo: null,
    vigenciaDias,
    vigenciaHasta,
    estado: "vigente",
    fotos: input.fotos,
    documentos: [],
    valuadorNombre: valuador,
    notas: input.notas,
    creadoEn: new Date().toISOString(),
  };
  store.cotizaciones.push(cot);
  revalidatePath("/cotizaciones");
  return { id: cot.id, folio: cot.folio };
}

/**
 * Autocotización pública (página /cotiza-vehiculo): el cliente captura los
 * datos básicos de su vehículo y cuánto necesita. Queda registrada como
 * cotización normal, "sujeta a evaluación" — el valor real y el préstamo
 * ofrecido los define el personal después, no hay tabla de precios todavía
 * para calcular un estimado automático.
 */
export async function crearCotizacionPublica(input: {
  nombre: string;
  telefono: string;
  descripcion: string;
  marca: string | null;
  modelo: string | null;
  montoSolicitado: number;
  /** Campo trampa para bots — un humano nunca lo llena. */
  honeypot?: string;
}): Promise<{ ok: boolean; folio?: string; error?: string }> {
  if (input.honeypot) return { ok: true }; // bot: finge éxito, no revela que se detectó
  if (await limitadoPorIP("cotiza-vehiculo")) return { ok: false, error: "Demasiados intentos. Espera unos minutos." };
  if (!input.nombre.trim()) return { ok: false, error: "Falta el nombre." };
  if (!formatearNumeroMX(input.telefono)) return { ok: false, error: "Teléfono inválido." };
  if (!input.descripcion.trim()) return { ok: false, error: "Falta la descripción del vehículo." };
  if (!input.montoSolicitado || input.montoSolicitado <= 0) {
    return { ok: false, error: "Indica cuánto necesitas aproximadamente." };
  }

  const r = await crearCotizacion({
    tipo: "vehiculo",
    categoria: "Vehículos",
    descripcion: input.descripcion.trim(),
    prospectoNombre: input.nombre.trim(),
    prospectoTelefono: input.telefono.trim(),
    marca: input.marca,
    submarca: null,
    modelo: input.modelo,
    serie: null,
    placas: null,
    kilometraje: null,
    condicion: "bueno",
    metal: null,
    kilataje: null,
    gramos: null,
    valorMercado: 0,
    valorEstimado: 0,
    montoSolicitado: input.montoSolicitado,
    busquedaFacebook: null,
    porcentajePrestamo: 0,
    prestamoOfrecido: 0,
    contacto: "Cotizador web",
    fotos: [],
    notas: "Autocotización del cliente — sujeta a evaluación física del vehículo.",
  });
  if (!r.folio) return { ok: false, error: "No se pudo registrar. Intenta de nuevo." };
  return { ok: true, folio: r.folio };
}

/** Cotizaciones sin acción en 24 h pasan a "no proceden" (vencida). Para el cron. */
export async function caducarCotizaciones(): Promise<{ caducadas: number }> {
  const limite = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("cotizaciones")
      .update({ estado: "vencida" })
      .eq("estado", "vigente")
      .is("se_empeno", null)
      .lt("creado_en", limite)
      .select("id");
    if (error) throw error;
    revalidatePath("/cotizaciones");
    return { caducadas: data?.length ?? 0 };
  }
  let n = 0;
  for (const c of getStore().cotizaciones) {
    if (c.estado === "vigente" && c.seEmpeno === null && c.creadoEn < limite) {
      c.estado = "vencida";
      n++;
    }
  }
  revalidatePath("/cotizaciones");
  return { caducadas: n };
}

// ----------------- PRODUCTOS DE INTERÉS (catálogo) -----------------

async function soloDireccion() {
  const u = await getUsuarioActual();
  if (!u || (u.rol !== "admin" && u.rol !== "gerente")) throw new Error("Solo Dirección o Gerente.");
  return u;
}

export async function crearProductoInteres(form: FormData) {
  await soloDireccion();
  const datos = {
    nombre: s(form, "nombre").toUpperCase(),
    modalidad: sn(form, "modalidad"),
    tipo: s(form, "tipo") || "tradicional",
    tasa: num(form, "tasa"),
    periodo: s(form, "periodo") || "mensual",
    plazo_periodos: Math.max(1, Math.round(num(form, "plazoPeriodos")) || 1),
    orden: Math.round(num(form, "orden")) || 99,
    activo: true,
  };
  if (supabaseConfigured) {
    const { error } = await getServerSupabase().from("productos_interes").insert(datos);
    if (error) throw error;
  } else {
    getStore().productosInteres.push({
      id: nuevoId("pi"),
      nombre: datos.nombre,
      modalidad: datos.modalidad as "gps" | "resguardo" | null,
      tipo: datos.tipo as "tradicional" | "fijo",
      tasa: datos.tasa,
      periodo: datos.periodo as PeriodoInteres,
      plazoPeriodos: datos.plazo_periodos,
      orden: datos.orden,
      activo: true,
      creadoEn: new Date().toISOString(),
    });
  }
  revalidatePath("/configuracion");
  revalidatePath("/empenos/asistente");
}

export async function actualizarProductoInteres(id: string, form: FormData) {
  await soloDireccion();
  const datos = { tasa: num(form, "tasa"), activo: form.get("activo") === "on", orden: Math.round(num(form, "orden")) || 0 };
  if (supabaseConfigured) {
    const { error } = await getServerSupabase().from("productos_interes").update(datos).eq("id", id);
    if (error) throw error;
  } else {
    const p = getStore().productosInteres.find((x) => x.id === id);
    if (p) {
      p.tasa = datos.tasa;
      p.activo = datos.activo;
      p.orden = datos.orden;
    }
  }
  revalidatePath("/configuracion");
  revalidatePath("/empenos/asistente");
}

export async function eliminarProductoInteres(id: string) {
  await soloDireccion();
  if (supabaseConfigured) {
    const { error } = await getServerSupabase().from("productos_interes").delete().eq("id", id);
    if (error) throw error;
  } else {
    const store = getStore();
    store.productosInteres = store.productosInteres.filter((x) => x.id !== id);
  }
  revalidatePath("/configuracion");
  revalidatePath("/empenos/asistente");
}

// ----------------- AUTORIZACIONES (Dirección General) -----------------

/** Avisa por WhatsApp al supervisor que hay una autorización de tasa especial pendiente. */
async function notificarSupervisorAutorizacion(input: AutorizacionInput, folio: string) {
  const tel = process.env.SUPERVISOR_TEL;
  if (!tel) return;
  const texto = [
    `🔒 Autorización de tasa especial (${folio})`,
    `Cliente: ${input.clienteNombre ?? "—"}`,
    input.bien ? `Bien: ${input.bien}` : null,
    `Tasa solicitada: ${input.tasaSolicitada ?? "?"}% (catálogo ${input.tasaEstandar ?? "?"}%)`,
    input.monto ? `Préstamo: ${formatMXN(input.monto)}` : null,
    `Autoriza aquí: ${APP_URL}/autorizaciones`,
  ].filter(Boolean).join("\n");
  await enviarWhatsApp(tel, texto).catch(() => {});
}

/** Crea una solicitud de autorización (p. ej. tasa de interés especial). */
export async function solicitarAutorizacion(input: AutorizacionInput): Promise<{ id: string; folio: string }> {
  if (await esInvitado()) return { id: "", folio: "" };
  const solicitante = (await getUsuarioActual())?.nombre ?? null;

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: existentes } = await sb.from("autorizaciones").select("folio");
    const folio = siguienteFolio(existentes ?? [], "AUT");
    const { data, error } = await sb
      .from("autorizaciones")
      .insert({
        folio,
        tipo: input.tipo,
        estado: "pendiente",
        solicitante_nombre: solicitante,
        cliente_nombre: input.clienteNombre,
        bien: input.bien,
        monto: input.monto,
        tasa_solicitada: input.tasaSolicitada,
        tasa_estandar: input.tasaEstandar,
        motivo: input.motivo,
        referencia: input.referencia,
        empeno_id: input.empenoId ?? null,
      })
      .select("id, folio")
      .single();
    if (error) throw error;
    await bitacoraAuto("Autorización solicitada", `${input.tipo} · tasa ${input.tasaSolicitada ?? "?"}%`, data.folio);
    await notificarSupervisorAutorizacion(input, data.folio);
    revalidatePath("/autorizaciones");
    return { id: data.id, folio: data.folio };
  }

  const store = getStore();
  const folio = siguienteFolio(store.autorizaciones, "AUT");
  const aut: Autorizacion = {
    id: nuevoId("aut"),
    folio,
    tipo: input.tipo,
    estado: "pendiente",
    solicitanteNombre: solicitante,
    autorizadorNombre: null,
    clienteNombre: input.clienteNombre,
    bien: input.bien,
    monto: input.monto,
    tasaSolicitada: input.tasaSolicitada,
    tasaEstandar: input.tasaEstandar,
    motivo: input.motivo,
    comentarioResolucion: null,
    referencia: input.referencia,
    empenoId: input.empenoId ?? null,
    creadoEn: new Date().toISOString(),
    resueltoEn: null,
  };
  store.autorizaciones.push(aut);
  await notificarSupervisorAutorizacion(input, aut.folio);
  revalidatePath("/autorizaciones");
  return { id: aut.id, folio: aut.folio };
}

/** Aprueba o rechaza una solicitud. Solo Dirección General (admin) o Gerente. */
export async function resolverAutorizacion(id: string, aprobada: boolean, comentario: string | null) {
  const u = await getUsuarioActual();
  if (!u || (u.rol !== "admin" && u.rol !== "gerente")) {
    throw new Error("Solo Dirección General puede autorizar.");
  }
  const estado = aprobada ? "aprobada" : "rechazada";
  const ahora = new Date().toISOString();
  let empenoId: string | null = null;
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: aut } = await sb.from("autorizaciones").select("empeno_id").eq("id", id).maybeSingle();
    empenoId = aut?.empeno_id ?? null;
    const { error } = await sb
      .from("autorizaciones")
      .update({ estado, autorizador_nombre: u.nombre, comentario_resolucion: comentario, resuelto_en: ahora })
      .eq("id", id);
    if (error) throw error;
  } else {
    const a = getStore().autorizaciones.find((x) => x.id === id);
    if (a) {
      a.estado = estado;
      a.autorizadorNombre = u.nombre;
      a.comentarioResolucion = comentario;
      a.resueltoEn = ahora;
      empenoId = a.empenoId;
    }
  }

  // Efecto sobre el empeño en borrador ligado a la autorización.
  if (empenoId) {
    const emp = await obtenerEmpeno(empenoId);
    if (emp && emp.estado === "borrador") {
      if (aprobada) {
        if (supabaseConfigured) {
          await getServerSupabase().from("empenos").update({ estado: "activo" }).eq("id", empenoId).eq("estado", "borrador");
        } else {
          const e = getStore().empenos.find((x) => x.id === empenoId);
          if (e) e.estado = "activo";
        }
        // Recién ahora se entrega el préstamo: se registra la salida de caja.
        await registrarSalidaPrestamo(empenoId, emp.folio, emp.montoPrestado);
      } else {
        // Rechazado: el empeño se cancela y la prenda vuelve a estar disponible.
        if (supabaseConfigured) {
          const sb = getServerSupabase();
          await sb.from("empenos").update({ estado: "cancelado" }).eq("id", empenoId).eq("estado", "borrador");
          await sb.from("prendas").update({ estado: "en_avaluo" }).eq("id", emp.prendaId);
        } else {
          const e = getStore().empenos.find((x) => x.id === empenoId);
          if (e) e.estado = "cancelado";
          const p = getStore().prendas.find((x) => x.id === emp.prendaId);
          if (p) p.estado = "en_avaluo";
        }
      }
    }
  }

  await bitacoraAuto(aprobada ? "Autorización aprobada" : "Autorización rechazada", comentario, id);
  revalidatePath("/autorizaciones");
  if (empenoId) revalidatePath(`/empenos/${empenoId}`);
}

/** Marca el resultado de una cotización: si terminó en empeño o el motivo de rechazo. */
export async function marcarResultadoCotizacion(id: string, seEmpeno: boolean, motivo: string | null) {
  if (await esInvitado()) return;
  const estado: EstadoCotizacion = seEmpeno ? "convertida" : "rechazada";
  if (supabaseConfigured) {
    const { error } = await getServerSupabase()
      .from("cotizaciones")
      .update({ se_empeno: seEmpeno, motivo_no: seEmpeno ? null : motivo, estado })
      .eq("id", id);
    if (error) throw error;
  } else {
    const c = getStore().cotizaciones.find((x) => x.id === id);
    if (c) {
      c.seEmpeno = seEmpeno;
      c.motivoNo = seEmpeno ? null : motivo;
      c.estado = estado;
    }
  }
  revalidatePath("/cotizaciones");
}

// ----------------- AVALÚO DEL MECÁNICO -----------------

/** Envía la cotización del vehículo al mecánico para que dé su avalúo (retro). */
export async function solicitarAvaluoMecanico(cotizacionId: string): Promise<{ ok: boolean }> {
  if (await esInvitado()) return { ok: false };
  if (supabaseConfigured) {
    const { error } = await getServerSupabase()
      .from("cotizaciones")
      .update({ avaluo_estado: "solicitado" })
      .eq("id", cotizacionId);
    if (error) throw error;
  } else {
    const c = getStore().cotizaciones.find((x) => x.id === cotizacionId);
    if (c) c.avaluoEstado = "solicitado";
  }
  const cot = await obtenerCotizacion(cotizacionId);
  const tel = process.env.MECANICO_TEL;
  if (tel && cot) {
    const fb = cot.busquedaFacebook ? formatMXN(cot.busquedaFacebook) : "s/d";
    await enviarWhatsApp(
      tel,
      `🔧 Vehículo para avalúo\n${cot.descripcion}${cot.modelo ? ` (${cot.modelo})` : ""}\nValor de referencia (Facebook): ${fb}\n\nDa tu retroalimentación aquí:\n${APP_URL}/avaluos`
    ).catch(() => {});
  }
  revalidatePath("/cotizaciones");
  revalidatePath("/avaluos");
  return { ok: true };
}

/** El mecánico guarda su avalúo (monto, comentario y checklist) sobre el vehículo. */
export async function responderAvaluoMecanico(
  cotizacionId: string,
  monto: number,
  comentario: string | null,
  checklist: Record<string, string> | null = null
) {
  const u = await getUsuarioActual();
  if (!u || !["mecanico", "admin", "gerente"].includes(u.rol)) throw new Error("No autorizado");
  if (supabaseConfigured) {
    const { error } = await getServerSupabase()
      .from("cotizaciones")
      .update({ avaluo_mecanico: monto, comentario_mecanico: comentario, checklist_mecanico: checklist, avaluo_estado: "respondido" })
      .eq("id", cotizacionId);
    if (error) throw error;
  } else {
    const c = getStore().cotizaciones.find((x) => x.id === cotizacionId);
    if (c) {
      c.avaluoMecanico = monto;
      c.comentarioMecanico = comentario;
      c.checklistMecanico = checklist;
      c.avaluoEstado = "respondido";
    }
  }
  await bitacoraAuto("Avalúo del mecánico", `${formatMXN(monto)}`, cotizacionId);
  revalidatePath("/avaluos");
  revalidatePath("/cotizaciones");
}

/** Guarda la firma digital del consumidor en el empeño (respaldo electrónico). */
export async function guardarFirmaEmpeno(empenoId: string, firmaDataUrl: string) {
  if (await esInvitado()) return;
  // La firma (cadena vacía = borrar) debe ser una imagen dataURL de tamaño razonable.
  if (firmaDataUrl && (!firmaDataUrl.startsWith("data:image/") || firmaDataUrl.length > 400_000)) return;
  const empenoFirma = await obtenerEmpeno(empenoId);
  if (!empenoFirma) return;
  // No sobrescribir una firma ya registrada (evita manipulación desde el enlace público).
  if (empenoFirma.firmaCliente && firmaDataUrl) return;
  const ahora = new Date().toISOString();
  if (supabaseConfigured) {
    const { error } = await getServerSupabase()
      .from("empenos")
      .update({ firma_cliente: firmaDataUrl, firma_fecha: ahora })
      .eq("id", empenoId);
    if (error) throw error;
  } else {
    const e = getStore().empenos.find((x) => x.id === empenoId);
    if (e) {
      e.firmaCliente = firmaDataUrl;
      e.firmaFecha = ahora;
    }
  }
  await bitacoraAuto("Contrato firmado por el cliente", null, empenoId);
  revalidatePath(`/empenos/${empenoId}/contrato`);
  revalidatePath(`/firmar/${empenoId}`);
}

/** Envía al cliente por WhatsApp el enlace del contrato para que lo revise y firme. */
export async function enviarContratoWhatsApp(empenoId: string): Promise<void> {
  if (await esInvitado()) return;
  const e = await obtenerEmpeno(empenoId);
  if (!e) return;
  await enviarWhatsApp(
    e.cliente.telefono,
    `Hola ${e.cliente.nombre}, aquí está tu contrato de empeño ${e.folio}. Ábrelo para revisarlo y firmarlo:\n${APP_URL}/firmar/${empenoId}`
  ).catch(() => {});
  await bitacoraAuto("Contrato enviado al cliente por WhatsApp", null, e.folio);
  revalidatePath(`/empenos/${empenoId}/contrato`);
}

/** Adjunta un documento del vehículo (foto/PDF) a una cotización. */
export async function subirDocumentoCotizacion(cotizacionId: string, dataUrl: string): Promise<string | null> {
  if (await esInvitado()) return null;
  const p = dividirDataUrl(dataUrl);
  if (!p || !supabaseConfigured) return null;
  const sb = getServerSupabase();
  const ext = p.mime.split("/")[1] || "jpg";
  const path = `cotizaciones/${cotizacionId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const { error } = await sb.storage
    .from("prendas")
    .upload(path, Buffer.from(p.base64, "base64"), { contentType: p.mime, upsert: false });
  if (error) return null;
  const url = sb.storage.from("prendas").getPublicUrl(path).data.publicUrl;
  const { data } = await sb.from("cotizaciones").select("documentos").eq("id", cotizacionId).single();
  const docs = [...(((data?.documentos as string[]) ?? [])), url];
  await sb.from("cotizaciones").update({ documentos: docs }).eq("id", cotizacionId);
  await bitacoraAuto("Documento adjuntado a cotización", url, cotizacionId);
  revalidatePath("/cotizaciones");
  return url;
}

// ----------------- CITAS DE GPS -----------------

/** Avisa por WhatsApp al cliente y al equipo cuando se agenda una cita de GPS. */
async function notificarCitaAgendada(input: CitaGpsInput) {
  const dir = SUCURSAL.direccion ?? "";
  const cuando = `${formatFecha(input.fecha)} a las ${input.hora} hrs`;
  if (input.telefono) {
    const saludo = input.clienteNombre ? ` ${input.clienteNombre}` : "";
    await enviarWhatsApp(
      input.telefono,
      `Hola${saludo}, tu cita para la instalación del GPS quedó agendada:\n\n📅 ${cuando}\n📍 ${SUCURSAL.nombre} — ${dir}\n\nGracias por tu preferencia.`
    ).catch(() => {});
  }
  const equipo = process.env.GPS_EQUIPO_TEL;
  if (equipo) {
    await enviarWhatsApp(
      equipo,
      `🔔 Nueva cita de GPS\n${cuando}\nCliente: ${input.clienteNombre ?? "—"} (${input.telefono ?? "s/tel"})\nVehículo: ${input.vehiculo ?? "s/d"}`
    ).catch(() => {});
  }
}

export async function agendarCitaGps(input: CitaGpsInput): Promise<{ ok: boolean; error?: string }> {
  const actual = await getUsuarioActual();
  if (actual?.rol === "invitado") return { ok: false, error: "En modo demo no se agendan citas." };
  // Esta acción la usa tanto la página pública (sin sesión) como el personal
  // desde /gps/citas — el honeypot/rate-limit solo aplica al público.
  if (!actual?.esSesionReal) {
    if (input.honeypot) return { ok: true }; // bot: finge éxito, no revela que se detectó
    if (await limitadoPorIP("agendar-gps")) return { ok: false, error: "Demasiados intentos. Espera unos minutos." };
  }
  if (!input.fecha || !input.hora) return { ok: false, error: "Falta fecha u hora." };
  // Página pública: exigir nombre y un teléfono válido (mitiga abuso/spam).
  if (!input.clienteNombre || !input.clienteNombre.trim()) return { ok: false, error: "Falta el nombre." };
  if (!formatearNumeroMX(input.telefono)) return { ok: false, error: "Teléfono inválido." };
  if (input.fecha < hoyISO()) return { ok: false, error: "La fecha ya pasó." };

  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data: ocupado } = await sb
      .from("citas_gps")
      .select("id")
      .eq("fecha", input.fecha)
      .eq("hora", input.hora)
      .neq("estado", "cancelada");
    if (ocupado && ocupado.length > 0) return { ok: false, error: "Ese horario ya está ocupado." };
    const { error } = await sb.from("citas_gps").insert({
      fecha: input.fecha,
      hora: input.hora,
      cliente_nombre: input.clienteNombre,
      telefono: input.telefono,
      vehiculo: input.vehiculo,
      notas: input.notas,
      estado: "agendada",
    });
    if (error) throw error;
    await bitacoraAuto("Cita de GPS agendada", `${input.fecha} ${input.hora}`, input.clienteNombre);
    await notificarCitaAgendada(input);
    revalidatePath("/gps/citas");
    return { ok: true };
  }

  const store = getStore();
  if (store.citasGps.some((c) => c.fecha === input.fecha && c.hora === input.hora && c.estado !== "cancelada")) {
    return { ok: false, error: "Ese horario ya está ocupado." };
  }
  const cita: CitaGps = {
    id: nuevoId("cita"),
    fecha: input.fecha,
    hora: input.hora,
    clienteNombre: input.clienteNombre,
    telefono: input.telefono,
    vehiculo: input.vehiculo,
    empenoId: null,
    estado: "agendada",
    notas: input.notas,
    creadoEn: new Date().toISOString(),
  };
  store.citasGps.push(cita);
  await notificarCitaAgendada(input);
  revalidatePath("/gps/citas");
  return { ok: true };
}

/** Recordatorio de citas de GPS del día siguiente (para el cron). */
export async function enviarRecordatoriosCitasGps(): Promise<{ enviados: number; fallidos: number }> {
  const manana = sumarDiasISO(hoyISO(), 1);
  const citas = (await listarCitasGps()).filter(
    (c) => c.estado === "agendada" && c.fecha === manana && c.telefono
  );
  let enviados = 0;
  let fallidos = 0;
  for (const c of citas) {
    const r = await enviarWhatsApp(
      c.telefono,
      `Recordatorio: mañana ${formatFecha(c.fecha)} a las ${c.hora} hrs es tu cita de instalación de GPS en ${SUCURSAL.nombre}, ${SUCURSAL.direccion ?? ""}. Te esperamos.`
    );
    if (r.ok) enviados++;
    else fallidos++;
  }
  return { enviados, fallidos };
}

// ----------------- ENCUESTA DE SATISFACCIÓN -----------------

/** Guarda una respuesta de la encuesta (pública, la responde el cliente). */
export async function guardarEncuesta(input: EncuestaInput): Promise<{ ok: boolean }> {
  if (supabaseConfigured) {
    const { error } = await getServerSupabase().from("encuestas").insert({
      amable: input.amable,
      tiempo_adecuado: input.tiempoAdecuado,
      resolvio_dudas: input.resolvioDudas,
      ofrecio_alternativas: input.ofrecioAlternativas,
      profesionalismo_satisfecho: input.profesionalismoSatisfecho,
      comunicacion_facil: input.comunicacionFacil,
      horario_satisfecho: input.horarioSatisfecho,
      calificacion: input.calificacion,
      comentario: input.comentario,
    });
    if (error) throw error;
  } else {
    getStore().encuestas.push({ id: nuevoId("enc"), ...input, creadoEn: new Date().toISOString() });
  }
  revalidatePath("/encuestas");
  return { ok: true };
}

export async function actualizarEstadoCitaGps(id: string, estado: EstadoCitaGps) {
  if (await esInvitado()) return;
  if (supabaseConfigured) {
    const { error } = await getServerSupabase().from("citas_gps").update({ estado }).eq("id", id);
    if (error) throw error;
  } else {
    const c = getStore().citasGps.find((x) => x.id === id);
    if (c) c.estado = estado;
  }
  revalidatePath("/gps/citas");
}
