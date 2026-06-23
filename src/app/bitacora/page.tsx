import { redirect } from "next/navigation";
import { listarBitacora } from "@/lib/db/repo";
import { getUsuarioActual } from "@/lib/session";
import { ROL_LABEL } from "@/lib/auth";
import { formatFechaHora } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge, EmptyState } from "@/components/ui";
import type { RolUsuario } from "@/lib/types";

export default async function BitacoraPage() {
  const actual = await getUsuarioActual();
  if (!actual || !["admin", "gerente", "invitado"].includes(actual.rol)) redirect("/");

  const eventos = await listarBitacora(200);

  return (
    <div>
      <PageHeader title="Bitácora" subtitle="Registro de auditoría de operaciones" />

      <Card>
        <CardHeader title="Eventos recientes" subtitle={`Últimos ${eventos.length} registros`} />
        {eventos.length === 0 ? (
          <EmptyState titulo="Sin eventos" descripcion="Aquí aparecerán las acciones registradas en el sistema." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Acción</th>
                  <th className="px-5 py-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {eventos.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-2">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{formatFechaHora(e.fecha)}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-foreground">{e.usuarioNombre}</span>
                      {e.usuarioRol && (
                        <span className="ml-2 text-xs text-muted">{ROL_LABEL[e.usuarioRol as RolUsuario] ?? e.usuarioRol}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tono="info">{e.accion}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {e.detalle}
                      {e.referencia ? ` · ${e.referencia}` : ""}
                    </td>
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
