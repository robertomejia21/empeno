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
  | "apartada" // reservada en un apartado
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
  // Vehículos
  seguro: number | null;
  gps: string | null; // estado del GPS (conectado/desconectado)
  garantia: string | null; // descripción de la garantía (ej. auto)
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
  tasaInteres: number; // % de interés por periodo
  almacenajePct: number; // % de almacenaje por periodo
  ivaPct: number; // % de IVA (sobre interés + almacenaje)
  metodoPago: MetodoPago; // efectivo / transferencia / cheque
  abonoCapital: number; // capital abonado acumulado (reduce el saldo)
  comisionista: string | null;
  centroCosto: string | null;
  realSucursal: number | null; // monto real entregado en sucursal
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
  | "deposito" // entrada: depósito de efectivo
  | "compra"; // salida: compra directa de mercancía

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

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "cheque";

export interface Venta {
  id: ID;
  folio: string;
  prendaId: ID;
  clienteId: ID | null; // comprador (opcional)
  precio: number;
  metodoPago: MetodoPago;
  fecha: string;
  notas: string | null;
  creadoEn: string;
}

export interface Compra {
  id: ID;
  folio: string;
  prendaId: ID;
  clienteId: ID | null; // vendedor
  monto: number;
  fecha: string;
  notas: string | null;
  creadoEn: string;
}

export type EstadoApartado = "activo" | "liquidado" | "cancelado";

export interface Apartado {
  id: ID;
  folio: string;
  prendaId: ID;
  clienteId: ID;
  precioTotal: number;
  abonado: number; // suma de enganche + abonos
  estado: EstadoApartado;
  fecha: string;
  notas: string | null;
  creadoEn: string;
}

export type RolUsuario = "admin" | "gerente" | "cajero" | "valuador" | "invitado";

export interface Usuario {
  id: ID;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  creadoEn?: string;
}

export interface CorteCaja {
  id: ID;
  fecha: string;
  esperado: number;
  contado: number;
  diferencia: number;
  entradasDia: number;
  salidasDia: number;
  usuarioNombre: string | null;
  notas: string | null;
  creadoEn: string;
}

export interface Bitacora {
  id: ID;
  fecha: string;
  usuarioNombre: string;
  usuarioRol: string | null;
  accion: string;
  detalle: string | null;
  referencia: string | null;
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
  seguro: number | null;
  gps: string | null;
  garantia: string | null;
  notas: string | null;
}

export interface EmpenoGuiadoPayload {
  clienteExistenteId: string | null;
  clienteNuevo: ClienteNuevoInput | null;
  prenda: PrendaInput;
  montoPrestado: number;
  tasaInteres: number;
  almacenajePct: number;
  ivaPct: number;
  metodoPago: MetodoPago;
  comisionista: string | null;
  centroCosto: string | null;
  periodo: PeriodoInteres;
  plazoPeriodos: number;
  diasGracia: number;
  fechaInicio: string;
  notas: string | null;
}

export interface CalculoLiquidacion {
  capital: number; // capital pendiente (monto prestado - abonos a capital)
  interesAcumulado: number;
  almacenajeAcumulado: number;
  ivaAcumulado: number;
  periodosTranscurridos: number;
  diasTranscurridos: number;
  totalDesempeno: number; // capital + interés + almacenaje + IVA para liquidar hoy
  totalRefrendo: number; // interés + almacenaje + IVA de un periodo para renovar
  vencido: boolean;
  diasParaVencer: number; // negativo si ya venció
}
