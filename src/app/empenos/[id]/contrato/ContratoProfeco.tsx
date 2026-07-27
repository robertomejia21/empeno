import type { EmpenoConDetalle, CalculoLiquidacion } from "@/lib/types";
import { formatMXN, formatFecha, formatPorcentaje } from "@/lib/format";
import { pesosALetras } from "@/lib/letras";
import { PROVEEDOR, PROFECO, periodosPorAnio } from "@/lib/negocio";

const periodoLabel: Record<string, string> = { mensual: "mensual", quincenal: "quincenal", semanal: "semanal" };

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
  const pctPrestamo = p.valorAvaluo > 0 ? (monto / p.valorAvaluo) * 100 : 0;
  const caracteristicas = [p.marca, p.submarca, p.modelo, p.color, p.kilataje, p.gramos ? `${p.gramos} g` : null, p.placas, p.serie]
    .filter(Boolean).join(" · ") || "—";

  return (
    <div className="contrato mx-auto max-w-[840px] bg-white p-8 text-[11.5px] leading-snug text-black">
      {/* Encabezado */}
      <div className="flex items-start justify-between border-b-2 border-black pb-2">
        <div>
          <p className="text-[13px] font-bold">{PROVEEDOR.marca}</p>
          <p className="text-[10px]">{PROVEEDOR.razonSocial} · R.F.C. {PROVEEDOR.rfc}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px]">FOLIO No.</p>
          <p className="text-base font-bold">{empeno.folio}</p>
        </div>
      </div>

      <p className="mt-2 text-center text-[12px] font-bold uppercase">
        Contrato de Mutuo con Interés y Garantía Prendaria (Préstamo)
      </p>
      <p className="mt-1 text-[10.5px]">
        Fecha de celebración: Mexicali, Baja California, a {formatFecha(empeno.fechaInicio)}. Que celebran:{" "}
        <strong>{PROVEEDOR.razonSocial}</strong> (&ldquo;EL PROVEEDOR&rdquo;), con domicilio en {PROVEEDOR.domicilio},
        R.F.C. {PROVEEDOR.rfc}; y <strong>{c.nombre} {c.apellidoPaterno} {c.apellidoMaterno}</strong>{" "}
        (&ldquo;EL CONSUMIDOR&rdquo;), que se identifica con {c.tipoIdentificacion} número {c.numeroIdentificacion}
        {c.direccion ? `, con domicilio en ${c.direccion}` : ""}
        {c.telefono ? `, Tel. ${c.telefono}` : ""}.
      </p>

      {/* Cuadro financiero */}
      <table className="mt-3 w-full border border-black text-center text-[10.5px]">
        <thead>
          <tr className="border-b border-black">
            <th className="border-r border-black p-1">CAT<br /><span className="font-normal">Costo Anual Total*</span></th>
            <th className="border-r border-black p-1">Tasa de interés anual<br /><span className="font-normal">fija sin IVA</span></th>
            <th className="border-r border-black p-1">Monto del préstamo (mutuo)</th>
            <th className="border-r border-black p-1">Monto total a pagar**</th>
            <th className="p-1">Comisiones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-r border-black p-1 font-bold">{formatPorcentaje(tasaAnual)}</td>
            <td className="border-r border-black p-1 font-bold">{formatPorcentaje(tasaAnual)}</td>
            <td className="border-r border-black p-1 font-bold">{formatMXN(monto)}</td>
            <td className="border-r border-black p-1 font-bold">{formatMXN(montoTotalPagar)}</td>
            <td className="p-1 text-left text-[9.5px]">
              Almacenaje: {formatPorcentaje(empeno.almacenajePct)}<br />
              Avalúo: incluido<br />
              Comercialización: s/políticas<br />
              Gastos de administración: s/recibo
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-1 text-[9px]">
        * y ** Para fines informativos y de comparación. Metodología de cálculo del interés: tasa de interés anual fija
        dividida entre 360 días, por el saldo insoluto del préstamo, por el número de días efectivamente transcurridos.
      </p>

      <p className="mt-2 text-[10.5px]">
        Plazo del préstamo (fecha límite para refrendo o desempeño): <strong>{formatFecha(empeno.fechaVencimiento)}</strong>.
        Periodicidad: <strong>{periodoLabel[empeno.periodo]}</strong>. Total de refrendos aplicables:{" "}
        <strong>{empeno.plazoPeriodos}</strong>. Días de gracia: <strong>{empeno.diasGracia}</strong>.
        Métodos de pago aceptados: efectivo, tarjetas de crédito y débito, transferencias.
      </p>

      {/* Opciones de pago */}
      <table className="mt-2 w-full border border-black text-center text-[10px]">
        <thead>
          <tr className="border-b border-black bg-gray-100">
            <th className="border-r border-black p-1">Opción de pago</th>
            <th className="border-r border-black p-1">Importe del mutuo</th>
            <th className="border-r border-black p-1">Intereses</th>
            <th className="border-r border-black p-1">Almacenaje</th>
            <th className="border-r border-black p-1">IVA</th>
            <th className="p-1">Monto total a pagar</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1 font-semibold">Por refrendo (1 periodo)</td>
            <td className="border-r border-black p-1">—</td>
            <td className="border-r border-black p-1">{formatMXN(interesPeriodo)}</td>
            <td className="border-r border-black p-1">{formatMXN(almacenajePeriodo)}</td>
            <td className="border-r border-black p-1">{formatMXN(ivaPeriodo)}</td>
            <td className="p-1 font-bold">{formatMXN(refrendoPeriodo)}</td>
          </tr>
          <tr>
            <td className="border-r border-black p-1 font-semibold">Por desempeño (hoy)</td>
            <td className="border-r border-black p-1">{formatMXN(calc.capital)}</td>
            <td className="border-r border-black p-1">{formatMXN(calc.interesAcumulado)}</td>
            <td className="border-r border-black p-1">{formatMXN(calc.almacenajeAcumulado)}</td>
            <td className="border-r border-black p-1">{formatMXN(calc.ivaAcumulado)}</td>
            <td className="p-1 font-bold">{formatMXN(calc.totalDesempeno)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2 text-[9.5px] font-semibold">
        &ldquo;Cuide su capacidad de pago, generalmente no debe exceder del 35% de sus ingresos.&rdquo; · &ldquo;Si usted no
        paga en tiempo y forma corre el riesgo de perder sus prendas.&rdquo;
      </p>

      {/* Garantía */}
      <p className="mt-2 text-[11px] font-bold uppercase">Garantía — descripción de la prenda</p>
      <table className="w-full border border-black text-[10.5px]">
        <tbody>
          <tr className="border-b border-black">
            <td className="w-1/2 border-r border-black p-1"><span className="text-gray-600">Descripción: </span>{p.descripcion}</td>
            <td className="p-1"><span className="text-gray-600">Características: </span>{caracteristicas}</td>
          </tr>
          <tr>
            <td className="border-r border-black p-1"><span className="text-gray-600">Avalúo: </span><strong>{formatMXN(p.valorAvaluo)}</strong> ({pesosALetras(p.valorAvaluo)})</td>
            <td className="p-1">
              <span className="text-gray-600">Préstamo: </span><strong>{formatMXN(monto)}</strong> ·{" "}
              <span className="text-gray-600">% sobre avalúo: </span><strong>{formatPorcentaje(pctPrestamo)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2 text-[9px] text-gray-700">
        El monto del préstamo se entrega en efectivo o a la cuenta del Consumidor. El procedimiento para desempeño,
        refrendo, finiquito y reclamo del remanente se describe en el clausulado del contrato. Estos conceptos causan IVA
        a la tasa de {formatPorcentaje(empeno.ivaPct)}. Contrato de Adhesión registrado en el Registro Público de
        Contratos de Adhesión de la PROFECO bajo el número {PROVEEDOR.registroRPCA} de fecha {PROVEEDOR.registroFecha}.
        Dudas, aclaraciones y reclamaciones: PROFECO {PROFECO.telefonos} · {PROFECO.paginaWeb}.
      </p>

      {/* Firmas */}
      <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[10px]">
        <Firma titulo="EL CONSUMIDOR" nombre={`${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno}`} firma={empeno.firmaCliente} fecha={empeno.firmaFecha} />
        <Firma titulo="EL PROVEEDOR" nombre={PROVEEDOR.marca} />
        <Firma titulo="EL VALUADOR" nombre="&nbsp;" />
      </div>
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
        {fecha && <p className="text-[9px] text-gray-600">Firmado {formatFecha(fecha)}</p>}
      </div>
    </div>
  );
}
