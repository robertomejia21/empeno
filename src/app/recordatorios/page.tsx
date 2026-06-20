import Link from "next/link";
import { listarEmpenos } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge, EmptyState } from "@/components/ui";

export default async function RecordatoriosPage() {
  const empenos = await listarEmpenos();
  const activos = empenos
    .filter((e) => e.estado === "activo" || e.estado === "refrendado")
    .map((e) => ({ e, calc: calcularLiquidacion(e) }));

  const vencidos = activos.filter((x) => x.calc.vencido).sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);
  const porVencer = activos
    .filter((x) => !x.calc.vencido && x.calc.diasParaVencer <= 7)
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);
  const proximos = activos
    .filter((x) => !x.calc.vencido && x.calc.diasParaVencer > 7 && x.calc.diasParaVencer <= 30)
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);

  return (
    <div>
      <PageHeader
        title="Recordatorios"
        subtitle="Seguimiento de vencimientos para contactar al cliente"
      />

      <div className="space-y-6">
        <Grupo titulo="Vencidos" tono="danger" items={vencidos} vencido />
        <Grupo titulo="Por vencer (≤ 7 días)" tono="warning" items={porVencer} />
        <Grupo titulo="Próximos (8–30 días)" tono="info" items={proximos} />
      </div>
    </div>
  );
}

function Grupo({
  titulo,
  tono,
  items,
  vencido,
}: {
  titulo: string;
  tono: "danger" | "warning" | "info";
  items: { e: Awaited<ReturnType<typeof import("@/lib/db/repo").listarEmpenos>>[number]; calc: ReturnType<typeof calcularLiquidacion> }[];
  vencido?: boolean;
}) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            {titulo} <Badge tono={tono}>{items.length}</Badge>
          </span>
        }
      />
      {items.length === 0 ? (
        <EmptyState titulo="Nada por aquí" descripcion="No hay empeños en este rango." />
      ) : (
        <ul className="divide-y divide-border">
          {items.map(({ e, calc }) => {
            const tel = e.cliente.telefono?.replace(/\D/g, "");
            return (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <Link href={`/empenos/${e.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                    {e.folio} · {e.cliente.nombre} {e.cliente.apellidoPaterno}
                  </Link>
                  <p className="text-xs text-muted">
                    {e.prenda.descripcion} · {vencido ? "venció" : "vence"} {formatFecha(e.fechaVencimiento)} ·{" "}
                    {Math.abs(calc.diasParaVencer)} días {vencido ? "atrás" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{formatMXN(calc.totalDesempeno)}</span>
                  {e.cliente.telefono ? (
                    <div className="flex gap-1.5">
                      <a
                        href={`tel:${tel}`}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-2"
                      >
                        📞 Llamar
                      </a>
                      <a
                        href={`https://wa.me/52${tel}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                      >
                        WhatsApp
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">sin teléfono</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
