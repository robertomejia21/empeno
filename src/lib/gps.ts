// Modalidad de un vehículo en garantía: lo tenemos físicamente (Resguardo) o
// el cliente lo conserva con un GPS instalado (GPS).
import type { EmpenoConDetalle, Prenda } from "./types";

export type Modalidad = "gps" | "resguardo";

/** Se considera modalidad GPS si hay renta de GPS o ubicación de GPS registrada. */
export function modalidadVehiculo(p: Pick<Prenda, "gpsMensual" | "gpsUbicacion">): Modalidad {
  if ((p.gpsMensual ?? 0) > 0) return "gps";
  if (p.gpsUbicacion && p.gpsUbicacion.trim()) return "gps";
  return "resguardo";
}

export interface ResumenModalidad {
  modalidad: Modalidad;
  cantidad: number;
  montoPrestado: number;
  pct: number; // % del total de vehículos activos (por cantidad)
}

export interface ResumenGps {
  gps: ResumenModalidad;
  resguardo: ResumenModalidad;
  totalVehiculos: number;
  montoTotal: number;
}

export function resumenModalidades(empenos: EmpenoConDetalle[]): ResumenGps {
  const activos = empenos.filter(
    (e) => (e.estado === "activo" || e.estado === "refrendado") && e.prenda.categoria === "Vehículos"
  );
  const total = activos.length;
  const acc: Record<Modalidad, { cantidad: number; monto: number }> = {
    gps: { cantidad: 0, monto: 0 },
    resguardo: { cantidad: 0, monto: 0 },
  };
  for (const e of activos) {
    const m = modalidadVehiculo(e.prenda);
    acc[m].cantidad += 1;
    acc[m].monto += e.montoPrestado;
  }
  const mk = (m: Modalidad): ResumenModalidad => ({
    modalidad: m,
    cantidad: acc[m].cantidad,
    montoPrestado: acc[m].monto,
    pct: total ? (acc[m].cantidad / total) * 100 : 0,
  });
  return {
    gps: mk("gps"),
    resguardo: mk("resguardo"),
    totalVehiculos: total,
    montoTotal: acc.gps.monto + acc.resguardo.monto,
  };
}
