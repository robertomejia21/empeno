import type { Prenda } from "./types";

/** Campos de la ficha de vehículo, todos vacíos. Para prendas que no son autos. */
export const CAMPOS_VEHICULO_VACIOS: Pick<
  Prenda,
  | "tipoVehiculo"
  | "transmision"
  | "numeroMotor"
  | "kilometraje"
  | "cilindros"
  | "claveVehicular"
  | "nivelGasolina"
  | "numeroFactura"
  | "emisorFactura"
  | "valorFactura"
  | "fechaFactura"
  | "aseguradora"
  | "poliza"
  | "danios"
  | "gpsUbicacion"
  | "seguroMensual"
  | "pensionMensual"
  | "gpsMensual"
> = {
  tipoVehiculo: null,
  transmision: null,
  numeroMotor: null,
  kilometraje: null,
  cilindros: null,
  claveVehicular: null,
  nivelGasolina: null,
  numeroFactura: null,
  emisorFactura: null,
  valorFactura: null,
  fechaFactura: null,
  aseguradora: null,
  poliza: null,
  danios: null,
  gpsUbicacion: null,
  seguroMensual: null,
  pensionMensual: null,
  gpsMensual: null,
};
