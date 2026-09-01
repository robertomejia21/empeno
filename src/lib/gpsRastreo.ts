import "server-only";

// Integración con el proveedor de rastreo GPS de los vehículos en garantía
// (modalidad "gps": el cliente conserva el vehículo con un dispositivo
// instalado). Deliberadamente genérica: mientras no sepamos qué proveedor
// usa Roberto, este archivo define el contrato — qué necesitamos configurar
// y qué devolvemos — sin inventar datos de ubicación falsos.
//
// Para conectar el proveedor real cuando se confirme cuál es:
//   1. Agrega sus credenciales a las env vars de abajo (o las que pida su API).
//   2. Reemplaza el cuerpo de `obtenerUbicacionVivo` por la llamada real a su
//      API (REST, la mayoría da lat/lng + timestamp por device ID).
//   3. `rastreoHabilitado()` ya controla que el resto de la UI se muestre
//      apagado hasta que esto esté configurado — no hace falta tocar nada más.

const URL = process.env.GPS_TRACKING_URL;
const KEY = process.env.GPS_TRACKING_API_KEY;

/** ¿Hay un proveedor de rastreo en vivo configurado? */
export function rastreoHabilitado(): boolean {
  return Boolean(URL && KEY);
}

export interface UbicacionVehiculo {
  lat: number;
  lng: number;
  velocidadKmh: number | null;
  actualizadoEn: string; // ISO — cuándo reportó el dispositivo por última vez
  direccion: string | null; // dirección legible, si el proveedor la da
}

export type ResultadoUbicacion =
  | { ok: true; ubicacion: UbicacionVehiculo }
  | { ok: false; error: string };

/**
 * Consulta la ubicación en vivo de un vehículo por el ID de dispositivo que
 * asigna el proveedor de GPS (no el folio interno de la prenda).
 *
 * TODO: sin proveedor confirmado todavía — devuelve "no configurado" en vez
 * de inventar una ubicación. No fabricar coordenadas aquí bajo ninguna
 * circunstancia: en una casa de empeño una ubicación falsa puede llevar a
 * una decisión real (mandar a alguien por el vehículo a un lugar erróneo).
 */
export async function obtenerUbicacionVivo(dispositivoId: string): Promise<ResultadoUbicacion> {
  if (!rastreoHabilitado()) {
    return { ok: false, error: "El rastreo en vivo no está configurado todavía (falta el proveedor de GPS)." };
  }
  if (!dispositivoId) {
    return { ok: false, error: "Este vehículo no tiene un ID de dispositivo GPS asignado." };
  }
  return { ok: false, error: "Proveedor de GPS pendiente de integrar." };
}
