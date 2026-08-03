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
  foto: string | null; // foto del cliente (URL)
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

export type TipoResguardo = "Matriz" | "Externa";

/** Dónde está físicamente resguardado el bien, con la dirección desglosada. */
export interface Resguardo {
  tipo: TipoResguardo;
  calle: string | null;
  numero: string | null;
  colonia: string | null;
  ciudad: string | null;
  cp: string | null;
  referencia: string | null;
  mapsUrl: string | null;
}

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
  ubicacionResguardo: string | null; // resumen legible (listados/exportes)
  resguardo: Resguardo; // desglose de la dirección
  // Vehículos
  seguro: number | null;
  gps: string | null; // estado del GPS (conectado/desconectado)
  garantia: string | null; // descripción de la garantía (ej. auto)
  // Vehículos — ficha ampliada
  tipoVehiculo: string | null; // sedán, pick-up, SUV…
  transmision: string | null; // estándar / automática
  numeroMotor: string | null;
  kilometraje: number | null;
  cilindros: string | null;
  claveVehicular: string | null;
  nivelGasolina: string | null;
  numeroFactura: string | null;
  emisorFactura: string | null;
  valorFactura: number | null;
  fechaFactura: string | null;
  aseguradora: string | null;
  poliza: string | null;
  danios: string | null; // daños visibles
  gpsUbicacion: string | null; // coordenadas o liga de Maps del GPS
  seguroMensual: number | null;
  pensionMensual: number | null;
  gpsMensual: number | null;
  // Verificación (autos): REPUVE / no reportado robado / documentación
  verificado: boolean;
  repuveFolio: string | null;
  modalidad?: "gps" | "resguardo" | null; // modalidad del vehículo en garantía
  notas: string | null; // comentarios / estado del bien
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
  firmaCliente: string | null; // firma digital del consumidor (data URL PNG)
  firmaFecha: string | null; // ISO datetime en que firmó
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

// admin = Dirección General (acceso total). Los demás, acceso acotado por área.
export type RolUsuario =
  | "admin"
  | "gerente"
  | "lider"
  | "atencion"
  | "cobranza"
  | "cajero"
  | "valuador"
  | "mecanico"
  | "invitado";

export interface Usuario {
  id: ID;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  creadoEn?: string;
}

export type TipoPago = "refrendo" | "abono" | "desempeno";

