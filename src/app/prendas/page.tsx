import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { listarPrendas } from "@/lib/db/repo";
import { formatMXN } from "@/lib/format";
import { Card, PageHeader, LinkButton, EmptyState, Badge, SearchForm, ResumenChips } from "@/components/ui";
import { estadoPrendaBadge } from "@/components/badges";
import { coincideTexto } from "@/lib/buscar";

export default async function PrendasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const todas = await listarPrendas();
  const t = (q ?? "").trim();
  const prendas = t
    ? todas.filter((p) => coincideTexto([p.folio, p.descripcion, p.marca, p.submarca, p.modelo, p.serie, p.categoria, p.placas], t))
    : todas;

  return (
    <div>
      <PageHeader
        title="Comprar"
        subtitle={t ? `${prendas.length} resultado(s) para "${q}"` : `${prendas.length} artículo(s) en inventario`}
        action={
          <LinkButton href="/prendas/nueva">
            <Plus className="h-4 w-4" aria-hidden /> Registrar artículo
          </LinkButton>
        }
      />
      <ResumenChips
        items={[
          { label: "En inventario", valor: todas.length },
          { label: "Empeñadas", valor: todas.filter((p) => p.estado === "empenada").length, tono: "info" },
          { label: "En venta", valor: todas.filter((p) => p.estado === "en_venta").length, tono: "primary" },
          { label: "Apartadas", valor: todas.filter((p) => p.estado === "apartada").length, tono: "warning" },
        ]}
      />
      <div className="mb-5">
        <SearchForm q={q} placeholder="Buscar por folio, descripción, marca…" />
      </div>

      <Card>
        {prendas.length === 0 ? (
          <EmptyState
            titulo="Sin artículos"
            descripcion="Registra un artículo para su avalúo o compra."
            action={<LinkButton href="/prendas/nueva">Registrar artículo</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
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
                  <tr key={p.id} className="transition hover:bg-surface-2/60">
                    <td className="px-5 py-3 font-mono text-xs text-muted">
                      <Link href={`/prendas/${p.id}`} className="hover:text-primary">{p.folio}</Link>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/prendas/${p.id}`} className="flex items-center gap-3 hover:opacity-90">
                        {p.fotos[0] ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.fotos[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                            <Package className="h-5 w-5" aria-hidden />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground">{p.descripcion}</span>
                          <span className="block text-xs text-muted">
                            {[p.marca, p.submarca, p.modelo].filter(Boolean).join(" ") ||
                              [p.metal, p.kilataje].filter(Boolean).join(" ") ||
                              "—"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tono="muted">{p.categoria}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-foreground">{formatMXN(p.valorAvaluo)}</td>
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted">
                      {formatMXN(p.montoPrestamoSugerido)}
                    </td>
                    <td className="max-w-[14rem] px-5 py-3 text-xs text-muted">
                      <span className="block truncate" title={p.ubicacionResguardo ?? undefined}>
                        {p.ubicacionResguardo ?? "—"}
                      </span>
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
