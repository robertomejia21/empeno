import Link from "next/link";
import { listarEmpenos } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, PageHeader, LinkButton, EmptyState } from "@/components/ui";
import { estadoEmpenoBadge } from "@/components/badges";

export default async function EmpenosPage() {
  const empenos = await listarEmpenos();

  return (
    <div>
      <PageHeader
        title="Empeños"
        subtitle={`${empenos.length} contratos`}
        action={<LinkButton href="/empenos/nuevo">+ Nuevo empeño</LinkButton>}
      />

      <Card>
        {empenos.length === 0 ? (
          <EmptyState
            titulo="Sin empeños"
            descripcion="Crea el primer contrato de empeño."
            action={<LinkButton href="/empenos/nuevo">Nuevo empeño</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Folio</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Prenda</th>
                  <th className="px-5 py-3 font-medium">Préstamo</th>
                  <th className="px-5 py-3 font-medium">A liquidar</th>
                  <th className="px-5 py-3 font-medium">Vence</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {empenos.map((e) => {
                  const activo = e.estado === "activo" || e.estado === "refrendado";
                  const calc = calcularLiquidacion(e);
                  const estado = activo && calc.vencido ? "vencido" : e.estado;
                  return (
                    <tr key={e.id} className="hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <Link
                          href={`/empenos/${e.id}`}
                          className="font-mono text-xs font-medium text-foreground hover:text-primary"
                        >
                          {e.folio}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-foreground">
                        {e.cliente.nombre} {e.cliente.apellidoPaterno}
                      </td>
                      <td className="px-5 py-3 text-muted">{e.prenda.descripcion}</td>
                      <td className="px-5 py-3 text-foreground">{formatMXN(e.montoPrestado)}</td>
                      <td className="px-5 py-3 text-foreground">
                        {activo ? formatMXN(calc.totalDesempeno) : "—"}
                      </td>
                      <td className="px-5 py-3 text-muted">{formatFecha(e.fechaVencimiento)}</td>
                      <td className="px-5 py-3">{estadoEmpenoBadge(estado)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
