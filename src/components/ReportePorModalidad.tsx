import { Card, CardHeader } from "@/components/ui";
import { formatMXN, formatFecha } from "@/lib/format";
import { filasInforme, type ReporteSemanal } from "@/lib/reporteSemanal";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";

/**
 * Informe de operación por modalidad. Con `selector`, muestra el selector de
 * periodo (que actualiza la URL con `paramDesde`/`paramHasta`) y las descargas
 * en Excel y PDF del periodo elegido.
 */
export function ReporteSemanalCard({
  reporte,
  titulo,
  descarga,
  selector,
}: {
  reporte: ReporteSemanal;
  titulo: string;
  /** URL base de la descarga (sin desde/hasta), p. ej. /api/export/informe */
  descarga: string;
  selector?: { paramDesde: string; paramHasta: string };
}) {
  const filas = filasInforme(reporte);
  const sep = descarga.includes("?") ? "&" : "?";
  const rango = `desde=${reporte.desde}&hasta=${reporte.hasta}`;
  return (
    <Card className="mt-6">
      <CardHeader
        title={titulo}
        subtitle={`Del ${formatFecha(reporte.desde)} al ${formatFecha(reporte.hasta)}`}
        action={
          selector ? undefined : (
            <div className="flex flex-wrap gap-3">
              <a href={`${descarga}${sep}${rango}`} className="text-sm font-medium text-primary hover:underline">Excel</a>
              <a href={`${descarga}${sep}${rango}&formato=pdf`} className="text-sm font-medium text-primary hover:underline">PDF</a>
            </div>
          )
        }
      />
      {selector && (
        <div className="px-4 pb-3 sm:px-5">
          <SelectorPeriodo
            desde={reporte.desde}
            hasta={reporte.hasta}
            navegar={selector}
            descargas={[
              { label: "Excel", href: descarga, tipo: "excel" },
              { label: "PDF", href: `${descarga}${sep}formato=pdf`, tipo: "pdf" },
            ]}
          />
        </div>
      )}
      <div className="overflow-x-auto px-4 pb-5 sm:px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 font-medium">Descripción</th>
              <th className="py-2 text-right font-medium">Total</th>
              <th className="hidden py-2 pl-4 font-medium sm:table-cell">Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) =>
              f.seccion ? (
                <tr key={i} className="bg-primary-soft">
                  <td colSpan={3} className="rounded-lg py-1.5 text-center text-xs font-bold uppercase tracking-wide text-primary">
                    {f.desc}
                  </td>
                </tr>
              ) : f.detalle ? (
                <tr key={i} className="border-b border-border/40">
                  <td className="py-1.5 pl-4 text-xs text-muted">– {f.desc}</td>
                  <td className="py-1.5 text-right text-xs tabular-nums text-muted">{formatMXN(f.total ?? 0)}</td>
                  <td className="hidden py-1.5 pl-4 text-xs text-muted sm:table-cell">{f.comentario}</td>
                </tr>
              ) : (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-2 text-foreground">{f.desc}</td>
                  <td className="py-2 text-right font-medium tabular-nums text-foreground">{formatMXN(f.total ?? 0)}</td>
                  <td className="hidden py-2 pl-4 text-muted sm:table-cell">{f.comentario}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
