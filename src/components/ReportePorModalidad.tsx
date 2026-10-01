import { Card, CardHeader } from "@/components/ui";
import { formatMXN, formatFecha } from "@/lib/format";
import type { ReporteSemanal } from "@/lib/reporteSemanal";

export function ReporteSemanalCard({
  reporte,
  titulo,
  descarga,
}: {
  reporte: ReporteSemanal;
  titulo: string;
  descarga: string;
}) {
  const filas: { desc: string; total?: number; seccion?: boolean }[] = [
    { desc: "Ventas de vitrina", total: reporte.ventasVitrina },
    { desc: "Vehículos", seccion: true },
    { desc: "Empeños", total: reporte.vehiculos.empenos },
    { desc: "Refrendos", total: reporte.vehiculos.refrendos },
    { desc: "Desempeños", total: reporte.vehiculos.desempenos },
    { desc: "Artículos", seccion: true },
    { desc: "Empeños", total: reporte.articulos.empenos },
    { desc: "Refrendos", total: reporte.articulos.refrendos },
    { desc: "Desempeños", total: reporte.articulos.desempenos },
  ];
  return (
    <Card className="mt-6">
      <CardHeader
        title={titulo}
        subtitle={`Del ${formatFecha(reporte.desde)} al ${formatFecha(reporte.hasta)}`}
        action={
          <a href={descarga} className="text-sm font-medium text-primary">
            ⬇️ Descargar Excel
          </a>
        }
      />
      <div className="overflow-x-auto px-5 pb-5">
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
                <tr key={i} className="bg-warning-soft">
                  <td colSpan={3} className="py-1.5 text-center text-xs font-bold uppercase tracking-wide text-warning">
                    {f.desc}
                  </td>
                </tr>
              ) : (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-2 text-foreground">{f.desc}</td>
                  <td className="py-2 text-right font-medium tabular-nums text-foreground">{formatMXN(f.total ?? 0)}</td>
                  <td className="hidden py-2 pl-4 text-muted sm:table-cell" />
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
