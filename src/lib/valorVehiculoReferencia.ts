// Tabla de referencia de valor comercial / préstamo sugerido por año de
// vehículo. Dato proporcionado externamente al negocio (no es un cálculo
// propio) — se muestra como guía, nunca fuerza el avalúo ni el préstamo.
export interface RangoValorVehiculo {
  anioDesde: number;
  anioHasta: number;
  valorDesde: number;
  valorHasta: number;
  prestamoDesde: number;
  prestamoHasta: number;
}

export const VALOR_VEHICULO_REFERENCIA: RangoValorVehiculo[] = [
  { anioDesde: 2008, anioHasta: 2010, valorDesde: 45000, valorHasta: 45000, prestamoDesde: 5000, prestamoHasta: 10000 },
  { anioDesde: 2011, anioHasta: 2013, valorDesde: 60000, valorHasta: 60000, prestamoDesde: 11000, prestamoHasta: 35000 },
  { anioDesde: 2014, anioHasta: 2016, valorDesde: 80000, valorHasta: 180000, prestamoDesde: 36000, prestamoHasta: 45000 },
  { anioDesde: 2017, anioHasta: 2019, valorDesde: 120000, valorHasta: 260000, prestamoDesde: 46000, prestamoHasta: 55000 },
  { anioDesde: 2020, anioHasta: 2022, valorDesde: 180000, valorHasta: 400000, prestamoDesde: 56000, prestamoHasta: 65000 },
  { anioDesde: 2023, anioHasta: 2024, valorDesde: 230000, valorHasta: 450000, prestamoDesde: 66000, prestamoHasta: 75000 },
  { anioDesde: 2025, anioHasta: 2026, valorDesde: 280000, valorHasta: 600000, prestamoDesde: 76000, prestamoHasta: 100000 },
];

export function rangoPorAnio(anio: number): RangoValorVehiculo | null {
  return VALOR_VEHICULO_REFERENCIA.find((r) => anio >= r.anioDesde && anio <= r.anioHasta) ?? null;
}
