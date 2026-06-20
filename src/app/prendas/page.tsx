import Link from "next/link";
import { listarPrendas } from "@/lib/db/repo";
import { formatMXN } from "@/lib/format";
import { Card, PageHeader, LinkButton, EmptyState, Badge } from "@/components/ui";
import { estadoPrendaBadge } from "@/components/badges";

export default async function PrendasPage() {
  const prendas = await listarPrendas();

  return (
    <div>
      <PageHeader
        title="Prendas"
        subtitle={`${prendas.length} en inventario`}
        action={<LinkButton href="/prendas/nueva">+ Registrar prenda</LinkButton>}
      />

      <Card>
        {prendas.length === 0 ? (
          <EmptyState
            titulo="Sin prendas"
            descripcion="Registra una prenda para realizar su avalúo."
            action={<LinkButton href="/prendas/nueva">Registrar prenda</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Folio</th>
                  <th className="px-5 py-3 font-medium">Descripción</th>
                  <th className="px-5 py-3 font-medium">Departamento</th>
                  <th className="px-5 py-3 font-medium">Avalúo</th>
                  <th className="px-5 py-3 font-medium">Préstamo sug.</th>
                  <th className="px-5 py-3 font-medium">Resguardo</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {prendas.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-2">
                    <td className="px-5 py-3 font-mono text-xs text-muted">
                      <Link href={`/prendas/${p.id}`} className="hover:text-primary">{p.folio}</Link>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/prendas/${p.id}`} className="font-medium text-foreground hover:text-primary">
                        {p.descripcion}
                      </Link>
                      <p className="text-xs text-muted">
                        {[p.marca, p.submarca, p.modelo].filter(Boolean).join(" ") ||
                          [p.metal, p.kilataje].filter(Boolean).join(" ") ||
                          "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tono="muted">{p.categoria}</Badge>
                    </td>
                    <td className="px-5 py-3 text-foreground">{formatMXN(p.valorAvaluo)}</td>
                    <td className="px-5 py-3 text-muted">
                      {formatMXN(p.montoPrestamoSugerido)}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">
                      {p.ubicacionResguardo ?? "—"}
                    </td>
                    <td className="px-5 py-3">{estadoPrendaBadge(p.estado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
