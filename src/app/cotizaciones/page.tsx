import { listarCotizaciones, obtenerAjustes } from "@/lib/db/repo";
import { PageHeader } from "@/components/ui";
import { CotizacionesPanel } from "./CotizacionesPanel";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";

export default async function CotizacionesPage() {
  const [cotizaciones, ajustes] = await Promise.all([listarCotizaciones(), obtenerAjustes()]);

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        subtitle="Propuestas de préstamo y análisis de mercado"
        action={
          <SelectorPeriodo
            etiqueta="Periodo a exportar"
            incluirTodo
            descargas={[{ label: "Exportar Excel", href: "/api/export/cotizaciones", tipo: "excel" }]}
          />
        }
      />
      <CotizacionesPanel cotizaciones={cotizaciones} reglaPrestamo={ajustes.prestamo} />
    </div>
  );
}
