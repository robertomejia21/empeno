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
} from "@/lib/types";
import { getStore, nuevoId, siguienteFolio } from "@/lib/db/store";
import { calcularVencimiento, calcularLiquidacion } from "@/lib/interes";

function s(form: FormData, key: string): string {
  return (form.get(key) as string | null)?.trim() ?? "";
}
function sn(form: FormData, key: string): string | null {
  const v = s(form, key);
  return v === "" ? null : v;
}
function n(form: FormData, key: string): number {
  const v = parseFloat(s(form, key).replace(/,/g, ""));
  return Number.isFinite(v) ? v : 0;
}

// ----------------- CLIENTES -----------------

export async function crearCliente(form: FormData) {
  const store = getStore();
  const cliente: Cliente = {
    id: nuevoId("c"),
    nombre: s(form, "nombre"),
    apellidoPaterno: s(form, "apellidoPaterno"),
    apellidoMaterno: s(form, "apellidoMaterno"),
    curp: sn(form, "curp"),
    rfc: sn(form, "rfc"),
    telefono: sn(form, "telefono"),
    email: sn(form, "email"),
    tipoIdentificacion: (s(form, "tipoIdentificacion") || "INE") as TipoIdentificacion,
    numeroIdentificacion: s(form, "numeroIdentificacion"),
    direccion: sn(form, "direccion"),
    fechaNacimiento: sn(form, "fechaNacimiento"),
    notas: sn(form, "notas"),
    creadoEn: new Date().toISOString(),
  };
  store.clientes.push(cliente);
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function actualizarCliente(id: string, form: FormData) {
  const store = getStore();
  const c = store.clientes.find((x) => x.id === id);
  if (!c) return;
  Object.assign(c, {
    nombre: s(form, "nombre"),
    apellidoPaterno: s(form, "apellidoPaterno"),
    apellidoMaterno: s(form, "apellidoMaterno"),
    curp: sn(form, "curp"),
    rfc: sn(form, "rfc"),
    telefono: sn(form, "telefono"),
    email: sn(form, "email"),
    tipoIdentificacion: (s(form, "tipoIdentificacion") || "INE") as TipoIdentificacion,
    numeroIdentificacion: s(form, "numeroIdentificacion"),
    direccion: sn(form, "direccion"),
    fechaNacimiento: sn(form, "fechaNacimiento"),
    notas: sn(form, "notas"),
  });
  revalidatePath("/clientes");
  redirect(`/clientes/${id}`);
}

// ----------------- PRENDAS / AVALÚOS -----------------

export async function crearPrenda(form: FormData) {
  const store = getStore();
  const valorAvaluo = n(form, "valorAvaluo");
  const prenda: Prenda = {
    id: nuevoId("p"),
    folio: siguienteFolio(store.prendas, "PR"),
    categoria: (s(form, "categoria") || "Otro") as CategoriaPrenda,
    descripcion: s(form, "descripcion"),
    marca: sn(form, "marca"),
    submarca: sn(form, "submarca"),
    modelo: sn(form, "modelo"),
    color: sn(form, "color"),
    serie: sn(form, "serie"),
    placas: sn(form, "placas"),
    metal: sn(form, "metal"),
    kilataje: sn(form, "kilataje"),
    gramos: form.get("gramos") ? n(form, "gramos") : null,
    valorAvaluo,
    montoPrestamoSugerido: form.get("montoPrestamoSugerido")
      ? n(form, "montoPrestamoSugerido")
      : Math.round(valorAvaluo * 0.5 * 100) / 100,
    estado: "en_avaluo",
    fotos: [],
    ubicacionResguardo: sn(form, "ubicacionResguardo"),
    notas: sn(form, "notas"),
    creadoEn: new Date().toISOString(),
  };
  store.prendas.push(prenda);
  revalidatePath("/prendas");
  redirect("/prendas");
}

// ----------------- EMPEÑOS -----------------

export async function crearEmpeno(form: FormData) {
  const store = getStore();
  const fechaInicio = s(form, "fechaInicio") || new Date().toISOString().slice(0, 10);
  const periodo = (s(form, "periodo") || "mensual") as PeriodoInteres;
  const plazoPeriodos = Math.max(1, Math.round(n(form, "plazoPeriodos")) || 1);
  const montoPrestado = n(form, "montoPrestado");
  const prendaId = s(form, "prendaId");

  const empeno: Empeno = {
    id: nuevoId("e"),
    folio: siguienteFolio(store.empenos, "EM"),
    clienteId: s(form, "clienteId"),
    prendaId,
    montoPrestado,
    tasaInteres: n(form, "tasaInteres"),
    periodo,
    plazoPeriodos,
    fechaInicio,
    fechaVencimiento: calcularVencimiento(fechaInicio, periodo, plazoPeriodos),
    diasGracia: form.get("diasGracia") ? Math.round(n(form, "diasGracia")) : 7,
    estado: "activo",
    notas: sn(form, "notas"),
    creadoEn: new Date().toISOString(),
  };
  store.empenos.push(empeno);

  // La prenda pasa a estar empeñada
  const prenda = store.prendas.find((p) => p.id === prendaId);
  if (prenda) prenda.estado = "empenada";

  // Movimiento de caja: salida de capital
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

  revalidatePath("/empenos");
  revalidatePath("/caja");
  redirect(`/empenos/${empeno.id}`);
}

/** Refrendo: el cliente paga el interés y se renueva un periodo. */
export async function refrendarEmpeno(id: string) {
  const store = getStore();
  const e = store.empenos.find((x) => x.id === id);
  if (!e) return;
  const calc = calcularLiquidacion(e);

  // Renovar: nueva fecha de inicio = hoy; recalcular vencimiento
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

  revalidatePath(`/empenos/${id}`);
  revalidatePath("/empenos");
  revalidatePath("/caja");
}

/** Desempeño: el cliente liquida capital + interés y recupera su prenda. */
export async function desempenarEmpeno(id: string) {
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

  revalidatePath(`/empenos/${id}`);
  revalidatePath("/empenos");
  revalidatePath("/caja");
}

// ----------------- CAJA -----------------

export async function registrarMovimiento(form: FormData) {
  const store = getStore();
  const tipo = (s(form, "tipo") || "gasto") as TipoMovimiento;
  const entradas: TipoMovimiento[] = ["desempeno", "refrendo", "abono", "venta", "apertura", "deposito"];
  const mov: MovimientoCaja = {
    id: nuevoId("m"),
    fecha: new Date().toISOString(),
    tipo,
    monto: n(form, "monto"),
    esEntrada: entradas.includes(tipo),
    concepto: s(form, "concepto") || "Movimiento manual",
    empenoId: null,
    referencia: sn(form, "referencia"),
    creadoEn: new Date().toISOString(),
  };
  store.movimientos.push(mov);
  revalidatePath("/caja");
}
