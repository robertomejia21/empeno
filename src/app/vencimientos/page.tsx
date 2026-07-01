import Link from "next/link";
import { listarEmpenos } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge, ResumenChips, EmptyState } from "@/components/ui";

export default async function VencimientosPage() {
  const empenos = await listarEmpenos();
  const activos = empenos
    .filter((e) => e.estado === "activo" || e.estado === "refrendado")
    .map((e) => ({ e, calc: calcularLiquidacion(e) }))
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);

  const vencidos = activos.filter((x) => x.calc.vencido);
  const semana = activos.filter((x) => !x.calc.vencido && x.calc.diasParaVencer <= 7);
  const mes = activos.filter((x) => !x.calc.vencido && x.calc.diasParaVencer > 7 && x.calc.diasParaVencer <= 30);
  const despues = activos.filter((x) => !x.calc.vencido && x.calc.diasParaVencer > 30);

  const refrendoSemana = [...vencidos, ...semana].reduce((s, x) => s + x.calc.totalRefrendo, 0);

  return (
    <div>
      <PageHeader title="Vencimientos" subtitle="Próximos refrendos a vencer, ordenados por fecha" />

      <ResumenChips
        items={[
          { label: "Vencidos", valor: vencidos.length, tono: vencidos.length ? "danger" : "muted" },
          { label: "Vencen esta semana", valor: semana.length, tono: "warning" },
          { label: "Vencen en el mes", valor: mes.length, tono: "info" },
          { label: "Refrendo por cobrar (7 días)", valor: formatMXN(refrendoSemana), tono: "primary" },
        ]}
      />

      <div className="space-y-6">
        <Grupo titulo="Vencidos" tono="danger" items={vencidos} vencido />
        <Grupo titulo="Vencen esta semana (≤ 7 días)" tono="warning" items={semana} />
        <Grupo titulo="Vencen este mes (8–30 días)" tono="info" items={mes} />
        <Grupo titulo="Más adelante (+30 días)" tono="muted" items={despues} />
      </div>
    </div>
  );
}

function Grupo({
  titulo, tono, items, vencido,
}: {
  titulo: string;
  tono: "danger" | "warning" | "info" | "muted";
  items: { e: Awaited<ReturnType<typeof import("@/lib/db/repo").listarEmpenos>>[number]; calc: ReturnType<typeof calcularLiquidacion> }[];
  vencido?: boolean;
}) {
  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2">{titulo} <Badge tono={tono}>{items.length}</Badge></span>} />
      {items.length === 0 ? (
        <EmptyState titulo="Nada por aquí" descripcion="No hay empeños en este rango." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Contrato</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Prenda</th>
                <th className="px-5 py-3 font-medium">Vence</th>
                <th className="px-5 py-3 font-medium">Días</th>
                <th className="px-5 py-3 text-right font-medium">Refrendo</th>
                <th className="px-5 py-3 text-right font-medium">A liquidar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(({ e, calc }) => (
                <tr key={e.id} className="hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <Link href={`/empenos/${e.id}`} className="font-mono text-xs font-medium text-foreground hover:text-primary">{e.folio}</Link>
                  </td>
                  <td className="px-5 py-3 text-foreground">{e.cliente.nombre} {e.cliente.apellidoPaterno}</td>
                  <td className="px-5 py-3 text-muted">{e.prenda.descripcion}</td>
                  <td className="px-5 py-3 text-muted">{formatFecha(e.fechaVencimiento)}</td>
                  <td className="px-5 py-3">
                    <span className={vencido ? "font-semibold text-danger" : "text-foreground"}>
                      {vencido ? `${Math.abs(calc.diasParaVencer)} atraso` : calc.diasParaVencer}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-muted">{formatMXN(calc.totalRefrendo)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-foreground">{formatMXN(calc.totalDesempeno)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
