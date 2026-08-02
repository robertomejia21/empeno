import { listarCitasGps } from "@/lib/db/repo";
import { PageHeader, VolverLink } from "@/components/ui";
import { AgendaGps } from "./AgendaGps";

export default async function CitasGpsPage() {
  const citas = await listarCitasGps();
  return (
    <div className="mx-auto max-w-3xl">
      <VolverLink href="/gps" label="GPS y resguardo" />
      <PageHeader
        title="Citas de GPS"
        subtitle="Agenda la instalación del GPS según la disponibilidad"
        action={
          <a href="/agendar-gps" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2">
            🔗 Página para clientes
          </a>
        }
      />
      <AgendaGps citas={citas} />
    </div>
  );
}
