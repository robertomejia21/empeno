import Link from "next/link";
import { listarEmpenos } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { resumenModalidades, modalidadVehiculo } from "@/lib/gps";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge } from "@/components/ui";
import { GpsModalidades } from "@/components/GpsModalidades";

export default async function GpsPage() {
  const empenos = await listarEmpenos();
  const resumen = resumenModalidades(empenos);

  const vehiculosActivos = empenos.filter(
    (e) => (e.estado === "activo" || e.estado === "refrendado") && e.prenda.categoria === "Vehículos"
  );
  const porGps = vehiculosActivos.filter((e) => modalidadVehiculo(e.prenda) === "gps");
  const porResguardo = vehiculosActivos.filter((e) => modalidadVehiculo(e.prenda) === "resguardo");

  return (
    <div>
      <PageHeader title="GPS y resguardo" subtitle="Vehículos en garantía por modalidad" />

      <GpsModalidades resumen={resumen} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ListaVehiculos titulo="📡 Con GPS" empenos={porGps} />
        <ListaVehiculos titulo="🏢 En resguardo" empenos={porResguardo} />
      </div>
    </div>
  );
}

function ListaVehiculos({ titulo, empenos }: { titulo: string; empenos: Awaited<ReturnType<typeof listarEmpenos>> }) {
  return (
    <Card>
      <CardHeader title={titulo} subtitle={`${empenos.length} vehículo(s)`} />
      {empenos.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">Sin vehículos en esta modalidad.</p>
      ) : (
        <ul className="divide-y divide-border">
          {empenos.map((e) => {
            const calc = calcularLiquidacion(e);
            return (
              <li key={e.id}>
                <Link href={`/empenos/${e.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-surface-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {e.prenda.descripcion || `${e.prenda.marca ?? ""} ${e.prenda.submarca ?? ""}`.trim()}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {e.folio} · {e.cliente.nombre} {e.cliente.apellidoPaterno}
                      {e.prenda.placas ? ` · ${e.prenda.placas}` : ""} · vence {formatFecha(e.fechaVencimiento)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