export interface Pago {
  id: ID;
  reciboNo: number;
  refrendoNo: number;
  empenoId: ID;
  clienteId: ID | null;
  tipo: TipoPago;
  abonoCapital: number;
  intereses: number;
  almacenaje: number;
  gastosAdmin: number;
  moratorios: number;
  rentaGps: number;
  rentaSeguro: number;
  gastosVenta: number;
  pension: number;
  iva: number;
  descuento: number;
  subtotal: number;
  total: number;
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  cambio: number;
  metodoPago: MetodoPago;
  usuarioNombre: string | null;
  fecha: string;
  creadoEn: string;
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

// ---- Cotizaciones / valuaciones (sin contrato de empeño) ----

export type TipoCotizacion = "articulo" | "vehiculo";

export type CondicionArticulo = "excelente" | "bueno" | "regular" | "malo";

export type EstadoCotizacion = "vigente" | "vencida" | "convertida" | "rechazada";

/** Canal por el que llegó la cotización (para análisis de mercado). */
export type ContactoCotizacion =
  | "Sucursal"
  | "WhatsApp"
  | "Messenger"
  | "Teléfono"
  | "Llamada"
  | "Instagram"
  | "Facebook"
  | "Recomendación"
  | "Cliente"
  | "Otro";

export interface Cotizacion {
  id: ID;
  folio: string; // COT-0001
  tipo: TipoCotizacion;
  categoria: CategoriaPrenda;
  descripcion: string;
  // Prospecto: no requiere cliente registrado
  clienteId: ID | null;
  prospectoNombre: string | null;
  prospectoTelefono: string | null;
  // Ficha del bien
  marca: string | null;
  submarca: string | null;
  modelo: string | null; // año (vehículo) o modelo
  serie: string | null;
  placas: string | null;
  kilometraje: number | null;
  condicion: CondicionArticulo;
  // Joyería
  metal: string | null;
  kilataje: string | null;
  gramos: number | null;
  // Valuación
  valorMercado: number; // valor comercial de referencia
  valorEstimado: number; // ajustado por condición / kilometraje
  montoSolicitado: number | null; // lo que pidió el cliente
  busquedaFacebook: number | null; // precio de referencia hallado (Facebook Marketplace)
  porcentajePrestamo: number; // % ofrecido sobre el valor estimado
  prestamoOfrecido: number; // monto a prestar
  contacto: ContactoCotizacion | null; // canal por el que llegó
  // Avalúo del mecánico (vehículos): retro sobre el valor real del auto
  avaluoMecanico: number | null;
  comentarioMecanico: string | null;
  avaluoEstado: "solicitado" | "respondido" | null;
  // Seguimiento / resultado
  seEmpeno: boolean | null; // ¿terminó en empeño? (null = pendiente)
  motivoNo: string | null; // por qué no se empeñó
  vigenciaDias: number;
  vigenciaHasta: string; // ISO date
  estado: EstadoCotizacion;
  fotos: string[];
  documentos: string[]; // documentación del vehículo adjunta (URLs)
  valuadorNombre: string | null;
  notas: string | null;
  creadoEn: string;
}

// ---- Citas de instalación de GPS ----

export type EstadoCitaGps = "agendada" | "completada" | "cancelada";

export interface CitaGps {
  id: ID;
  fecha: string; // ISO date
  hora: string; // "08:00" .. "16:00"
  clienteNombre: string | null;
  telefono: string | null;
  vehiculo: string | null;
  empenoId: ID | null;
  estado: EstadoCitaGps;
  notas: string | null;
  creadoEn: string;
}

export interface CitaGpsInput {
  fecha: string;
  hora: string;
  clienteNombre: string | null;
  telefono: string | null;
  vehiculo: string | null;
  notas: string | null;
}

export interface CotizacionInput {
  tipo: TipoCotizacion;
  categoria: CategoriaPrenda;
  descripcion: string;
  prospectoNombre: string | null;
  prospectoTelefono: string | null;
  marca: string | null;
  submarca: string | null;
  modelo: string | null; // año (vehículo) o modelo
  serie: string | null;
  placas: string | null;
  kilometraje: number | null;
  condicion: CondicionArticulo;
  metal: string | null;
  kilataje: string | null;
  gramos: number | null;
  valorMercado: number;
  valorEstimado: number;
  montoSolicitado: number | null;
  busquedaFacebook: number | null;
  porcentajePrestamo: number;
  prestamoOfrecido: number;
  contacto: ContactoCotizacion | null;
  fotos: string[];
  notas: string | null;
}

// ---- Autorizaciones (aprobaciones de Dirección General) ----

export type TipoAutorizacion = "interes_especial" | "otro";
export type EstadoAutorizacion = "pendiente" | "aprobada" | "rechazada";

export interface Autorizacion {
  id: ID;
  folio: string; // AUT-0001
  tipo: TipoAutorizacion;
  estado: EstadoAutorizacion;
  solicitanteNombre: string | null;
  autorizadorNombre: string | null;
  clienteNombre: string | null;
  bien: string | null;
  monto: number | null;
  tasaSolicitada: number | null;
  tasaEstandar: number | null;
  motivo: string | null;
  comentarioResolucion: string | null;
  referencia: string | null; // folio de empeño / cotización relacionada
  creadoEn: string;
  resueltoEn: string | null;
}

export interface AutorizacionInput {
  tipo: TipoAutorizacion;
  clienteNombre: string | null;
  bien: string | null;
  monto: number | null;
  tasaSolicitada: number | null;
  tasaEstandar: number | null;
  motivo: string | null;
  referencia: string | null;
}

// ---- Encuesta de satisfacción ----

export interface Encuesta {
  id: ID;
  amable: boolean | null;
  tiempoAdecuado: boolean | null;
  resolvioDudas: boolean | null;
  ofrecioAlternativas: boolean | null;
  profesionalismoSatisfecho: boolean | null;
  comunicacionFacil: boolean | null;
  horarioSatisfecho: boolean | null;
  calificacion: number | null; // 1..5
  comentario: string | null;
  creadoEn: string;
}

export type EncuestaInput = Omit<Encuesta, "id" | "creadoEn">;

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
  fechaNacimiento: string | null;
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  foto: string | null;
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
  tipoVehiculo: string | null;
  transmision: string | null;
  numeroMotor: string | null;
  kilometraje: number | null;
  cilindros: string | null;
  claveVehicular: string | null;
  nivelGasolina: string | null;
  numeroFactura: string | null;
  emisorFactura: string | null;
  valorFactura: number | null;
  fechaFactura: string | null;
  aseguradora: string | null;
  poliza: string | null;
  danios: string | null;
  gpsUbicacion: string | null;
  seguroMensual: number | null;
  pensionMensual: number | null;
  gpsMensual: number | null;
  verificado: boolean;
  repuveFolio: string | null;
  modalidad?: "gps" | "resguardo" | null;
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
