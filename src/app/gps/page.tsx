import Link from "next/link";
import { CalendarDays, Satellite, Warehouse } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { listarEmpenos, obtenerReglasCalculo } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { resumenModalidades, modalidadVehiculo } from "@/lib/gps";
import { rastreoHabilitado } from "@/lib/gpsRastreo";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge } from "@/components/ui";
import { GpsModalidades } from "@/components/GpsModalidades";

export default async function GpsPage({ searchParams }: { searchParams: Promise<{ modalidad?: string }> }) {
  const { modalidad } = await searchParams;
  const filtro = modalidad === "gps" || modalidad === "resguardo" ? modalidad : null;
  const festivos = await obtenerReglasCalculo();
  const empenos = await listarEmpenos();
  const resumen = resumenModalidades(empenos);

  const vehiculosActivos = empenos.filter(
    (e) => (e.estado === "activo" || e.estado === "refrendado") && e.prenda.categoria === "Vehículos"
  );
  const porGps = vehiculosActivos.filter((e) => modalidadVehiculo(e.prenda) === "gps");
  const porResguardo = vehiculosActivos.filter((e) => modalidadVehiculo(e.prenda) === "resguardo");

  return (
    <div>
      <PageHeader
        title="GPS y resguardo"
        subtitle="Vehículos en garantía por modalidad"
        action={
          <Link href="/gps/citas" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg shadow-soft transition hover:brightness-105">
            <CalendarDays className="h-4 w-4" aria-hidden /> Citas de GPS
          </Link>
        }
      />

      {!rastreoHabilitado() && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          <Satellite className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>El rastreo en vivo aún no está conectado — por ahora la ubicación de cada vehículo con GPS se anota a mano
          al registrarlo (ver &quot;Ubicación del GPS&quot;). En cuanto se confirme el proveedor de rastreo, se conecta aquí.</p>
        </div>
      )}

      <GpsModalidades resumen={resumen} enlaces />

      {filtro ? (
        <TablaUnidades
          titulo={filtro === "gps" ? "Unidades en modalidad GPS" : "Unidades en resguardo"}
          icono={filtro === "gps" ? Satellite : Warehouse}
          empenos={filtro === "gps" ? porGps : porResguardo}
          festivos={festivos}
          otra={filtro === "gps" ? "resguardo" : "gps"}
        />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ListaVehiculos titulo="Con GPS" icono={Satellite} empenos={porGps} festivos={festivos} />
          <ListaVehiculos titulo="En resguardo" icono={Warehouse} empenos={porResguardo} festivos={festivos} />
        </div>
      )}
    </div>
  );
}

function ListaVehiculos({
  titulo,
  icono: Icono,
  empenos,
  festivos,
}: {
  titulo: string;
  festivos: import("@/lib/ajustesBase").ReglasCalculo;
  icono: LucideIcon;
  empenos: Awaited<ReturnType<typeof listarEmpenos>> }) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Icono className="h-5 w-5 text-primary" aria-hidden /> {titulo}
          </span>
        } subtitle={`${empenos.length} vehículo(s)`} />
      {empenos.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">Sin vehículos en esta modalidad.</p>
      ) : (
        <ul className="divide-y divide-border">
          {empenos.map((e) => {
            const calc = calcularLiquidacion(e, undefined, festivos);
            return (
              <li key={e.id}>
                <Link href={`/empenos/${e.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-2 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {e.prenda.descripcion || `${e.prenda.marca ?? ""} ${e.prenda.submarca ?? ""}`.trim()}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {e.folio} · {e.cliente.nombre} {e.cliente.apellidoPaterno}
                      {e.prenda.placas ? ` · ${e.prenda.placas}` : ""} · vence {formatFecha(e.fechaVencimiento)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <span className="text-sm font-semibold tabular-nums text-foreground">{formatMXN(e.montoPrestado)}</span>
                    {calc.vencido && <Badge tono="danger">Vencido</Badge>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** Listado detallado de las unidades de una modalidad (acceso directo desde el tablero). */
function TablaUnidades({
  titulo,
  icono: Icono,
  empenos,
  festivos,
  otra,
}: {
  titulo: string;
  icono: LucideIcon;
  empenos: Awaited<ReturnType<typeof listarEmpenos>>;
  festivos: import("@/lib/ajustesBase").ReglasCalculo;
  otra: "gps" | "resguardo";
}) {
  const filas = empenos.map((e) => ({ e, calc: calcularLiquidacion(e, undefined, festivos) }));
  const totalPrestado = filas.reduce((s, x) => s + x.e.montoPrestado, 0);
  const totalLiquidar = filas.reduce((s, x) => s + x.calc.totalDesempeno, 0);
  return (
    <div id="unidades" className="mt-6 scroll-mt-4">
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Icono className="h-5 w-5 text-primary" aria-hidden /> {titulo}
          </span>
        }
        subtitle={`${filas.length} vehículo(s) · ${formatMXN(totalPrestado)} prestado · ${formatMXN(totalLiquidar)} a liquidar hoy`}
        action={
          <div className="flex flex-wrap gap-3 text-sm font-medium">
            <Link href={`/gps?modalidad=${otra}#unidades`} className="text-primary hover:underline">
              Ver {otra === "gps" ? "GPS" : "resguardo"}
            </Link>
            <Link href="/gps" className="text-primary hover:underline">Ver ambas</Link>
          </div>
        }
      />
      {filas.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">Sin vehículos en esta modalidad.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2 font-medium sm:px-5">Contrato</th>
                <th className="px-3 py-2 font-medium">Vehículo</th>
                <th className="px-3 py-2 font-medium">Placas / Serie</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 text-right font-medium">Prestado</th>
                <th className="px-3 py-2 text-right font-medium">Refrendo</th>
                <th className="px-3 py-2 text-right font-medium">A liquidar</th>
                <th className="px-3 py-2 font-medium">Vence</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map(({ e, calc }) => (
                <tr key={e.id} className="transition hover:bg-surface-2">
                  <td className="px-4 py-2.5 font-medium sm:px-5">
                    <Link href={`/empenos/${e.id}`} className="text-primary hover:underline">{e.folio}</Link>
                  </td>
                  <td className="px-3 py-2.5 text-foreground">
                    {e.prenda.descripcion || `${e.prenda.marca ?? ""} ${e.prenda.submarca ?? ""}`.trim()}
                    {e.prenda.modelo ? <span className="text-muted"> · {e.prenda.modelo}</span> : null}
                    {e.prenda.color ? <span className="text-muted"> · {e.prenda.color}</span> : null}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted">
                    {e.prenda.placas || "—"}
                    {e.prenda.serie ? <><br />{e.prenda.serie}</> : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/clientes/${e.clienteId}`} className="text-foreground hover:underline">
                      {e.cliente.nombre} {e.cliente.apellidoPaterno}
                    </Link>
                    {e.cliente.telefono ? <p className="text-xs text-muted">{e.cliente.telefono}</p> : null}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMXN(e.montoPrestado)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMXN(calc.totalRefrendo)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatMXN(calc.totalDesempeno)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatFecha(e.fechaVencimiento)}</td>
                  <td className="px-3 py-2.5">
                    {calc.vencido ? (
                      <Badge tono="danger">Vencido · {calc.diasAtraso} d</Badge>
                    ) : calc.diasParaVencer <= 7 ? (
                      <Badge tono="warning">Vence en {calc.diasParaVencer} d</Badge>
                    ) : (
                      <Badge tono="success">Vigente</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
    </div>
  );
}
