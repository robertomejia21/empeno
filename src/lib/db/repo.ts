// Repositorio: consultas de lectura usadas por las páginas (Server Components).
// Usa Supabase si está configurado; de lo contrario, el almacén en memoria.
import type {
  Cliente,
  Prenda,
  Empeno,
  EmpenoConDetalle,
  MovimientoCaja,
} from "@/lib/types";
import type { Venta, Compra, Apartado, Usuario, Bitacora, CorteCaja, Pago } from "@/lib/types";
import { getStore } from "./store";
import { supabaseConfigured, getServerSupabase } from "@/lib/supabase/server";
import {
  rowToCliente,
  rowToPrenda,
  rowToEmpeno,
  rowToMovimiento,
  rowToVenta,
  rowToCompra,
  rowToApartado,
  rowToUsuario,
  rowToBitacora,
  rowToCorte,
  rowToPago,
} from "@/lib/supabase/map";

export async function listarClientes(): Promise<Cliente[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("clientes")
      .select("*")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToCliente);
  }
  return getStore().clientes.slice().sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function obtenerCliente(id: string): Promise<Cliente | null> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("clientes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToCliente(data) : null;
  }
  return getStore().clientes.find((c) => c.id === id) ?? null;
}

export async function listarPrendas(): Promise<Prenda[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("prendas")
      .select("*")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToPrenda);
  }
  return getStore().prendas.slice().sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function obtenerPrenda(id: string): Promise<Prenda | null> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("prendas")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToPrenda(data) : null;
  }
  return getStore().prendas.find((p) => p.id === id) ?? null;
}

/** Prendas disponibles para asignar a un nuevo empeño (en avalúo o desempeñadas). */
export async function listarPrendasDisponibles(): Promise<Prenda[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("prendas")
      .select("*")
      .in("estado", ["en_avaluo", "desempenada"])
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToPrenda);
  }
  return getStore().prendas.filter(
    (p) => p.estado === "en_avaluo" || p.estado === "desempenada"
  );
}

export async function listarEmpenos(): Promise<EmpenoConDetalle[]> {
  if (supabaseConfigured) {
    const sb = getServerSupabase();
    const { data, error } = await sb
      .from("empenos")
      .select("*, cliente:clientes(*), prenda:prendas(*)")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return (data ?? [])
      .map((r) => {
        if (!r.cliente || !r.prenda) return null;
        return {
          ...rowToEmpeno(r),
          cliente: rowToCliente(r.cliente),
          prenda: rowToPrenda(r.prenda),
        } as EmpenoConDetalle;
      })
      .filter((e): e is EmpenoConDetalle => e !== null);
  }
  const { empenos, clientes, prendas } = getStore();
  return empenos
    .slice()
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
    .map((e) => enriquecer(e, clientes, prendas))
    .filter((e): e is EmpenoConDetalle => e !== null);
}

export async function obtenerEmpeno(id: string): Promise<EmpenoConDetalle | null> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("empenos")
      .select("*, cliente:clientes(*), prenda:prendas(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.cliente || !data.prenda) return null;
    return {
      ...rowToEmpeno(data),
      cliente: rowToCliente(data.cliente),
      prenda: rowToPrenda(data.prenda),
    };
  }
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
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("movimientos_caja")
      .select("*")
      .order("fecha", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToMovimiento);
  }
  return getStore().movimientos.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function obtenerMovimiento(id: string): Promise<MovimientoCaja | null> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("movimientos_caja")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToMovimiento(data) : null;
  }
  return getStore().movimientos.find((m) => m.id === id) ?? null;
}

export async function movimientosDelDia(fechaISO: string): Promise<MovimientoCaja[]> {
  const todos = await listarMovimientos();
  return todos.filter((m) => m.fecha.slice(0, 10) === fechaISO);
}

/** Prendas a la venta (vencidas enviadas a remate). */
export async function listarPrendasEnVenta(): Promise<Prenda[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("prendas")
      .select("*")
      .eq("estado", "en_venta")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToPrenda);
  }
  return getStore().prendas.filter((p) => p.estado === "en_venta");
}

export async function listarVentas(): Promise<Venta[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("ventas")
      .select("*")
      .order("fecha", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToVenta);
  }
  return getStore().ventas.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function listarCompras(): Promise<Compra[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("compras")
      .select("*")
      .order("fecha", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToCompra);
  }
  return getStore().compras.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function listarApartados(): Promise<Apartado[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("apartados")
      .select("*")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToApartado);
  }
  return getStore().apartados.slice().sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function listarUsuarios(): Promise<Usuario[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("usuarios")
      .select("id, nombre, email, rol, activo, creado_en")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToUsuario);
  }
  return [];
}

export async function obtenerPago(id: string): Promise<Pago | null> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase().from("pagos").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? rowToPago(data) : null;
  }
  return getStore().pagos.find((p) => p.id === id) ?? null;
}

export async function listarPagosCliente(clienteId: string): Promise<Pago[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("pagos")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("fecha", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToPago);
  }
  return getStore().pagos.filter((p) => p.clienteId === clienteId).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function contarRefrendos(empenoId: string): Promise<number> {
  if (supabaseConfigured) {
    const { count } = await getServerSupabase()
      .from("pagos")
      .select("id", { count: "exact", head: true })
      .eq("empeno_id", empenoId)
      .eq("tipo", "refrendo");
    return count ?? 0;
  }
  return getStore().pagos.filter((p) => p.empenoId === empenoId && p.tipo === "refrendo").length;
}

export async function listarCortes(): Promise<CorteCaja[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("cortes_caja")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(60);
    if (error) throw error;
    return (data ?? []).map(rowToCorte);
  }
  return getStore().cortes.slice().sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function listarBitacora(limite = 200): Promise<Bitacora[]> {
  if (supabaseConfigured) {
    const { data, error } = await getServerSupabase()
      .from("bitacora")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(limite);
    if (error) throw error;
    return (data ?? []).map(rowToBitacora);
  }
  return getStore().bitacora.slice(0, limite);
}
