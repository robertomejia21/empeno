import Link from "next/link";
import { listarClientes } from "@/lib/db/repo";
import { formatFecha } from "@/lib/format";
import { Card, PageHeader, LinkButton, EmptyState } from "@/components/ui";

export default async function ClientesPage() {
  const clientes = await listarClientes();

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clientes.length} registrados`}
        action={<LinkButton href="/clientes/nuevo">+ Nuevo cliente</LinkButton>}
      />

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
