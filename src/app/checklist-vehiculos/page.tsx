import { listarPrendas, listarChecklistsVehiculares } from "@/lib/db/repo";
import { PageHeader, Card, CardHeader, EmptyState } from "@/components/ui";
import { formatFecha } from "@/lib/format";
import { ChecklistVehiculosForm } from "./ChecklistVehiculosForm";

export default async function ChecklistVehiculosPage() {
  const [prendas, historial] = await Promise.all([listarPrendas(), listarChecklistsVehiculares()]);

  const vehiculosEnResguardo = prendas.filter(
    (p) => p.categoria === "Vehículos" && p.estado === "empenada" && p.modalidad === "resguardo"
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Checklist diario de vehículos"
        subtitle="Revisión física de los vehículos que están en resguardo — una vez al día"
      />

      {vehiculosEnResguardo.length === 0 ? (
        <Card>
          <EmptyState
            titulo="Sin vehículos en resguardo"
            descripcion="No hay vehículos en modalidad resguardo pendientes de revisión hoy."
          />
        </Card>
      ) : (
        <ChecklistVehiculosForm vehiculos={vehiculosEnResguardo} />
      )}

      {historial.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Historial" subtitle={`${historial.length} checklist(s) guardados`} />
          <ul className="divide-y divide-border">
            {historial.slice(0, 15).map((c) => {
              const incidencias = c.filas.filter((f) => f.observaciones || !f.presente).length;
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{formatFecha(c.fecha)} · {c.responsable}</p>
                    {c.incidencias && <p className="truncate text-xs text-muted">{c.incidencias}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {c.filas.length} vehículo(s){incidencias > 0 ? ` · ${incidencias} con nota` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
