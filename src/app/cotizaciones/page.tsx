import { listarCotizaciones } from "@/lib/db/repo";
import { Download } from "lucide-react";
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
          // Descarga de un archivo desde una ruta API: no es navegación, <Link> no aplica.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a
            href="/api/export/cotizaciones"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-soft transition hover:bg-surface-2"
          >
            <Download className="h-4 w-4" aria-hidden /> Descargar Excel
          </a>
        }
      />
      <CotizacionesPanel cotizaciones={cotizaciones} />
    </div>
  );
}
