import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerCliente, listarEmpenos } from "@/lib/db/repo";
import { tasaPorHistorial } from "@/lib/interes";
import { formatFecha, formatFechaLarga, formatMXN } from "@/lib/format";
import { Card, CardHeader, PageHeader, LinkButton, Badge } from "@/components/ui";
import { estadoEmpenoBadge } from "@/components/badges";

export default async function ClienteDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  const empenos = (await listarEmpenos()).filter((e) => e.clienteId === id);
  const previos = empenos.length;
  const { tasa, nivel, requiereAutorizacion } = tasaPorHistorial(previos);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`}
        subtitle={`Cliente desde ${formatFechaLarga(cliente.creadoEn)}`}
        action={
          <LinkButton href={`/empenos/nuevo?cliente=${cliente.id}`}>
            + Nuevo empeño
          </LinkButton>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title="Información del cliente" />
          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            <Dato etiqueta="CURP" valor={cliente.curp} mono />
            <Dato etiqueta="RFC" valor={cliente.rfc} mono />
            <Dato
              etiqueta="Identificación"
              valor={`${cliente.tipoIdentificacion} · ${cliente.numeroIdentificacion}`}
            />
            <Dato etiqueta="Fecha de nacimiento" valor={cliente.fechaNacimiento ? formatFecha(cliente.fechaNacimiento) : null} />
            <Dato etiqueta="Teléfono" valor={cliente.telefono} />
            <Dato etiqueta="Correo" valor={cliente.email} />
            <div className="sm:col-span-2">
              <Dato etiqueta="Dirección" valor={cliente.direccion} />
            </div>
            {cliente.notas && (
              <div className="sm:col-span-2">
                <Dato etiqueta="Notas" valor={cliente.notas} />
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Historial" />
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Empeños totales</span>
              <Badge tono="info">{previos}</Badge>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <p className="text-xs text-muted">Tasa sugerida</p>
              <p className="mt-1 text-2xl font-bold text-primary">{tasa}%</p>
              <p className="mt-1 text-xs text-muted">{nivel}</p>
              {requiereAutorizacion && (
                <p className="mt-2 text-xs font-medium text-warning">
                  ⚠️ Requiere autorización de Gerencia
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Empeños del cliente" />
        {empenos.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Este cliente no tiene empeños registrados.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {empenos.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/empenos/${e.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-surface-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {e.folio} · {e.prenda.descripcion}
                    </p>
                    <p className="text-xs text-muted">
                      {formatMXN(e.montoPrestado)} · {formatFecha(e.fechaInicio)}
                    </p>
                  </div>
                  {estadoEmpenoBadge(e.estado)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Dato({
  etiqueta,
  valor,
  mono,
}: {
  etiqueta: string;
  valor: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{etiqueta}</dt>
      <dd className={`mt-0.5 text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {valor || "—"}
      </dd>
    </div>
  );
}
