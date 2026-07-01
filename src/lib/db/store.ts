// Almacén en memoria (demo). Persiste durante la vida del proceso del servidor.
// Cuando configures Supabase, la capa de repositorio puede apuntarse a la BD real.
import type {
  Cliente,
  Prenda,
  Empeno,
  MovimientoCaja,
  Venta,
  Compra,
  Apartado,
  Bitacora,
  CorteCaja,
} from "@/lib/types";
import {
  clientesSeed,
  prendasSeed,
  empenosSeed,
  movimientosSeed,
} from "./seed";

interface Store {
  clientes: Cliente[];
  prendas: Prenda[];
  empenos: Empeno[];
  movimientos: MovimientoCaja[];
  ventas: Venta[];
  compras: Compra[];
  apartados: Apartado[];
  bitacora: Bitacora[];
  cortes: CorteCaja[];
  pagos: import("@/lib/types").Pago[];
}

// Usar globalThis evita que el hot-reload de Next reinicie los datos en dev.
const g = globalThis as unknown as { __empenoStore?: Store };

export function getStore(): Store {
  if (!g.__empenoStore) {
    g.__empenoStore = {
      clientes: structuredClone(clientesSeed),
      prendas: structuredClone(prendasSeed),
      empenos: structuredClone(empenosSeed),
      movimientos: structuredClone(movimientosSeed),
      ventas: [],
      compras: [],
      apartados: [],
      bitacora: [],
      cortes: [],
      pagos: [],
    };
  }
  return g.__empenoStore;
}

export function nuevoId(prefijo: string): string {
  return `${prefijo}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Genera el siguiente folio consecutivo tipo PREFIJO-0001 */
export function siguienteFolio(
  items: { folio: string }[],
  prefijo: string
): string {
  const max = items.reduce((acc, it) => {
    const m = it.folio.match(/(\d+)$/);
    const n = m ? parseInt(m[1], 10) : 0;
    return Math.max(acc, n);
  }, 0);
  return `${prefijo}-${String(max + 1).padStart(4, "0")}`;
}
