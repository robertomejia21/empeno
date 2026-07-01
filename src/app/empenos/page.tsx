import Link from "next/link";
import { listarEmpenos } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, PageHeader, LinkButton, EmptyState, SearchForm, ResumenChips } from "@/components/ui";
import { estadoEmpenoBadge } from "@/components/badges";

export default async function EmpenosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const todos = await listarEmpenos();
  const t = (q ?? "").toLowerCase().trim();
  const tDigits = t.replace(/\D/g, "");
  const empenos = t
    ? todos.filter((e) => {
        const texto = [e.folio, e.prenda.descripcion, e.estado, `${e.cliente.nombre} ${e.cliente.apellidoPaterno} ${e.cliente.apellidoMaterno}`]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(t));
        // Coincidencia por número de contrato (ignora prefijo/ceros): "835" ↔ EM-0835
        const porContrato =
          tDigits.length > 0 && String(parseInt(e.folio.replace(/\D/g, "") || "0", 10)) === String(parseInt(tDigits, 10));
        return texto || porContrato;
      })
    : todos;

  const activos = todos.filter((e) => e.estado === "activo" || e.estado === "refrendado");
  const conCalc = activos.map((e) => calcularLiquidacion(e));
  const nVencidos = conCalc.filter((c) => c.vencido).length;
  const capital = activos.reduce((s, e) => s + e.montoPrestado, 0);
  const aRecuperar = conCalc.reduce((s, c) => s + c.totalDesempeno, 0);

  return (
    <div>
      <PageHeader
        title="Empeños"
        subtitle={t ? `${empenos.length} resultado(s) para "${q}"` : `${empenos.length} contratos`}
        action={
          <div className="flex gap-2">
            <LinkButton href="/empenos/nuevo" variante="secondary">
              Captura rápida
            </LinkButton>
            <LinkButton href="/empenos/asistente">+ Nuevo empeño</LinkButton>
          </div>
        }
      />

      <ResumenChips
        items={[
          { label: "Activos", valor: activos.length, tono: "success" },
          { label: "Vencidos", valor: nVencidos, tono: nVencidos > 0 ? "danger" : "muted" },
          { label: "Capital prestado", valor: formatMXN(capital) },
          { label: "A recuperar", valor: formatMXN(aRecuperar), tono: "primary" },
        ]}
      />

      <div className="mb-5">
        <SearchForm q={q} placeholder="Buscar por contrato/folio, cliente, prenda…" />
      </div>

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
