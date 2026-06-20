// Repositorio: consultas de lectura usadas por las páginas (Server Components).
import type {
  Cliente,
  Prenda,
  Empeno,
  EmpenoConDetalle,
  MovimientoCaja,
} from "@/lib/types";
import { getStore } from "./store";

export async function listarClientes(): Promise<Cliente[]> {
  return getStore().clientes.slice().sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function obtenerCliente(id: string): Promise<Cliente | null> {
  return getStore().clientes.find((c) => c.id === id) ?? null;
}

export async function listarPrendas(): Promise<Prenda[]> {
  return getStore().prendas.slice().sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function obtenerPrenda(id: string): Promise<Prenda | null> {
  return getStore().prendas.find((p) => p.id === id) ?? null;
}

/** Prendas disponibles para asignar a un nuevo empeño (en avalúo o desempeñadas). */
export async function listarPrendasDisponibles(): Promise<Prenda[]> {
  return getStore().prendas.filter(
    (p) => p.estado === "en_avaluo" || p.estado === "desempenada"
  );
}

export async function listarEmpenos(): Promise<EmpenoConDetalle[]> {
  const { empenos, clientes, prendas } = getStore();
  return empenos
    .slice()
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
    .map((e) => enriquecer(e, clientes, prendas))
    .filter((e): e is EmpenoConDetalle => e !== null);
}

export async function obtenerEmpeno(id: string): Promise<EmpenoConDetalle | null> {
  const { empenos, clientes, prendas } = getStore();
  const e = empenos.find((x) => x.id === id);
  if (!e) return null;
  return enriquecer(e, clientes, prendas);
}

function enriquecer(
  e: Empeno,
  clientes: Cliente[],
  prendas: Prenda[]
): EmpenoConDetalle | null {
  const cliente = clientes.find((c) => c.id === e.clienteId);
  const prenda = prendas.find((p) => p.id === e.prendaId);
  if (!cliente || !prenda) return null;
  return { ...e, cliente, prenda };
}

export async function listarMovimientos(): Promise<MovimientoCaja[]> {
  return getStore().movimientos.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function movimientosDelDia(fechaISO: string): Promise<MovimientoCaja[]> {
  return getStore()
    .movimientos.filter((m) => m.fecha.slice(0, 10) === fechaISO)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}
