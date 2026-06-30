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
} from "@/lib/types";
import { getStore, nuevoId, siguienteFolio } from "@/lib/db/store";
import { calcularVencimiento, calcularLiquidacion } from "@/lib/interes";
import { supabaseConfigured, getServerSupabase } from "@/lib/supabase/server";
import { bitacoraAuto } from "@/lib/bitacora";
import { obtenerEmpeno, listarEmpenos, listarMovimientos } from "@/lib/db/repo";
import { enviarWhatsApp } from "@/lib/whatsapp";
import { formatMXN, formatFecha } from "@/lib/format";
import { getUsuarioActual } from "@/lib/session";

/** En modo demo (invitado) las operaciones de escritura no surten efecto. */
async function esInvitado(): Promise<boolean> {
  return (await getUsuarioActual())?.rol === "invitado";
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
    notas: sn(form, "notas"),
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
  const fechaInicio = s(form, "fechaInicio") || new Date().toISOString().slice(0, 10);
  const periodo = (s(form, "periodo") || "mensual") as PeriodoInteres;
  const plazoPeriodos = Math.max(1, Math.round(num(form, "plazoPeriodos")) || 1);
  const montoPrestado = num(form, "montoPrestado");
  const prendaId = s(form, "prendaId");
  const clienteId = s(form, "clienteId");
  const tasaInteres = num(form, "tasaInteres");
  const diasGracia = form.get("diasGracia") ? Math.round(num(form, "diasGracia")) : 7;
  const fechaVencimiento = calcularVencimiento(fechaInicio, periodo, plazoPeriodos);

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
        periodo,
        plazo_periodos: plazoPeriodos,
        fecha_inicio: fechaInicio,
        fecha_vencimiento: fechaVencimiento,
        dias_gracia: diasGracia,
        estado: "activo",
        notas: sn(form, "notas"),
      })
      .select("id, folio")
      .single();
    if (error) throw error;
    empenoId = data.id;
    await sb.from("prendas").update({ estado: "empenada" }).eq("id", prendaId);
    await sb.from("movimientos_caja").insert({
      tipo: "prestamo",
      monto: montoPrestado,
      es_entrada: false,
      concepto: `Préstamo empeño ${data.folio}`,
      empeno_id: empenoId,
      referencia: data.folio,
    });
  } else {
    const store = getStore();
    const empeno: Empeno = {
      id: nuevoId("e"),
      folio: siguienteFolio(store.empenos, "EM"),
      clienteId,
      prendaId,
      montoPrestado,
      tasaInteres,
      periodo,
      plazoPeriodos,
      fechaInicio,
      fechaVencimiento,
      diasGracia,
      estado: "activo",
      notas: sn(form, "notas"),
      creadoEn: new Date().toISOString(),
    };
    store.empenos.push(empeno);
    const prenda = store.prendas.find((p) => p.id === prendaId);
    if (prenda) prenda.estado = "empenada";
    store.movimientos.push({
      id: nuevoId("m"),
      fecha: new Date().toISOString(),
      tipo: "prestamo",
      monto: montoPrestado,
      esEntrada: false,
      concepto: `Préstamo empeño ${empeno.folio}`,
      empenoId: empeno.id,
      referencia: empeno.folio,
      creadoEn: new Date().toISOString(),
    });
    empenoId = empeno.id;
  }

  await bitacoraAuto("Empeño creado", `Préstamo ${montoPrestado} MXN`, null);
  revalidatePath("/empenos");
  revalidatePath("/caja");
  redirect(`/empenos/${empenoId}`);
}

/** Refrendo: el cliente paga el interés y se renueva un periodo. */
export async function refrendarEmpeno(id: string) {
  if (await esInvitado()) return;
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data, error } = await sb.from("empenos").select("*").eq("id", id).single();
    if (error) throw error;
    const calc = calcularLiquidacion({
      montoPrestado: Number(data.monto_prestado),
      tasaInteres: Number(data.tasa_interes),
      periodo: data.periodo,
      fechaInicio: data.fecha_inicio,
      fechaVencimiento: data.fecha_vencimiento,
      diasGracia: data.dias_gracia,
    });
    const hoy = new Date().toISOString().slice(0, 10);
    await sb
      .from("empenos")
      .update({
        fecha_inicio: hoy,
        fecha_vencimiento: calcularVencimiento(hoy, data.periodo, data.plazo_periodos),
        estado: "refrendado",
      })
      .eq("id", id);
    await sb.from("movimientos_caja").insert({
      tipo: "refrendo",
      monto: calc.totalRefrendo,
      es_entrada: true,
      concepto: `Refrendo empeño ${data.folio}`,
      empeno_id: id,
      referencia: data.folio,
    });
  } else {
    const store = getStore();
    const e = store.empenos.find((x) => x.id === id);
    if (!e) return;
    const calc = calcularLiquidacion(e);
    const hoy = new Date().toISOString().slice(0, 10);
    e.fechaInicio = hoy;
    e.fechaVencimiento = calcularVencimiento(hoy, e.periodo, e.plazoPeriodos);
    e.estado = "refrendado";
    store.movimientos.push({
      id: nuevoId("m"),
      fecha: new Date().toISOString(),
      tipo: "refrendo",
      monto: calc.totalRefrendo,
      esEntrada: true,
      concepto: `Refrendo empeño ${e.folio}`,
      empenoId: e.id,
      referencia: e.folio,
      creadoEn: new Date().toISOString(),
    });
  }
  await bitacoraAuto("Refrendo registrado", null, `empeño ${id}`);
  revalidatePath(`/empenos/${id}`);
  revalidatePath("/empenos");
  revalidatePath("/caja");
}

