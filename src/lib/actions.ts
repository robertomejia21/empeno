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
} from "@/lib/types";
import { getStore, nuevoId, siguienteFolio } from "@/lib/db/store";
import { calcularVencimiento, calcularLiquidacion } from "@/lib/interes";
import { supabaseConfigured, getServerSupabase } from "@/lib/supabase/server";

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

  revalidatePath("/empenos");
  revalidatePath("/caja");
  redirect(`/empenos/${empenoId}`);
}

/** Refrendo: el cliente paga el interés y se renueva un periodo. */
export async function refrendarEmpeno(id: string) {
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
  revalidatePath(`/empenos/${id}`);
  revalidatePath("/empenos");
  revalidatePath("/caja");
}

/** Desempeño: el cliente liquida capital + interés y recupera su prenda. */
export async function desempenarEmpeno(id: string) {
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

  revalidatePaths();
  return { empenoId: empeno.id, folio: empeno.folio };
}

// ----------------- CAJA -----------------

export async function registrarMovimiento(form: FormData) {
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

function revalidatePaths() {
  revalidatePath("/empenos");
  revalidatePath("/clientes");
  revalidatePath("/prendas");
  revalidatePath("/caja");
  revalidatePath("/");
}
