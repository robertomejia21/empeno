import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerCliente, listarEmpenos, listarPagosCliente } from "@/lib/db/repo";
import { formatFechaHora, aISOLocal } from "@/lib/format";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { tasaPorHistorial } from "@/lib/interes";
import { formatFecha, formatFechaLarga, formatMXN } from "@/lib/format";
import { Card, CardHeader, PageHeader, LinkButton, Badge, VolverLink } from "@/components/ui";
import { estadoEmpenoBadge } from "@/components/badges";
import { FileText, Pencil, Plus, Receipt, TriangleAlert } from "lucide-react";

export default async function ClienteDetalle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const fechaValida = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  const desde = fechaValida(sp.desde);
  const hasta = fechaValida(sp.hasta);
  const filtrando = !!(desde || hasta);
  const enPeriodo = (iso: string) => {
    const d = iso.length > 10 ? aISOLocal(new Date(iso)) : iso;
    return (!desde || d >= desde) && (!hasta || d <= hasta);
  };
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  const [empenosAll, pagosAll] = await Promise.all([listarEmpenos(), listarPagosCliente(id)]);
  const empenosCliente = empenosAll.filter((e) => e.clienteId === id);
  const previos = empenosCliente.length;
  // Filtro de periodo: empeños por fecha de alta, pagos por fecha de pago.
  const empenos = empenosCliente.filter((e) => enPeriodo(e.creadoEn));
  const pagos = pagosAll.filter((p) => enPeriodo(p.fecha));
  const totalAbonado = pagos.reduce((s, p) => s + p.total, 0);
  const sumaTipo = (t: string) => pagos.filter((p) => p.tipo === t).reduce((s, p) => s + p.total, 0);
  const cuentaTipo = (t: string) => pagos.filter((p) => p.tipo === t).length;
  const etiquetaTipo: Record<string, string> = { refrendo: "Refrendo", abono: "Abono parcial", desempeno: "Desempeño" };
  const { tasa, nivel, requiereAutorizacion } = tasaPorHistorial(previos);

  return (
    <div>
      <VolverLink href="/clientes" label="Clientes" />
      <PageHeader
        title={`${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`}
        subtitle={`Cliente desde ${formatFechaLarga(cliente.creadoEn)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/estado/${cliente.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shadow-soft inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:bg-surface-2"
            >
              <FileText className="h-4 w-4" aria-hidden />
              Estado de cuenta
            </a>
            <Link
              href={`/clientes/${cliente.id}/editar`}
              className="shadow-soft inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:bg-surface-2"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Editar cliente
            </Link>
            <LinkButton href={`/empenos/nuevo?cliente=${cliente.id}`}>
              <Plus className="h-4 w-4" aria-hidden />
              Nuevo empeño
            </LinkButton>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="min-w-0 md:col-span-2">
          <CardHeader title="Información del cliente" />
          {cliente.foto && (
            <div className="flex items-center gap-4 border-b border-border px-5 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cliente.foto} alt={cliente.nombre} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{cliente.nombre} {cliente.apellidoPaterno}</p>
                <p className="text-xs text-muted">Foto de identificación en sistema</p>
              </div>
            </div>
          )}
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
            <div className="rounded-xl border border-border bg-surface-2 p-3">
              <p className="text-xs text-muted">Tasa sugerida</p>
              <p className="mt-1 text-2xl font-bold text-primary">{tasa}%</p>
              <p className="mt-1 text-xs text-muted">{nivel}</p>
              {requiereAutorizacion && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-warning">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Requiere autorización de Gerencia
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Filtro de periodo para las tablas de empeños, abonos y refrendos */}
      <Card className="mt-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SelectorPeriodo
            etiqueta="Filtrar por periodo"
            incluirTodo
            desde={desde}
            hasta={hasta}
            navegar={{ paramDesde: "desde", paramHasta: "hasta" }}
          />
          <dl className="grid flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-4 sm:max-w-3xl">
            <Resumen etiqueta="Empeños" valor={`${empenos.length} · ${formatMXN(empenos.reduce((s, e) => s + e.montoPrestado, 0))}`} />
            <Resumen etiqueta="Refrendos" valor={`${cuentaTipo("refrendo")} · ${formatMXN(sumaTipo("refrendo"))}`} />
            <Resumen etiqueta="Abonos" valor={`${cuentaTipo("abono")} · ${formatMXN(sumaTipo("abono"))}`} />
            <Resumen etiqueta="Desempeños" valor={`${cuentaTipo("desempeno")} · ${formatMXN(sumaTipo("desempeno"))}`} />
          </dl>
        </div>
        {filtrando && (
          <p className="mt-3 text-xs text-muted">
            Mostrando {desde ? `del ${formatFecha(desde)}` : "desde el inicio"} {hasta ? `al ${formatFecha(hasta)}` : "a hoy"} ·{" "}
            <Link href={`/clientes/${cliente.id}`} className="font-medium text-primary hover:underline">Ver todo</Link>
          </p>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Empeños del cliente" subtitle={filtrando ? `${empenos.length} de ${empenosCliente.length} en el periodo` : undefined} />
        {empenos.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {filtrando ? "Sin empeños en el periodo elegido." : "Este cliente no tiene empeños registrados."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {empenos.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/empenos/${e.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {e.folio} · {e.prenda.descripcion}
                    </p>
                    <p className="text-xs text-muted">
                      {formatMXN(e.montoPrestado)} · {formatFecha(e.fechaInicio)}
                    </p>
                  </div>
                  <span className="shrink-0">{estadoEmpenoBadge(e.estado)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Abonos y refrendos */}
      <Card className="mt-6">
        <CardHeader
          title="Abonos y refrendos"
          subtitle={`${pagos.length} pagos · ${formatMXN(totalAbonado)} pagado${filtrando ? " en el periodo" : ""}`}
        />
        {pagos.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {filtrando ? "Sin abonos ni refrendos en el periodo elegido." : "Sin abonos ni refrendos registrados."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-140 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Recibo</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Contrato</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagos.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-2">
                    <td className="px-5 py-3 font-mono text-xs text-muted">
                      #{p.reciboNo}{p.tipo === "refrendo" || p.tipo === "abono" ? ` · Ref. ${p.refrendoNo}` : ""}
                    </td>
                    <td className="px-5 py-3 text-muted">{formatFechaHora(p.fecha)}</td>
                    <td className="px-5 py-3">
                      {(() => {
                        const e = empenosCliente.find((x) => x.id === p.empenoId);
                        return e ? <Link href={`/empenos/${e.id}`} className="text-primary hover:underline">{e.folio}</Link> : "—";
                      })()}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tono={p.tipo === "refrendo" ? "info" : p.tipo === "desempeno" ? "success" : "warning"}>{etiquetaTipo[p.tipo] ?? p.tipo}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">{formatMXN(p.total)}</td>
                    <td className="px-5 py-3 text-right">
                      <a href={`/api/recibo-pago/${p.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                        <Receipt className="h-3.5 w-3.5" aria-hidden />
                        Recibo
                      </a>
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
      <dd className={`mt-0.5 text-sm wrap-break-word text-foreground ${mono ? "font-mono" : ""}`}>
        {valor || "—"}
      </dd>
    </div>
  );
}

function Resumen({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface-2/60 px-3 py-2">
      <dt className="text-xs text-muted">{etiqueta}</dt>
      <dd className="truncate font-semibold tabular-nums text-foreground">{valor}</dd>
    </div>
  );
}
