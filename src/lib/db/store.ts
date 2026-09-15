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
  cotizaciones: import("@/lib/types").Cotizacion[];
  autorizaciones: import("@/lib/types").Autorizacion[];
  citasGps: import("@/lib/types").CitaGps[];
  encuestas: import("@/lib/types").Encuesta[];
  productosInteres: import("@/lib/types").ProductoInteres[];
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
      cotizaciones: [],
      autorizaciones: [],
      citasGps: [],
      encuestas: [],
      // "tasa" es el interés por separado (lo que de verdad se usa para
      // calcular): en TRADICIONAL y COMPRA (artículos, no vehículos) el
      // almacenaje se refleja igual que el interés, así que el % que ve el
      // personal en el catálogo (ver AsistenteEmpeno) sale doblado — igual
      // que en el sistema anterior (Tradicional 10.8+10.8=21.6%, Compra
      // 0.36+0.36=0.72%). Vehículos y GPS no cargan almacenaje, se muestran tal cual.
      productosInteres: [
        { id: "pi1", nombre: "TRADICIONAL", modalidad: null, tipo: "tradicional", tasa: 10.8, periodo: "mensual", plazoPeriodos: 1, orden: 1, activo: true, creadoEn: new Date().toISOString() },
        { id: "pi2", nombre: "VEHÍCULOS", modalidad: "resguardo", tipo: "tradicional", tasa: 10.8, periodo: "mensual", plazoPeriodos: 1, orden: 2, activo: true, creadoEn: new Date().toISOString() },
        { id: "pi3", nombre: "GPS", modalidad: "gps", tipo: "tradicional", tasa: 10.8, periodo: "mensual", plazoPeriodos: 1, orden: 3, activo: true, creadoEn: new Date().toISOString() },
        { id: "pi4", nombre: "VEHÍCULOS", modalidad: "resguardo", tipo: "tradicional", tasa: 8.64, periodo: "mensual", plazoPeriodos: 1, orden: 4, activo: true, creadoEn: new Date().toISOString() },
        { id: "pi5", nombre: "VEHÍCULOS", modalidad: "resguardo", tipo: "tradicional", tasa: 6.48, periodo: "mensual", plazoPeriodos: 1, orden: 5, activo: true, creadoEn: new Date().toISOString() },
        { id: "pi6", nombre: "COMPRA", modalidad: null, tipo: "fijo", tasa: 0.36, periodo: "diario", plazoPeriodos: 1, orden: 6, activo: true, creadoEn: new Date().toISOString() },
      ],
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
