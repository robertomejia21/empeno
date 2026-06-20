// Modelo de dominio — Suite para casas de empeño (México)

export type ID = string;

/** Identificación oficial aceptada en México para KYC/PLD */
export type TipoIdentificacion =
  | "INE"
  | "Pasaporte"
  | "Licencia"
  | "Cédula"
  | "Otro";

export interface Cliente {
  id: ID;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string | null;
  rfc: string | null;
  telefono: string | null;
  email: string | null;
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  direccion: string | null;
  fechaNacimiento: string | null; // ISO date
  notas: string | null;
  creadoEn: string; // ISO datetime
}

export type CategoriaPrenda =
  | "Joyería"
  | "Electrónica"
  | "Herramientas"
  | "Relojes"
  | "Vehículos"
  | "Instrumentos"
  | "Electrodomésticos"
  | "Otro";

export type EstadoPrenda =
  | "en_avaluo" // avalúo en proceso
  | "empenada" // garantía de un empeño activo
  | "desempenada" // devuelta al cliente
  | "en_venta" // vencida, a la venta
  | "vendida";

export interface Prenda {
  id: ID;
  folio: string;
  categoria: CategoriaPrenda;
  descripcion: string;
  marca: string | null;
  submarca: string | null; // submodelo / línea (vehículos)
  modelo: string | null; // año o modelo
  color: string | null;
  serie: string | null; // número de serie / NIV
  placas: string | null; // vehículos
  // Joyería
  metal: string | null; // oro, plata...
  kilataje: string | null; // 10k, 14k, 18k, 24k
  gramos: number | null;
  // Avalúo
  valorAvaluo: number; // valor comercial estimado (MXN)
  montoPrestamoSugerido: number; // % del avalúo (préstamo recomendado)
  estado: EstadoPrenda;
  fotos: string[]; // urls
  ubicacionResguardo: string | null; // dónde se almacena físicamente
  notas: string | null;
  creadoEn: string;
}

export type EstadoEmpeno =
  | "activo"
  | "refrendado"
  | "vencido"
  | "desempenado"
  | "en_remate"
  | "rematado";

export type PeriodoInteres = "mensual" | "quincenal" | "semanal";

export interface Empeno {
  id: ID;
  folio: string;
  clienteId: ID;
  prendaId: ID;
  montoPrestado: number; // capital entregado al cliente (MXN)
  tasaInteres: number; // % por periodo (ej. 15 = 15% mensual)
  periodo: PeriodoInteres;
  plazoPeriodos: number; // número de periodos del contrato (ej. 1 mes)
  fechaInicio: string; // ISO date
  fechaVencimiento: string; // ISO date
  diasGracia: number; // días de gracia antes de remate
  estado: EstadoEmpeno;
  notas: string | null;
  creadoEn: string;
}

export type TipoMovimiento =
  | "prestamo" // salida: capital entregado
  | "desempeno" // entrada: capital + interés al liquidar
  | "refrendo" // entrada: pago de interés para renovar
  | "abono" // entrada: abono parcial
  | "venta" // entrada: venta de prenda rematada
  | "gasto" // salida: gasto operativo
  | "apertura" // saldo inicial de caja
  | "retiro" // salida: retiro de efectivo
  | "deposito"; // entrada: depósito de efectivo

export interface MovimientoCaja {
  id: ID;
  fecha: string; // ISO datetime
  tipo: TipoMovimiento;
  monto: number; // siempre positivo; el signo lo da el tipo
  esEntrada: boolean;
  concepto: string;
  empenoId: ID | null;
  referencia: string | null;
  creadoEn: string;
}

export type RolUsuario = "admin" | "gerente" | "cajero" | "valuador";

export interface Usuario {
  id: ID;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
}

// ---- Tipos derivados / de vista ----

export interface EmpenoConDetalle extends Empeno {
  cliente: Cliente;
  prenda: Prenda;
}

// ---- Flujo guiado de empeño (asistente de 9 pasos PRENDAFLEX) ----

export interface ClienteNuevoInput {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string | null;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
}

export interface PrendaInput {
  categoria: CategoriaPrenda;
  descripcion: string;
  marca: string | null;
  submarca: string | null;
  modelo: string | null;
  color: string | null;
  serie: string | null;
  placas: string | null;
  metal: string | null;
  kilataje: string | null;
  gramos: number | null;
  valorAvaluo: number;
  ubicacionResguardo: string | null;
  fotos: string[];
  funcionamientoValidado: boolean;
  documentacionValidada: boolean;
  notas: string | null;
}

export interface EmpenoGuiadoPayload {
  clienteExistenteId: string | null;
  clienteNuevo: ClienteNuevoInput | null;
  prenda: PrendaInput;
  montoPrestado: number;
  tasaInteres: number;
  periodo: PeriodoInteres;
  plazoPeriodos: number;
  diasGracia: number;
  fechaInicio: string;
  notas: string | null;
}

export interface CalculoLiquidacion {
  capital: number;
  interesAcumulado: number;
  periodosTranscurridos: number;
  diasTranscurridos: number;
  totalDesempeno: number; // capital + interés para liquidar hoy
  totalRefrendo: number; // sólo interés para renovar
  vencido: boolean;
  diasParaVencer: number; // negativo si ya venció
}
