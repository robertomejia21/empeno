import Link from "next/link";
import { listarClientes, listarEmpenos } from "@/lib/db/repo";
import { formatFecha } from "@/lib/format";
import { Card, PageHeader, LinkButton, EmptyState, SearchForm, ResumenChips } from "@/components/ui";
import { coincideTexto, coincideTelefono } from "@/lib/buscar";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [todos, empenos] = await Promise.all([listarClientes(), listarEmpenos()]);
  const conActivo = new Set(
    empenos.filter((e) => e.estado === "activo" || e.estado === "refrendado").map((e) => e.clienteId)
  ).size;
  const nuevosMes = todos.filter((c) => c.creadoEn.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;
  const t = (q ?? "").trim();
  const clientes = t
    ? todos.filter(
        (c) =>
          coincideTexto([c.nombre, c.apellidoPaterno, c.apellidoMaterno, c.curp, c.numeroIdentificacion], t) ||
          coincideTelefono(c.telefono, t)
      )
    : todos;

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={t ? `${clientes.length} resultado(s) para "${q}"` : `${clientes.length} registrados`}
        action={<LinkButton href="/clientes/nuevo">+ Nuevo cliente</LinkButton>}
      />
      <ResumenChips
        items={[
          { label: "Total clientes", valor: todos.length },
          { label: "Con empeño activo", valor: conActivo, tono: "success" },
          { label: "Nuevos este mes", valor: nuevosMes, tono: "info" },
          { label: "Empeños totales", valor: empenos.length, tono: "primary" },
        ]}
      />
      <div className="mb-5">
        <SearchForm q={q} placeholder="Buscar por nombre, CURP, teléfono…" />
      </div>

      <Card>
        {clientes.length === 0 ? (
          <EmptyState
            titulo="Sin clientes"
            descripcion="Registra tu primer cliente para empezar a operar."
            action={<LinkButton href="/clientes/nuevo">Registrar cliente</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Identificación</th>
                  <th className="px-5 py-3 font-medium">Teléfono</th>
                  <th className="px-5 py-3 font-medium">CURP</th>
                  <th className="px-5 py-3 font-medium">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-2">
                    <td className="px-5 py-3">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {c.nombre} {c.apellidoPaterno} {c.apellidoMaterno}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {c.tipoIdentificacion} · {c.numeroIdentificacion}
                    </td>
                    <td className="px-5 py-3 text-muted">{c.telefono ?? "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">
                      {c.curp ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">{formatFecha(c.creadoEn)}</td>
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
