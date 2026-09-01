import Link from "next/link";
import { listarClientes, listarPrendas, listarEmpenos } from "@/lib/db/repo";
import { formatMXN } from "@/lib/format";
import { Card, CardHeader, PageHeader, SearchForm, EmptyState } from "@/components/ui";
import { estadoEmpenoBadge, estadoPrendaBadge } from "@/components/badges";
import { coincideTexto, coincideTelefono } from "@/lib/buscar";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = (q ?? "").trim();

  let clientes: Awaited<ReturnType<typeof listarClientes>> = [];
  let prendas: Awaited<ReturnType<typeof listarPrendas>> = [];
  let empenos: Awaited<ReturnType<typeof listarEmpenos>> = [];

  if (t) {
    const [cs, ps, es] = await Promise.all([listarClientes(), listarPrendas(), listarEmpenos()]);
    clientes = cs.filter(
      (c) =>
        coincideTexto([c.nombre, c.apellidoPaterno, c.apellidoMaterno, c.curp, c.numeroIdentificacion], t) ||
        coincideTelefono(c.telefono, t)
    );
    prendas = ps.filter((p) => coincideTexto([p.folio, p.descripcion, p.marca, p.modelo, p.serie, p.categoria], t));
    empenos = es.filter((e) =>
      coincideTexto([e.folio, e.prenda.descripcion, e.cliente.nombre, e.cliente.apellidoPaterno, e.cliente.apellidoMaterno], t)
    );
  }

  const total = clientes.length + prendas.length + empenos.length;

  return (
    <div>
      <PageHeader
        title="Búsqueda global"
        subtitle={t ? `${total} resultado(s) para "${q}"` : "Busca clientes, prendas y empeños a la vez"}
      />
      <div className="mb-6">
        <SearchForm q={q} placeholder="Nombre, folio, CURP, prenda…" />
      </div>

      {!t ? (
        <Card>
          <EmptyState titulo="Escribe para buscar" descripcion="Encuentra clientes, prendas y empeños en un solo lugar." />
        </Card>
      ) : total === 0 ? (
        <Card>
          <EmptyState titulo="Sin resultados" descripcion={`No encontramos nada para "${q}".`} />
        </Card>
      ) : (
        <div className="space-y-6">
          {empenos.length > 0 && (
            <Card>
              <CardHeader title={`Empeños (${empenos.length})`} />
              <ul className="divide-y divide-border">
                {empenos.slice(0, 20).map((e) => (
                  <li key={e.id}>
                    <Link href={`/empenos/${e.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2">
                      <span className="text-sm text-foreground">
                        <span className="font-mono text-xs text-muted">{e.folio}</span> · {e.cliente.nombre} {e.cliente.apellidoPaterno} · {e.prenda.descripcion}
                      </span>
                      {estadoEmpenoBadge(e.estado)}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {clientes.length > 0 && (
            <Card>
              <CardHeader title={`Clientes (${clientes.length})`} />
              <ul className="divide-y divide-border">
                {clientes.slice(0, 20).map((c) => (
                  <li key={c.id}>
                    <Link href={`/clientes/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2">
                      <span className="text-sm font-medium text-foreground">{c.nombre} {c.apellidoPaterno} {c.apellidoMaterno}</span>
                      <span className="text-xs text-muted">{c.telefono ?? c.curp ?? ""}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {prendas.length > 0 && (
            <Card>
              <CardHeader title={`Prendas (${prendas.length})`} />
              <ul className="divide-y divide-border">
                {prendas.slice(0, 20).map((p) => (
                  <li key={p.id}>
                    <Link href={`/prendas/${p.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2">
                      <span className="text-sm text-foreground">
                        <span className="font-mono text-xs text-muted">{p.folio}</span> · {p.descripcion}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted">{formatMXN(p.valorAvaluo)}</span>
                        {estadoPrendaBadge(p.estado)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
