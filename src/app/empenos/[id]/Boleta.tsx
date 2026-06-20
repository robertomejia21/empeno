import type { EmpenoConDetalle, CalculoLiquidacion } from "@/lib/types";
import { formatMXN, formatFecha, formatFechaLarga, formatPorcentaje } from "@/lib/format";

const periodoLabel: Record<string, string> = {
  mensual: "mensual",
  quincenal: "quincenal",
  semanal: "semanal",
};

export function Boleta({
  empeno,
  calc,
}: {
  empeno: EmpenoConDetalle;
  calc: CalculoLiquidacion;
}) {
  const c = empeno.cliente;
  const p = empeno.prenda;

  return (
    <div className="print-only mx-auto max-w-[700px] p-8 text-[13px] text-black">
      <header className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <h1 className="text-lg font-bold">EMPEÑO SUITE</h1>
          <p className="text-xs">Casa de Empeño · Contrato Prendario</p>
        </div>
        <div className="text-right">
          <p className="text-xs">Folio</p>
          <p className="text-xl font-bold">{empeno.folio}</p>
          <p className="text-xs">{formatFechaLarga(empeno.fechaInicio)}</p>
        </div>
      </header>

      <section className="mt-4">
        <h2 className="mb-1 font-bold uppercase">Datos del cliente (pignorante)</h2>
        <table className="w-full">
          <tbody>
            <tr>
              <td className="py-0.5 pr-2 text-gray-600">Nombre:</td>
              <td className="py-0.5 font-medium">
                {c.nombre} {c.apellidoPaterno} {c.apellidoMaterno}
              </td>
              <td className="py-0.5 pr-2 text-gray-600">CURP:</td>
              <td className="py-0.5 font-medium">{c.curp ?? "—"}</td>
            </tr>
            <tr>
              <td className="py-0.5 pr-2 text-gray-600">Identificación:</td>
              <td className="py-0.5 font-medium">
                {c.tipoIdentificacion} {c.numeroIdentificacion}
              </td>
              <td className="py-0.5 pr-2 text-gray-600">Teléfono:</td>
              <td className="py-0.5 font-medium">{c.telefono ?? "—"}</td>
            </tr>
            <tr>
              <td className="py-0.5 pr-2 text-gray-600">Domicilio:</td>
              <td className="py-0.5 font-medium" colSpan={3}>
                {c.direccion ?? "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-4">
        <h2 className="mb-1 font-bold uppercase">Bien prendario</h2>
        <table className="w-full">
          <tbody>
            <tr>
              <td className="py-0.5 pr-2 text-gray-600">Descripción:</td>
              <td className="py-0.5 font-medium" colSpan={3}>
                {p.descripcion}
              </td>
            </tr>
            <tr>
              <td className="py-0.5 pr-2 text-gray-600">Departamento:</td>
              <td className="py-0.5 font-medium">{p.categoria}</td>
              <td className="py-0.5 pr-2 text-gray-600">Características:</td>
              <td className="py-0.5 font-medium">
                {[p.marca, p.submarca, p.modelo, p.color, p.kilataje, p.placas, p.serie]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </td>
            </tr>
            <tr>
              <td className="py-0.5 pr-2 text-gray-600">Avalúo:</td>
              <td className="py-0.5 font-medium">{formatMXN(p.valorAvaluo)}</td>
              <td className="py-0.5 pr-2 text-gray-600">Resguardo:</td>
              <td className="py-0.5 font-medium">{p.ubicacionResguardo ?? "—"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-4">
        <h2 className="mb-1 font-bold uppercase">Condiciones del préstamo</h2>
        <table className="w-full border border-black">
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r border-black p-2">
                <span className="text-gray-600">Monto prestado</span>
                <br />
                <span className="text-base font-bold">{formatMXN(empeno.montoPrestado)}</span>
              </td>
              <td className="border-r border-black p-2">
                <span className="text-gray-600">Interés</span>
                <br />
                <span className="text-base font-bold">
                  {formatPorcentaje(empeno.tasaInteres)} {periodoLabel[empeno.periodo]}
                </span>
              </td>
              <td className="p-2">
                <span className="text-gray-600">Total a liquidar (1er periodo)</span>
                <br />
                <span className="text-base font-bold">
                  {formatMXN(empeno.montoPrestado + empeno.montoPrestado * (empeno.tasaInteres / 100))}
                </span>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black p-2">
                <span className="text-gray-600">Fecha de inicio</span>
                <br />
                <span className="font-medium">{formatFecha(empeno.fechaInicio)}</span>
              </td>
              <td className="border-r border-black p-2">
                <span className="text-gray-600">Fecha de vencimiento</span>
                <br />
                <span className="font-medium">{formatFecha(empeno.fechaVencimiento)}</span>
              </td>
              <td className="p-2">
                <span className="text-gray-600">Días de gracia</span>
                <br />
                <span className="font-medium">{empeno.diasGracia} días</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-4 text-[11px] leading-relaxed text-gray-700">
        <p>
          El pignorante declara ser el legítimo propietario del bien descrito y lo
          entrega en garantía del préstamo. El refrendo o pago deberá realizarse dentro
          del plazo pactado. Transcurrido el vencimiento y los días de gracia sin pago
          ni refrendo, el bien podrá pasar a remate conforme a las políticas internas y
          a la normativa aplicable (PROFECO/CONDUSEF).
        </p>
      </section>

      <section className="mt-10 flex justify-between">
        <div className="w-[45%] border-t border-black pt-1 text-center text-xs">
          Firma del cliente
        </div>
        <div className="w-[45%] border-t border-black pt-1 text-center text-xs">
          Firma y sello de la casa de empeño
        </div>
      </section>
    </div>
  );
}
