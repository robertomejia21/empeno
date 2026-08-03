// Mapeo entre filas de Postgres (snake_case) y tipos de dominio (camelCase)
import type {
  Cliente,
  Prenda,
  Empeno,
  MovimientoCaja,
  TipoIdentificacion,
  CategoriaPrenda,
  EstadoPrenda,
  EstadoEmpeno,
  PeriodoInteres,
  TipoMovimiento,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function rowToCliente(r: any): Cliente {
  return {
    id: r.id,
    nombre: r.nombre,
    apellidoPaterno: r.apellido_paterno,
    apellidoMaterno: r.apellido_materno ?? "",
    curp: r.curp,
    rfc: r.rfc,
    telefono: r.telefono,
    email: r.email,
    tipoIdentificacion: r.tipo_identificacion as TipoIdentificacion,
    numeroIdentificacion: r.numero_identificacion,
    direccion: r.direccion,
    fechaNacimiento: r.fecha_nacimiento,
    foto: r.foto ?? null,
    notas: r.notas,
    creadoEn: r.creado_en,
  };
}

export function rowToPrenda(r: any): Prenda {
  return {
    id: r.id,
    folio: r.folio,
    categoria: r.categoria as CategoriaPrenda,
    descripcion: r.descripcion,
    marca: r.marca,
    submarca: r.submarca,
    modelo: r.modelo,
    color: r.color,
    serie: r.serie,
    placas: r.placas,
    metal: r.metal,
    kilataje: r.kilataje,
    gramos: r.gramos === null ? null : Number(r.gramos),
    valorAvaluo: Number(r.valor_avaluo),
    montoPrestamoSugerido: Number(r.monto_prestamo_sugerido),
    estado: r.estado as EstadoPrenda,
    fotos: r.fotos ?? [],
    ubicacionResguardo: r.ubicacion_resguardo,
    resguardo: {
      tipo: (r.resguardo_tipo ?? "Matriz") as "Matriz" | "Externa",
      calle: r.resguardo_calle ?? null,
      numero: r.resguardo_numero ?? null,
      colonia: r.resguardo_colonia ?? null,
      ciudad: r.resguardo_ciudad ?? null,
      cp: r.resguardo_cp ?? null,
      referencia: r.resguardo_referencia ?? null,
      mapsUrl: r.resguardo_maps_url ?? null,
    },
    seguro: r.seguro == null ? null : Number(r.seguro),
    gps: r.gps ?? null,
    garantia: r.garantia ?? null,
    tipoVehiculo: r.tipo_vehiculo ?? null,
    transmision: r.transmision ?? null,
    numeroMotor: r.numero_motor ?? null,
    kilometraje: r.kilometraje == null ? null : Number(r.kilometraje),
    cilindros: r.cilindros ?? null,
    claveVehicular: r.clave_vehicular ?? null,
    nivelGasolina: r.nivel_gasolina ?? null,
    numeroFactura: r.numero_factura ?? null,
    emisorFactura: r.emisor_factura ?? null,
    valorFactura: r.valor_factura == null ? null : Number(r.valor_factura),
    fechaFactura: r.fecha_factura ?? null,
    aseguradora: r.aseguradora ?? null,
    poliza: r.poliza ?? null,
    danios: r.danios ?? null,
    gpsUbicacion: r.gps_ubicacion ?? null,
    seguroMensual: r.seguro_mensual == null ? null : Number(r.seguro_mensual),
    pensionMensual: r.pension_mensual == null ? null : Number(r.pension_mensual),
    gpsMensual: r.gps_mensual == null ? null : Number(r.gps_mensual),
    verificado: Boolean(r.verificado),
    repuveFolio: r.repuve_folio ?? null,
    modalidad: r.modalidad ?? null,
    notas: r.notas,
    creadoEn: r.creado_en,
  };
}

export function rowToEmpeno(r: any): Empeno {
  return {
    id: r.id,
    folio: r.folio,
    clienteId: r.cliente_id,
    prendaId: r.prenda_id,
    montoPrestado: Number(r.monto_prestado),
    tasaInteres: Number(r.tasa_interes),
    almacenajePct: Number(r.almacenaje_pct ?? 0),
    ivaPct: Number(r.iva_pct ?? 0),
    metodoPago: (r.metodo_pago ?? "efectivo") as any,
    abonoCapital: Number(r.abono_capital ?? 0),
    comisionista: r.comisionista ?? null,
    centroCosto: r.centro_costo ?? null,
    realSucursal: r.real_sucursal == null ? null : Number(r.real_sucursal),
    periodo: r.periodo as PeriodoInteres,
    plazoPeriodos: r.plazo_periodos,
    fechaInicio: r.fecha_inicio,
    fechaVencimiento: r.fecha_vencimiento,
    diasGracia: r.dias_gracia,
    estado: r.estado as EstadoEmpeno,
    notas: r.notas,
    firmaCliente: r.firma_cliente ?? null,
    firmaFecha: r.firma_fecha ?? null,
    creadoEn: r.creado_en,
  };
}

export function rowToVenta(r: any): import("@/lib/types").Venta {
  return {
    id: r.id,
    folio: r.folio,
    prendaId: r.prenda_id,
    clienteId: r.cliente_id,
    precio: Number(r.precio),
    metodoPago: r.metodo_pago,
    fecha: r.fecha,
    notas: r.notas,
    creadoEn: r.creado_en,
  };
}

export function rowToCompra(r: any): import("@/lib/types").Compra {
  return {
    id: r.id,
    folio: r.folio,
    prendaId: r.prenda_id,
    clienteId: r.cliente_id,
    monto: Number(r.monto),
    fecha: r.fecha,
    notas: r.notas,
    creadoEn: r.creado_en,
  };
}

export function rowToApartado(r: any): import("@/lib/types").Apartado {
  return {
    id: r.id,
    folio: r.folio,
    prendaId: r.prenda_id,
    clienteId: r.cliente_id,
    precioTotal: Number(r.precio_total),
    abonado: Number(r.abonado),
    estado: r.estado,
    fecha: r.fecha,
    notas: r.notas,
    creadoEn: r.creado_en,
  };
}

export function rowToUsuario(r: any): import("@/lib/types").Usuario {
  return {
    id: r.id,
    nombre: r.nombre,
    email: r.email,
    rol: r.rol,
    activo: r.activo,
    creadoEn: r.creado_en,
  };
}

export function rowToBitacora(r: any): import("@/lib/types").Bitacora {
  return {
    id: r.id,
    fecha: r.fecha,
    usuarioNombre: r.usuario_nombre,
    usuarioRol: r.usuario_rol,
    accion: r.accion,
    detalle: r.detalle,
    referencia: r.referencia,
  };
}

export function rowToPago(r: any): import("@/lib/types").Pago {
  const n = (v: any) => Number(v ?? 0);
  return {
    id: r.id,
    reciboNo: Number(r.recibo_no),
    refrendoNo: Number(r.refrendo_no),
    empenoId: r.empeno_id,
    clienteId: r.cliente_id,
    tipo: r.tipo,
    abonoCapital: n(r.abono_capital),
    intereses: n(r.intereses),
    almacenaje: n(r.almacenaje),
    gastosAdmin: n(r.gastos_admin),
    moratorios: n(r.moratorios),
    rentaGps: n(r.renta_gps),
    rentaSeguro: n(r.renta_seguro),
    gastosVenta: n(r.gastos_venta),
    pension: n(r.pension),
    iva: n(r.iva),
    descuento: n(r.descuento),
    subtotal: n(r.subtotal),
    total: n(r.total),
    efectivo: n(r.efectivo),
    tarjeta: n(r.tarjeta),
    transferencia: n(r.transferencia),
    cambio: n(r.cambio),
    metodoPago: r.metodo_pago,
    usuarioNombre: r.usuario_nombre,
    fecha: r.fecha,
    creadoEn: r.creado_en,
  };
}

export function rowToCorte(r: any): import("@/lib/types").CorteCaja {
  return {
    id: r.id,
    fecha: r.fecha,
    esperado: Number(r.esperado),
    contado: Number(r.contado),
    diferencia: Number(r.diferencia),
    entradasDia: Number(r.entradas_dia),
    salidasDia: Number(r.salidas_dia),
    usuarioNombre: r.usuario_nombre,
    notas: r.notas,
    creadoEn: r.creado_en,
  };
}

export function rowToCotizacion(r: any): import("@/lib/types").Cotizacion {
  const n = (v: any) => (v == null ? null : Number(v));
  return {
    id: r.id,
    folio: r.folio,
    tipo: r.tipo,
    categoria: r.categoria as CategoriaPrenda,
    descripcion: r.descripcion ?? "",
    clienteId: r.cliente_id ?? null,
    prospectoNombre: r.prospecto_nombre ?? null,
    prospectoTelefono: r.prospecto_telefono ?? null,
    marca: r.marca ?? null,
    submarca: r.submarca ?? null,
    modelo: r.modelo ?? null,
    serie: r.serie ?? null,
    placas: r.placas ?? null,
    kilometraje: n(r.kilometraje),
    condicion: (r.condicion ?? "bueno") as any,
    metal: r.metal ?? null,
    kilataje: r.kilataje ?? null,
    gramos: n(r.gramos),
    valorMercado: Number(r.valor_mercado ?? 0),
    valorEstimado: Number(r.valor_estimado ?? 0),
    montoSolicitado: n(r.monto_solicitado),
    busquedaFacebook: n(r.busqueda_facebook),
    porcentajePrestamo: Number(r.porcentaje_prestamo ?? 50),
    prestamoOfrecido: Number(r.prestamo_ofrecido ?? 0),
    contacto: r.contacto ?? null,
    avaluoMecanico: r.avaluo_mecanico == null ? null : Number(r.avaluo_mecanico),
    comentarioMecanico: r.comentario_mecanico ?? null,
    checklistMecanico: r.checklist_mecanico ?? null,
    avaluoEstado: r.avaluo_estado ?? null,
    seEmpeno: r.se_empeno == null ? null : Boolean(r.se_empeno),
    motivoNo: r.motivo_no ?? null,
    vigenciaDias: Number(r.vigencia_dias ?? 15),
    vigenciaHasta: r.vigencia_hasta,
    estado: r.estado,
    fotos: r.fotos ?? [],
    documentos: r.documentos ?? [],
    valuadorNombre: r.valuador_nombre ?? null,
    notas: r.notas ?? null,
    creadoEn: r.creado_en,
  };
}

export function rowToProductoInteres(r: any): import("@/lib/types").ProductoInteres {
  return {
    id: r.id,
    nombre: r.nombre,
    modalidad: r.modalidad ?? null,
    tipo: r.tipo,
    tasa: Number(r.tasa),
    periodo: r.periodo,
    plazoPeriodos: Number(r.plazo_periodos ?? 1),
    orden: Number(r.orden ?? 0),
    activo: Boolean(r.activo),
    creadoEn: r.creado_en,
  };
}

export function rowToCitaGps(r: any): import("@/lib/types").CitaGps {
  return {
    id: r.id,
    fecha: r.fecha,
    hora: r.hora,
    clienteNombre: r.cliente_nombre ?? null,
    telefono: r.telefono ?? null,
    vehiculo: r.vehiculo ?? null,
    empenoId: r.empeno_id ?? null,
    estado: r.estado,
    notas: r.notas ?? null,
    creadoEn: r.creado_en,
  };
}

export function rowToAutorizacion(r: any): import("@/lib/types").Autorizacion {
  const n = (v: any) => (v == null ? null : Number(v));
  return {
    id: r.id,
    folio: r.folio,
    tipo: r.tipo,
    estado: r.estado,
    solicitanteNombre: r.solicitante_nombre ?? null,
    autorizadorNombre: r.autorizador_nombre ?? null,
    clienteNombre: r.cliente_nombre ?? null,
    bien: r.bien ?? null,
    monto: n(r.monto),
    tasaSolicitada: n(r.tasa_solicitada),
    tasaEstandar: n(r.tasa_estandar),
    motivo: r.motivo ?? null,
    comentarioResolucion: r.comentario_resolucion ?? null,
    referencia: r.referencia ?? null,
    empenoId: r.empeno_id ?? null,
    creadoEn: r.creado_en,
    resueltoEn: r.resuelto_en ?? null,
  };
}

export function rowToEncuesta(r: any): import("@/lib/types").Encuesta {
  const b = (v: any) => (v == null ? null : Boolean(v));
  return {
    id: r.id,
    amable: b(r.amable),
    tiempoAdecuado: b(r.tiempo_adecuado),
    resolvioDudas: b(r.resolvio_dudas),
    ofrecioAlternativas: b(r.ofrecio_alternativas),
    profesionalismoSatisfecho: b(r.profesionalismo_satisfecho),
    comunicacionFacil: b(r.comunicacion_facil),
    horarioSatisfecho: b(r.horario_satisfecho),
    calificacion: r.calificacion == null ? null : Number(r.calificacion),
    comentario: r.comentario ?? null,
    creadoEn: r.creado_en,
  };
}

export function rowToMovimiento(r: any): MovimientoCaja {
  return {
    id: r.id,
    fecha: r.fecha,
    tipo: r.tipo as TipoMovimiento,
    monto: Number(r.monto),
    esEntrada: r.es_entrada,
    concepto: r.concepto,
    empenoId: r.empeno_id,
    referencia: r.referencia,
    creadoEn: r.creado_en,
  };
}
