import type { ReactNode } from "react";
import type { EmpenoConDetalle, CalculoLiquidacion } from "@/lib/types";
import { formatMXN, formatFecha, formatFechaLarga, formatPorcentaje } from "@/lib/format";
import { pesosALetras } from "@/lib/letras";
import { PROVEEDOR, PROFECO, periodosPorAnio } from "@/lib/negocio";
import { TASA_MORATORIOS, catPorTipo, sumarPeriodos } from "@/lib/interes";

const periodoLabel: Record<string, string> = { mensual: "mensual", quincenal: "quincenal", semanal: "semanal", diario: "diario" };

// Máximo de renglones en la tabla de opciones de pago (contratos diarios pueden tener muchos periodos).
const MAX_RENGLONES_PAGO = 12;

function sumarDias(iso: string, dias: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/* Celdas con el estilo de la carátula PROFECO: bordes negros finos y encabezados azul claro. */
const B = "border border-black";
const HEAD = `${B} bg-[#dce6f2] px-1 py-0.5 text-center font-bold uppercase`;
const CELL = `${B} px-1 py-0.5`;

function Fila({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${B} -mt-px px-1.5 py-1 text-justify ${className}`}>{children}</div>;
}

/**
 * Carátula del contrato de mutuo con interés y garantía prendaria, con el mismo
 * orden y estructura que el contrato de adhesión registrado ante PROFECO
 * (WORKLINE COMPANY, S. DE R.L. DE C.V., registro 2089-2022).
 */
export function ContratoProfeco({ empeno, qrPrenda, horario }: { empeno: EmpenoConDetalle; calc?: CalculoLiquidacion; qrPrenda?: string; horario: string }) {
  const c = empeno.cliente;
  const p = empeno.prenda;
  const nombreCliente = `${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno ?? ""}`.trim();

  const monto = empeno.montoPrestado;
  const tasaAnual = empeno.tasaInteres * periodosPorAnio(empeno.periodo);
  const interesPeriodo = monto * (empeno.tasaInteres / 100);
  const almacenajePeriodo = monto * (empeno.almacenajePct / 100);
  const ivaPeriodo = (interesPeriodo + almacenajePeriodo) * (empeno.ivaPct / 100);
  const refrendoPeriodo = interesPeriodo + almacenajePeriodo + ivaPeriodo;
  const montoTotalPagar = monto + refrendoPeriodo * empeno.plazoPeriodos;
  // CAT (sin IVA) fijo por tipo de bien: 120% automóviles, 240% demás artículos.
  const costoAnualTotal = catPorTipo(p.categoria === "Vehículos");
  const costoMensual = costoAnualTotal / 12;
  const costoDiario = costoAnualTotal / 360;
  const pctPrestamo = p.valorAvaluo > 0 ? (monto / p.valorAvaluo) * 100 : 0;
  const inicioComercializacion = sumarDias(empeno.fechaVencimiento, empeno.diasGracia);
  const caracteristicas =
    [p.marca, p.submarca, p.modelo, p.color, p.kilataje, p.gramos ? `${p.gramos} g` : null, p.placas, p.serie]
      .filter(Boolean).join(" · ") || "—";

  const renglones = Array.from({ length: Math.max(1, Math.min(empeno.plazoPeriodos, MAX_RENGLONES_PAGO)) }, (_, i) => i + 1);

  return (
    <div
      className="contrato mx-auto max-w-[880px] bg-white p-6 text-[9.5px] leading-snug text-black"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Fecha y folio */}
      <div className="flex items-end justify-between gap-4 font-bold">
        <p>
          Fecha de celebración del contrato: Mexicali, Baja California, a {formatFechaLarga(empeno.fechaInicio)}
        </p>
        <p className="whitespace-nowrap">
          FOLIO No. <span className="border-b border-black px-2 text-[11px]">{empeno.folio}</span>
        </p>
      </div>

      {/* Partes */}
      <p className="mt-1 text-justify font-bold">
        CONTRATO DE MUTUO CON INTERÉS Y GARANTÍA PRENDARIA (PRÉSTAMO), que celebran: {PROVEEDOR.razonSocial}, &ldquo;EL
        PROVEEDOR&rdquo;, con domicilio en: {PROVEEDOR.domicilio.toUpperCase()}., R.F.C. {PROVEEDOR.rfc}, Tel.:{" "}
        {PROVEEDOR.telefono || "____________"}, correo electrónico: {PROVEEDOR.correo || "____________"} y &ldquo;EL
        CONSUMIDOR&rdquo; {nombreCliente.toUpperCase()}, que se identifica con {c.tipoIdentificacion} número:{" "}
        {c.numeroIdentificacion || "______"} con domicilio en: {c.direccion || "____________"}, Tel.:{" "}
        {c.telefono || "____________"} correo electrónico: {c.email || "____________"}, quien designa como cotitular a (en
        su caso): ____________, con domicilio en ____________ y beneficiario a (en su caso): ____________, solo para
        efectos de este contrato.
      </p>

      {/* Cuadro financiero */}
      <table className="mt-1.5 w-full border-collapse text-center">
        <thead>
          <tr>
            <th className={HEAD}><span className="underline">CAT</span><br /><span className="underline">Costo Anual Total</span></th>
            <th className={HEAD}><span className="underline">Tasa de interés anual</span></th>
            <th className={HEAD}>Monto del préstamo<br />(mutuo)</th>
            <th className={HEAD}>Monto total a pagar</th>
            <th className={HEAD}>Comisiones<br /><span className="font-normal normal-case">Montos y Cláusulas</span></th>
          </tr>
        </thead>
        <tbody>
          <tr className="align-middle">
            <td className={CELL}>
              Para fines informativos y de comparación<br />
              <strong className="text-[11px]">{formatPorcentaje(costoAnualTotal)}</strong> FIJO<br />Sin IVA
            </td>
            <td className={CELL}>
              <strong className="text-[11px]">{formatPorcentaje(tasaAnual)}</strong><br />TASA FIJA
            </td>
            <td className={CELL}>
              <strong className="text-[11px]">{formatMXN(monto)}</strong><br />Moneda Nacional
            </td>
            <td className={CELL}>
              <strong className="text-[11px]">{formatMXN(montoTotalPagar)}</strong><br />Estimado al plazo máximo de
              desempeño o refrendo
            </td>
            <td className={`${CELL} text-left text-[8.5px] leading-tight`}>
              Comisión por Almacenaje: <strong>{formatPorcentaje(empeno.almacenajePct)}</strong> [Claus. 11 a)]<br />
              Comisión por Avalúo: $______ [Claus. 11 b)]<br />
              Comisión por Comercialización ____% [Claus. 11 c)]<br />
              Comisión por reposición de contrato $______ [Claus. 11 d)]<br />
              Desempeño Extemporáneo <strong>{formatPorcentaje(TASA_MORATORIOS)}</strong> [Claus. 11 e)]<br />
              Gastos de administración $______ [Claus. 11 f)]
            </td>
          </tr>
        </tbody>
      </table>

      <Fila>
        <strong>Metodología de cálculo de interés:</strong> Tasa de interés anual fija dividida entre 360 días por el
        importe del saldo insoluto del préstamo por el número de días efectivamente transcurridos.
      </Fila>
      <Fila>
        <strong>Plazo del préstamo</strong> (Fecha límite para el refrendo o desempeño):{" "}
        <strong className="underline">{formatFecha(empeno.fechaVencimiento)}</strong>. Total de Refrendos aplicables:{" "}
        <strong className="underline">{empeno.plazoPeriodos}</strong>. Su pago será{" "}
        <strong className="underline">{periodoLabel[empeno.periodo]}</strong>; métodos de pago aceptados: efectivo,
        tarjetas de crédito y débito, transferencias. En caso de que el vencimiento sea en día inhábil, se considerará el
        día hábil siguiente.
      </Fila>

      {/* Opciones de pago */}
      <table className="-mt-px w-full border-collapse text-center">
        <thead>
          <tr>
            <th rowSpan={2} className={`${CELL} font-bold uppercase`}>Opciones de pago para refrendo o desempeño</th>
            <th rowSpan={2} className={`${CELL} font-bold uppercase`}>Número</th>
            <th colSpan={4} className={HEAD}>Monto</th>
            <th colSpan={2} className={HEAD}>Total a pagar</th>
            <th rowSpan={2} className={`${CELL} font-bold uppercase`}>Cuándo se realizan los pagos</th>
          </tr>
          <tr>
            <th className={`${CELL} font-bold uppercase`}>Importe del mutuo</th>
            <th className={`${CELL} font-bold uppercase`}>Intereses</th>
            <th className={`${CELL} font-bold uppercase`}>Almacenaje</th>
            <th className={`${CELL} font-bold uppercase`}>IVA</th>
            <th className={`${HEAD}`}>Por refrendo</th>
            <th className={`${HEAD}`}>Por desempeño</th>
          </tr>
        </thead>
        <tbody>
          {renglones.map((n) => (
            <tr key={n}>
              {n === 1 && (
                <td rowSpan={renglones.length} className={`${CELL} text-[8.5px]`}>
                  Pago {periodoLabel[empeno.periodo]}
                </td>
              )}
              <td className={CELL}>{n}</td>
              <td className={CELL}>{formatMXN(monto)}</td>
              <td className={CELL}>{formatMXN(interesPeriodo)}</td>
              <td className={CELL}>{formatMXN(almacenajePeriodo)}</td>
              <td className={CELL}>{formatMXN(ivaPeriodo)}</td>
              <td className={`${CELL} font-bold`}>{formatMXN(refrendoPeriodo)}</td>
              <td className={`${CELL} font-bold`}>{formatMXN(monto + refrendoPeriodo)}</td>
              <td className={CELL}>{formatFecha(sumarPeriodos(empeno.fechaInicio, empeno.periodo, n))}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} className={HEAD}>Costo mensual total</td>
            <td colSpan={5} className={HEAD}>Costo diario total</td>
          </tr>
          <tr>
            <td colSpan={4} className={CELL}>
              Para fines informativos y de comparación: <strong>{formatPorcentaje(costoMensual)}</strong> FIJO Sin IVA
            </td>
            <td colSpan={5} className={CELL}>
              Para fines informativos y de comparación: <strong>{formatPorcentaje(costoDiario)}</strong> FIJO Sin IVA
            </td>
          </tr>
        </tbody>
      </table>

      <Fila>
        &ldquo;Cuide su capacidad de pago, generalmente no debe exceder del 35% de sus ingresos&rdquo; &ldquo;Si usted
        no paga en tiempo y forma corre el riesgo de perder sus prendas&rdquo;
      </Fila>
      <Fila>
        <strong>GARANTÍA:</strong> Para garantizar el pago de este préstamo, el consumidor deja en garantía el bien que
        se describe a continuación:
      </Fila>

      {/* Garantía */}
      <table className="-mt-px w-full border-collapse text-center">
        <thead>
          <tr>
            <th colSpan={5} className={HEAD}>Descripción de la prenda</th>
          </tr>
          <tr>
            <th className={`${CELL} font-bold`}>[Descripción genérica]</th>
            <th className={`${CELL} font-bold`}>CARACTERÍSTICAS</th>
            <th className={`${CELL} font-bold`}>AVALÚO</th>
            <th className={`${CELL} font-bold`}>PRÉSTAMO</th>
            <th className={`${CELL} font-bold`}>%PRÉSTAMO SOBRE AVALÚO</th>
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            <td className={`${CELL} text-left`}>{p.descripcion}</td>
            <td className={`${CELL} text-left`}>{caracteristicas}</td>
            <td className={CELL}>{formatMXN(p.valorAvaluo)}</td>
            <td className={CELL}>{formatMXN(monto)}</td>
            <td className={CELL}>{formatPorcentaje(pctPrestamo)}</td>
          </tr>
        </tbody>
      </table>

      <table className="-mt-px w-full border-collapse">
        <tbody>
          <tr>
            <td className={`${CELL} w-1/2`}>Monto del avalúo:</td>
            <td className={CELL}>
              <strong>{formatMXN(p.valorAvaluo)}</strong> ({pesosALetras(p.valorAvaluo)})
            </td>
          </tr>
          <tr>
            <td className={CELL}>Porcentaje del préstamo sobre el avalúo:</td>
            <td className={CELL}><strong>{formatPorcentaje(pctPrestamo)}</strong></td>
          </tr>
          <tr>
            <td className={CELL}>Fecha de inicio de comercialización:</td>
            <td className={CELL}><strong>{formatFecha(inicioComercializacion)}</strong></td>
          </tr>
          <tr>
            <td className={CELL}>El monto del préstamo se realizará en:</td>
            <td className={CELL}>
              {empeno.metodoPago === "efectivo" ? (
                <>Efectivo <strong>__X__</strong> o a la cuenta bancaria del Consumidor al número ____________, de la Institución Financiera ____________.</>
              ) : (
                <>Efectivo _____ o a la cuenta bancaria del Consumidor al número ____________, de la Institución Financiera ____________ (<strong>{empeno.metodoPago}</strong>).</>
              )}
            </td>
          </tr>
          <tr>
            <td className={CELL}>Fecha límite de finiquito: <strong>{formatFecha(empeno.fechaVencimiento)}</strong></td>
            <td className={CELL}>
              Términos y condiciones para recibir pagos anticipados: cláusula 13 (Décimo Tercera, inciso b).
            </td>
          </tr>
        </tbody>
      </table>

      <Fila>
        Estos conceptos causarán el pago del impuesto al valor agregado (IVA) a la tasa del{" "}
        <strong>{formatPorcentaje(empeno.ivaPct)}</strong>.
      </Fila>
      <Fila>*El procedimiento para desempeño, refrendo, finiquito y reclamo del remanente se encuentra descrito en el contrato.</Fila>
      <Fila>
        <p>Dudas, aclaraciones y reclamaciones:</p>
        <ul className="ml-4 list-disc">
          <li>
            Para cualquier duda, aclaración o reclamación, favor de dirigirse a: Domicilio: {PROVEEDOR.domicilio};
            Teléfono: {PROVEEDOR.telefono || "____________"}, correo electrónico: {PROVEEDOR.correo || "____________"};
            Página de Internet: {PROVEEDOR.paginaWeb}, en un horario de {horario}.
          </li>
          <li>
            O en su caso a PROFECO a los teléfonos: {PROFECO.telefonos.replace(" · ", " o al ")}, Página de Internet:{" "}
            {PROFECO.paginaWeb}
          </li>
        </ul>
      </Fila>
      <Fila>Estado de cuenta/consulta de movimientos: NO APLICA.</Fila>
      <Fila>
        Contrato de Adhesión registrado en el Registro Público de Contratos de Adhesión de la Procuraduría Federal del
        Consumidor, bajo el número {PROVEEDOR.registroRPCA} de fecha {PROVEEDOR.registroFecha}. El proveedor tiene la
        obligación de entregar al consumidor el documento en el cual se señale la descripción del préstamo, saldos,
        movimientos y la descripción de la Prenda en garantía.
      </Fila>

      {/* Desempeño y firmas */}
      <table className="-mt-px w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th colSpan={2} className={HEAD}>Desempeño</th>
            <th className={HEAD}>Firmas</th>
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            <td colSpan={2} className={`${CELL} text-justify`}>
              &ldquo;EL CONSUMIDOR&rdquo; recoge en el acto y a su entera satisfacción la(s) prenda(s) arriba descrita(s),
              por lo que otorga a {PROVEEDOR.razonSocial}, el finiquito más amplio que en derecho corresponda,
              liberándolo de cualquier responsabilidad jurídica que hubiere surgido o pudiese surgir en relación al
              contrato y a la prenda.
              <p className="mt-1">FECHA: ______ de ______________ de ______.</p>
            </td>
            <td className={`${CELL} text-center`}>
              <p className="text-left">FECHA: {formatFechaLarga(empeno.fechaInicio)}.</p>
              <FirmaLinea firma={empeno.firmaCliente} fecha={empeno.firmaFecha} titulo="“EL CONSUMIDOR”" nombre={nombreCliente} />
            </td>
          </tr>
          <tr className="align-bottom">
            <td className={`${CELL} text-center`}>
              <div className="h-10" />
              <p className="font-bold">&ldquo;EL CONSUMIDOR&rdquo;</p>
            </td>
            <td className={`${CELL} text-center`}>
              <div className="h-10" />
              <p className="font-bold">&ldquo;EL PROVEEDOR&rdquo;</p>
              <p className="text-[8px]">{PROVEEDOR.razonSocial}</p>
            </td>
            <td className={`${CELL} text-center`}>
              <div className="h-10" />
              <p>(Nombre o Clave)</p>
              <p className="font-bold">&ldquo;EL VALUADOR&rdquo;</p>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-1.5 text-justify font-bold">
        EL HORARIO DE SERVICIO AL PÚBLICO EN ESTE ESTABLECIMIENTO ES DE: {horario.toUpperCase()}. Para todo lo relativo a
        la interpretación, aplicación y cumplimiento del contrato, LAS PARTES acuerdan someterse en la vía administrativa
        a la Procuraduría Federal del Consumidor, y en caso de subsistir diferencias, a la jurisdicción de los tribunales
        competentes del lugar donde se celebra este Contrato.
      </p>

      {qrPrenda && (
        <div className="mt-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrPrenda} alt={`QR ${p.folio}`} className="h-16 w-16" />
          <p className="text-[8px] text-gray-700">
            <strong>Verificación de la prenda {p.folio}</strong><br />
            Escanea este código para consultar en línea la descripción, características, avalúo y fotografías de la
            prenda en garantía.
          </p>
        </div>
      )}
    </div>
  );
}

function FirmaLinea({ firma, fecha, titulo, nombre }: { firma?: string | null; fecha?: string | null; titulo: string; nombre: string }) {
  return (
    <div className="mt-1">
      <div className="flex h-12 items-end justify-center">
        {firma ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={firma} alt="Firma" className="max-h-12 object-contain" />
        ) : null}
      </div>
      <div className="mx-auto w-4/5 border-t border-black pt-0.5">
        <p className="font-bold">{titulo}</p>
        <p className="text-[8.5px]">{nombre}</p>
        {fecha && <p className="text-[8px] text-gray-600">Firmado {formatFecha(fecha)}</p>}
      </div>
    </div>
  );
}
