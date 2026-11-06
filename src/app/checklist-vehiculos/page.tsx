import { listarPrendas, listarChecklistsVehiculares, listarChecklistsSemanales } from "@/lib/db/repo";
import { ChecklistSemanal } from "./ChecklistSemanal";
import { rangoSemanaActual } from "@/lib/reporteSemanal";
import { hoyISO } from "@/lib/format";
import { RESPONSABLE_CHECKLIST_DEFAULT } from "@/lib/checklist";
import { PageHeader, Card, CardHeader, EmptyState } from "@/components/ui";
import { formatFecha } from "@/lib/format";
import { ChecklistVehiculosForm } from "./ChecklistVehiculosForm";

export default async function ChecklistVehiculosPage() {
  const [prendas, historial, semanales] = await Promise.all([listarPrendas(), listarChecklistsVehiculares(), listarChecklistsSemanales()]);
  const viernes = rangoSemanaActual().hasta;

  const vehiculosEnResguardo = prendas.filter(
    (p) => p.categoria === "Vehículos" && p.estado === "empenada" && p.modalidad === "resguardo"
  );

  return (
    <div>
      <PageHeader
        title="Checklist de vehículos"
        subtitle="Revisión diaria de los vehículos en resguardo y revisión semanal (viernes) con video"
      />

      {vehiculosEnResguardo.length === 0 ? (
        <Card>
          <EmptyState
            titulo="Sin vehículos en resguardo"
            descripcion="No hay vehículos en modalidad resguardo pendientes de revisión hoy."
          />
        </Card>
      ) : (
        <>
          <ChecklistVehiculosForm vehiculos={vehiculosEnResguardo} />
          <ChecklistSemanal
            vehiculos={vehiculosEnResguardo}
            registros={semanales}
            semana={viernes}
            esDiaLimite={hoyISO() >= viernes}
            responsableDefault={RESPONSABLE_CHECKLIST_DEFAULT}
          />
        </>
      )}

      {historial.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Historial" subtitle={`${historial.length} checklist(s) guardados`} />
          <ul className="divide-y divide-border">
            {historial.slice(0, 15).map((c) => {
              const incidencias = c.filas.filter((f) => f.observaciones || !f.presente || Object.values(f.revision ?? {}).includes("M")).length;
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
