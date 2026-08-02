import type { EmpenoConDetalle, CalculoLiquidacion } from "@/lib/types";
import { formatMXN, formatFecha, formatPorcentaje } from "@/lib/format";
import { pesosALetras } from "@/lib/letras";
import { PROVEEDOR, PROFECO, periodosPorAnio } from "@/lib/negocio";

const periodoLabel: Record<string, string> = { mensual: "mensual", quincenal: "quincenal", semanal: "semanal" };

function sumarDias(iso: string, dias: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function ContratoProfeco({ empeno, calc }: { empeno: EmpenoConDetalle; calc: CalculoLiquidacion }) {
  const c = empeno.cliente;
  const p = empeno.prenda;

  const monto = empeno.montoPrestado;
  const tasaAnual = empeno.tasaInteres * periodosPorAnio(empeno.periodo);
  const interesPeriodo = monto * (empeno.tasaInteres / 100);
  const almacenajePeriodo = monto * (empeno.almacenajePct / 100);
  const ivaPeriodo = (interesPeriodo + almacenajePeriodo) * (empeno.ivaPct / 100);
  const refrendoPeriodo = interesPeriodo + almacenajePeriodo + ivaPeriodo;
  const interesTotal = interesPeriodo * empeno.plazoPeriodos;
  const almacenajeTotal = almacenajePeriodo * empeno.plazoPeriodos;
  const ivaTotal = (interesTotal + almacenajeTotal) * (empeno.ivaPct / 100);
  const montoTotalPagar = monto + interesTotal + almacenajeTotal + ivaTotal;
  const costoMensual = tasaAnual / 12;
  const costoDiario = tasaAnual / 360;
  const pctPrestamo = p.valorAvaluo > 0 ? (monto / p.valorAvaluo) * 100 : 0;
  const inicioComercializacion = sumarDias(empeno.fechaVencimiento, empeno.diasGracia);
  const caracteristicas =
    [p.marca, p.submarca, p.modelo, p.color, p.kilataje, p.gramos ? `${p.gramos} g` : null, p.placas, p.serie]
      .filter(Boolean).join(" · ") || "—";

  return (
    <div className="contrato mx-auto max-w-[880px] bg-white p-8 text-[10.5px] leading-snug text-black">
      {/* Encabezado */}
      <div className="flex items-start justify-between border-b-2 border-black pb-2">
        <div>
          <p className="text-[13px] font-bold">{PROVEEDOR.marca}</p>
          <p className="text-[9.5px]">{PROVEEDOR.razonSocial} · R.F.C. {PROVEEDOR.rfc}</p>
        </div>
        <div className="text-right">
          <p className="text-[9.5px]">FOLIO No.</p>
          <p className="text-base font-bold">{empeno.folio}</p>
        </div>
      </div>

      <p className="mt-2 text-center text-[12px] font-bold uppercase">
        Contrato de Mutuo con Interés y Garantía Prendaria (Préstamo)
      </p>

      {/* Partes */}
      <p className="mt-1 text-justify">
        Fecha de celebración del contrato: Mexicali, Baja California, a {formatFecha(empeno.fechaInicio)}. Que celebran:{" "}
        <strong>{PROVEEDOR.razonSocial}</strong>, &ldquo;EL PROVEEDOR&rdquo;, con domicilio en {PROVEEDOR.domicilio},
        R.F.C. {PROVEEDOR.rfc}, Tel.: {PROVEEDOR.telefono || "____________"}, correo electrónico:{" "}
        {PROVEEDOR.correo || "____________"}; y <strong>{c.nombre} {c.apellidoPaterno} {c.apellidoMaterno}</strong>{" "}
        &ldquo;EL CONSUMIDOR&rdquo;, que se identifica con {c.tipoIdentificacion} número {c.numeroIdentificacion}, con
        domicilio en {c.direccion || "____________"}, Tel.: {c.telefono || "____________"}, correo electrónico:{" "}
        {c.email || "____________"}, quien designa como cotitular a (en su caso): ____________, y beneficiario a (en su
        caso): ____________, solo para efectos de este contrato.
      </p>

      {/* Cuadro financiero */}
      <table className="mt-3 w-full border border-black text-center text-[10px]">
        <thead>
          <tr className="border-b border-black align-top">
            <th className="border-r border-black p-1">CAT<br /><span className="font-normal">Costo Anual Total*</span></th>
            <th className="border-r border-black p-1">Tasa de interés anual<br /><span className="font-normal">FIJA sin IVA</span></th>
            <th className="border-r border-black p-1">Monto del préstamo (mutuo)</th>
            <th className="border-r border-black p-1">Monto total a pagar**</th>
            <th className="p-1">Comisiones</th>
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            <td className="border-r border-black p-1 font-bold">{formatPorcentaje(tasaAnual)}</td>
            <td className="border-r border-black p-1 font-bold">{formatPorcentaje(tasaAnual)}</td>
            <td className="border-r border-black p-1 font-bold">{formatMXN(monto)}<br /><span className="text-[8px] font-normal">Moneda Nacional</span></td>
            <td className="border-r border-black p-1 font-bold">{formatMXN(montoTotalPagar)}<br /><span className="text-[8px] font-normal">Estimado al plazo máximo</span></td>
            <td className="p-1 text-left text-[8.5px] leading-tight">
              Almacenaje: {formatPorcentaje(empeno.almacenajePct)} [Cláus. 11 a)]<br />
              Avalúo: $______ [Cláus. 11 b)]<br />
              Comercialización: ____% [Cláus. 11 c)]<br />
              Reposición de contrato: $______ [Cláus. 11 d)]<br />
              Desempeño extemporáneo: ____% [Cláus. 11 e)]<br />
              Gastos de administración: $______ [Cláus. 11 f)]
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-1 text-[8.5px]">
        * y ** Para fines informativos y de comparación. <strong>Metodología de cálculo del interés:</strong> tasa de
        interés anual fija dividida entre 360 días, por el importe del saldo insoluto del préstamo, por el número de días
        efectivamente transcurridos.
      </p>

      <p className="mt-2 text-justify">
        <strong>Plazo del préstamo</strong> (fecha límite para el refrendo o desempeño):{" "}
        <strong>{formatFecha(empeno.fechaVencimiento)}</strong>. Total de refrendos aplicables:{" "}
        <strong>{empeno.plazoPeriodos}</strong>. Periodicidad: <strong>{periodoLabel[empeno.periodo]}</strong>. Su pago
        será por refrendo o desempeño. Métodos de pago aceptados: efectivo, tarjetas de crédito y débito, transferencias.
        En caso de que el vencimiento sea en día inhábil, se considerará el día hábil siguiente.
      </p>

      {/* Opciones de pago */}
      <table className="mt-2 w-full border border-black text-center text-[9px]">
        <thead>
          <tr className="border-b border-black bg-gray-100 align-top">
            <th className="border-r border-black p-1">Opciones de pago para refrendo o desempeño</th>
            <th className="border-r border-black p-1">Importe del mutuo</th>
            <th className="border-r border-black p-1">Intereses</th>
            <th className="border-r border-black p-1">Almacenaje</th>
            <th className="border-r border-black p-1">IVA</th>
            <th className="border-r border-black p-1">Monto total a pagar</th>
            <th className="p-1">Cuándo se realizan</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1 font-semibold">Por refrendo (1 periodo)</td>
            <td className="border-r border-black p-1">—</td>
            <td className="border-r border-black p-1">{formatMXN(interesPeriodo)}</td>
            <td className="border-r border-black p-1">{formatMXN(almacenajePeriodo)}</td>
            <td className="border-r border-black p-1">{formatMXN(ivaPeriodo)}</td>
            <td className="border-r border-black p-1 font-bold">{formatMXN(refrendoPeriodo)}</td>
            <td className="p-1">Al vencimiento</td>
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1 font-semibold">Por desempeño (hoy)</td>
            <td className="border-r border-black p-1">{formatMXN(calc.capital)}</td>
            <td className="border-r border-black p-1">{formatMXN(calc.interesAcumulado)}</td>
            <td className="border-r border-black p-1">{formatMXN(calc.almacenajeAcumulado)}</td>
            <td className="border-r border-black p-1">{formatMXN(calc.ivaAcumulado)}</td>
            <td className="border-r border-black p-1 font-bold">{formatMXN(calc.totalDesempeno)}</td>
            <td className="p-1">Antes del vencimiento</td>
          </tr>
          <tr>
            <td className="border-r border-black p-1 font-semibold">Costo mensual total / diario total*</td>
            <td className="border-r border-black p-1" colSpan={5}>
              Mensual: {formatPorcentaje(costoMensual)} FIJO sin IVA · Diario: {formatPorcentaje(costoDiario)} FIJO sin IVA
            </td>
            <td className="p-1">Informativo</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2 text-[9.5px] font-semibold">
        &ldquo;Cuide su capacidad de pago, generalmente no debe exceder del 35% de sus ingresos.&rdquo; · &ldquo;Si usted
        no paga en tiempo y forma corre el riesgo de perder sus prendas.&rdquo;
      </p>

      {/* Garantía */}
      <p className="mt-2 text-justify">
        <strong>GARANTÍA:</strong> Para garantizar el pago de este préstamo, el consumidor deja en garantía el bien que
        se describe a continuación:
      </p>
      <table className="mt-1 w-full border border-black text-center text-[9.5px]">
        <thead>
          <tr className="border-b border-black bg-gray-100">
            <th className="border-r border-black p-1">Descripción de la prenda</th>
            <th className="border-r border-black p-1">Características</th>
            <th className="border-r border-black p-1">Avalúo</th>
            <th className="border-r border-black p-1">Préstamo</th>
            <th className="p-1">% préstamo s/avalúo</th>
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            <td className="border-r border-black p-1 text-left">{p.descripcion}</td>
            <td className="border-r border-black p-1 text-left">{caracteristicas}</td>
            <td className="border-r border-black p-1">{formatMXN(p.valorAvaluo)}</td>
            <td className="border-r border-black p-1">{formatMXN(monto)}</td>
            <td className="p-1">{formatPorcentaje(pctPrestamo)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-1 text-justify text-[9.5px]">
        Monto del avalúo: <strong>{formatMXN(p.valorAvaluo)}</strong> ({pesosALetras(p.valorAvaluo)}). Porcentaje del
        préstamo sobre el avalúo: <strong>{formatPorcentaje(pctPrestamo)}</strong>. Fecha de inicio de comercialización:{" "}
        <strong>{formatFecha(inicioComercializacion)}</strong>. El monto del préstamo se realizará en:{" "}
        {empeno.metodoPago === "efectivo"
          ? "Efectivo."
          : `${empeno.metodoPago} a la cuenta bancaria del Consumidor (número de cuenta o CLABE / Institución).`}{" "}
        Fecha límite de finiquito y términos para pagos anticipados: conforme a la cláusula 13 (Décimo Tercera, inciso b).
        Estos conceptos causarán IVA a la tasa del {formatPorcentaje(empeno.ivaPct)}. *El procedimiento para desempeño,
        refrendo, finiquito y reclamo del remanente se encuentra descrito en el clausulado del contrato.
      </p>

      {/* Dudas y aclaraciones */}
      <p className="mt-2 text-justify text-[9px]">
        <strong>Dudas, aclaraciones y reclamaciones:</strong> favor de dirigirse a: Domicilio: {PROVEEDOR.domicilio};
        Teléfono: {PROVEEDOR.telefono || "____________"}; correo electrónico: {PROVEEDOR.correo || "____________"};
        Página de Internet: {PROVEEDOR.paginaWeb}, en un horario de {PROVEEDOR.horario}. O en su caso a PROFECO a los
        teléfonos: {PROFECO.telefonos}, Página de Internet: {PROFECO.paginaWeb}. Estado de cuenta/consulta de
        movimientos: NO APLICA. Contrato de Adhesión registrado en el Registro Público de Contratos de Adhesión de la
        PROFECO bajo el número {PROVEEDOR.registroRPCA} de fecha {PROVEEDOR.registroFecha}.
      </p>

      {/* Desempeño / finiquito */}
      <p className="mt-2 border-t border-black pt-2 text-justify text-[9px]">
        <strong>DESEMPEÑO:</strong> &ldquo;EL CONSUMIDOR&rdquo; recoge en el acto y a su entera satisfacción la(s)
        prenda(s) arriba descrita(s), por lo que otorga a {PROVEEDOR.razonSocial} el finiquito más amplio que en derecho
        corresponda, liberándolo de cualquier responsabilidad jurídica que hubiere surgido o pudiese surgir en relación
        al contrato y a la prenda.
      </p>

      {/* Firmas */}
      <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[9.5px]">
        <Firma titulo="EL CONSUMIDOR" nombre={`${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno}`} firma={empeno.firmaCliente} fecha={empeno.firmaFecha} />
        <Firma titulo="EL PROVEEDOR" nombre={PROVEEDOR.marca} />
        <Firma titulo="EL VALUADOR" nombre="&nbsp;" />
      </div>

      <p className="mt-6 text-justify text-[8.5px]">
        EL HORARIO DE SERVICIO AL PÚBLICO EN ESTE ESTABLECIMIENTO ES DE: {PROVEEDOR.horario}. Para todo lo relativo a la
        interpretación, aplicación y cumplimiento del contrato, LAS PARTES acuerdan someterse en la vía administrativa a
        la Procuraduría Federal del Consumidor, y en caso de subsistir diferencias, a la jurisdicción de los tribunales
        competentes del lugar donde se celebra este Contrato.
      </p>
    </div>
  );
}

function Firma({ titulo, nombre, firma, fecha }: { titulo: string; nombre: string; firma?: string | null; fecha?: string | null }) {
  return (
    <div>
      <div className="mb-1 flex h-16 items-end justify-center">
        {firma ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={firma} alt="Firma" className="max-h-16 object-contain" />
        ) : null}
      </div>
      <div className="border-t border-black pt-1">
        <p className="font-semibold">{titulo}</p>
        <p dangerouslySetInnerHTML={{ __html: nombre }} />
        {fecha && <p className="text-[8.5px] text-gray-600">Firmado {formatFecha(fecha)}</p>}
      </div>
    </div>
  );
}
