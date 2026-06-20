import { redirect } from "next/navigation";
import { listarUsuarios } from "@/lib/db/repo";
import { getUsuarioActual } from "@/lib/session";
import { crearUsuario, cambiarEstadoUsuario } from "@/lib/auth-actions";
import { ROLES, ROL_LABEL, authHabilitada } from "@/lib/auth";
import { Card, CardHeader, PageHeader, Button, Field, SelectField, Badge } from "@/components/ui";
import { ConfirmSubmit } from "@/components/actions-ui";
import type { RolUsuario } from "@/lib/types";

export default async function UsuariosPage() {
  const actual = await getUsuarioActual();
  if (!actual || actual.rol !== "admin") redirect("/");

  const usuarios = await listarUsuarios();

  return (
    <div>
      <PageHeader title="Usuarios" subtitle="Gestión de accesos y roles del personal" />

      {!authHabilitada() && (
        <div className="mb-6 rounded-xl border border-warning/20 bg-warning-soft px-5 py-3 text-sm text-warning">
          ⚠️ La autenticación está en <strong>modo demo</strong> (sin <code>AUTH_SECRET</code>). Los usuarios que
          crees aquí solo tendrán efecto cuando se active la autenticación en el servidor.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Nuevo usuario" />
          <form action={crearUsuario} className="space-y-4 p-5">
            <Field label="Nombre" name="nombre" required />
            <Field label="Correo" name="email" type="email" required />
            <SelectField label="Rol" name="rol" options={ROLES} defaultValue="cajero" required />
            <Field label="Contraseña" name="password" type="password" required />
            <Button type="submit" className="w-full">Crear usuario</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Personal" subtitle={`${usuarios.length} usuarios`} />
          {usuarios.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Aún no hay usuarios registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Nombre</th>
                    <th className="px-5 py-3 font-medium">Correo</th>
                    <th className="px-5 py-3 font-medium">Rol</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-2">
                      <td className="px-5 py-3 font-medium text-foreground">{u.nombre}</td>
                      <td className="px-5 py-3 text-muted">{u.email}</td>
                      <td className="px-5 py-3">
                        <Badge tono="info">{ROL_LABEL[u.rol as RolUsuario]}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        {u.activo ? <Badge tono="success">Activo</Badge> : <Badge tono="muted">Inactivo</Badge>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {u.id !== actual.uid && (
                          <form action={cambiarEstadoUsuario.bind(null, u.id, !u.activo)}>
                            <ConfirmSubmit
                              variante="secondary"
                              confirmacion={`¿${u.activo ? "Desactivar" : "Activar"} a ${u.nombre}?`}
                            >
                              {u.activo ? "Desactivar" : "Activar"}
                            </ConfirmSubmit>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