/** Desempeño: el cliente liquida capital + interés y recupera su prenda. */
export async function desempenarEmpeno(id: string) {
  if (await esInvitado()) return;
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data, error } = await sb.from("empenos").select("*").eq("id", id).single();
    if (error) throw error;
    const calc = calcularLiquidacion({
      montoPrestado: Number(data.monto_prestado),
      tasaInteres: Number(data.tasa_interes),
      periodo: data.periodo,
      fechaInicio: data.fecha_inicio,
      fechaVencimiento: data.fecha_vencimiento,
      diasGracia: data.dias_gracia,
    });
    await sb.from("empenos").update({ estado: "desempenado" }).eq("id", id);
    await sb.from("prendas").update({ estado: "desempenada" }).eq("id", data.prenda_id);
    await sb.from("movimientos_caja").insert({
      tipo: "desempeno",
      monto: calc.totalDesempeno,
      es_entrada: true,
      concepto: `Desempeño empeño ${data.folio}`,
      empeno_id: id,
      referencia: data.folio,
    });
  } else {
    const store = getStore();
    const e = store.empenos.find((x) => x.id === id);
    if (!e) return;
    const calc = calcularLiquidacion(e);
    e.estado = "desempenado";
    const prenda = store.prendas.find((p) => p.id === e.prendaId);
    if (prenda) prenda.estado = "desempenada";
    store.movimientos.push({
      id: nuevoId("m"),
      fecha: new Date().toISOString(),
      tipo: "desempeno",
      monto: calc.totalDesempeno,
      esEntrada: true,
      concepto: `Desempeño empeño ${e.folio}`,
      empenoId: e.id,
      referencia: e.folio,
      creadoEn: new Date().toISOString(),
    });
  }
  await bitacoraAuto("Desempeño registrado", null, `empeño ${id}`);
  revalidatePath(`/empenos/${id}`);
  revalidatePath("/empenos");
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
          tipo_identificacion: cn.tipoIdentificacion,
          numero_identificacion: cn.numeroIdentificacion,
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
        periodo: data.periodo,
        plazo_periodos: data.plazoPeriodos,
        fecha_inicio: data.fechaInicio,
        fecha_vencimiento: fechaVencimiento,
        dias_gracia: data.diasGracia,
        estado: "activo",
        notas: data.notas,
      })
      .select("id, folio")
      .single();
    if (ee) throw ee;

    // 4) Salida de caja
    await sb.from("movimientos_caja").insert({
      tipo: "prestamo",
      monto: data.montoPrestado,
      es_entrada: false,
      concepto: `Préstamo empeño ${e.folio}`,
      empeno_id: e.id,
      referencia: e.folio,
    });

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
      fechaNacimiento: null,
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
    periodo: data.periodo,
    plazoPeriodos: data.plazoPeriodos,
    fechaInicio: data.fechaInicio,
    fechaVencimiento,
    diasGracia: data.diasGracia,
    estado: "activo",
    notas: data.notas,
    creadoEn: ts,
  };
  store.empenos.push(empeno);
  store.movimientos.push({
    id: nuevoId("m"),
    fecha: ts,
    tipo: "prestamo",
    monto: data.montoPrestado,
    esEntrada: false,
    concepto: `Préstamo empeño ${empeno.folio}`,
    empenoId: empeno.id,
    referencia: empeno.folio,
    creadoEn: ts,
  });

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
  revalidatePath("/remates");
  revalidatePath("/empenos");
  revalidatePath("/prendas");
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
  const datos = {
    tipo,
    monto: num(form, "monto"),
    es_entrada: entradas.includes(tipo),
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
}

// ----------------- CORTE DE CAJA -----------------

export async function registrarCorte(form: FormData) {
  if (await esInvitado()) return;
  const contado = num(form, "contado");
  const notas = sn(form, "notas");
  const hoy = new Date().toISOString().slice(0, 10);

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
