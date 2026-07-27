import { listarCotizaciones } from "@/lib/db/repo";
import { PageHeader } from "@/components/ui";
import { CotizacionesPanel } from "./CotizacionesPanel";

export default async function CotizacionesPage() {
  const cotizaciones = await listarCotizaciones();

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        subtitle="Propuestas de préstamo y análisis de mercado"
        action={
          <a
            href="/api/export/cotizaciones"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            ⬇️ Descargar Excel
          </a>
        }
      />
      <CotizacionesPanel cotizaciones={cotizaciones} />
    </div>
  );
}
