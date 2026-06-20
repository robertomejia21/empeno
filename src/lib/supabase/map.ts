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
    periodo: r.periodo as PeriodoInteres,
    plazoPeriodos: r.plazo_periodos,
    fechaInicio: r.fecha_inicio,
    fechaVencimiento: r.fecha_vencimiento,
    diasGracia: r.dias_gracia,
    estado: r.estado as EstadoEmpeno,
    notas: r.notas,
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
