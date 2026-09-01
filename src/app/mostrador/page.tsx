import Link from "next/link";
import { listarEmpenos } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { refrendarEmpeno, desempenarEmpeno } from "@/lib/actions";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, SearchForm, EmptyState, Badge } from "@/components/ui";
import { estadoEmpenoBadge } from "@/components/badges";
import { ConfirmSubmit } from "@/components/actions-ui";
import { coincideTexto, coincideTelefono } from "@/lib/buscar";
import type { EmpenoConDetalle, CalculoLiquidacion } from "@/lib/types";

export const metadata = { title: "Mostrador" };

const campoCls =
  "rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground focus:border-primary-2 focus:outline-none focus:ring-2 focus:ring-primary-2/20";

export default async function MostradorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; id?: string }>;
}) {
  const { q, id } = await searchParams;
  const t = (q ?? "").trim();
  const empenos = await listarEmpenos();

  // Coincidencias por nombre/apellido (sin acentos, cualquier orden), prenda,
  // teléfono (por dígitos, sin importar formato) o número de contrato.
  const tDigits = t.replace(/\D/g, "");
  const contratoNum = tDigits ? String(parseInt(tDigits, 10)) : "";
  const folioNum = (e: EmpenoConDetalle) => String(parseInt(e.folio.replace(/\D/g, "") || "0", 10));

  // Coincidencia exacta por número de contrato (tiene prioridad en el mostrador).
  const exactos = contratoNum ? empenos.filter((e) => folioNum(e) === contratoNum) : [];

  const matches = t
    ? empenos.filter((e) => {
        return (
          coincideTexto([e.cliente.nombre, e.cliente.apellidoPaterno, e.cliente.apellidoMaterno, e.prenda.descripcion, e.folio], t) ||
          coincideTelefono(e.cliente.telefono, t) ||
          folioNum(e) === contratoNum
        );
      })
    : [];

  // Selección: por id explícito → por contrato exacto único → por única coincidencia.
  const seleccion =
    (id ? empenos.find((e) => e.id === id) : undefined) ??
    (exactos.length === 1 ? exactos[0] : undefined) ??
    (matches.length === 1 ? matches[0] : undefined);

  return (
    <div>
      <PageHeader
        title="Mostrador"
        subtitle="Busca por apellido, nombre o número de contrato"
      />

      <div className="mb-6">
        <SearchForm q={q} placeholder="Apellido, nombre o número de contrato…" />
      </div>

      {!t ? (
        <Card>
          <EmptyState
            titulo="Escribe para atender al cliente"
            descripcion="Teclea el apellido o el número de contrato y aparecerá el expediente con los montos a cobrar."
          />
        </Card>
      ) : seleccion ? (
        <Expediente e={seleccion} q={t} />
      ) : matches.length === 0 ? (
        <Card>
          <EmptyState titulo="Sin coincidencias" descripcion={`No encontramos contratos para "${t}".`} />
        </Card>
      ) : (
        <Card>
          <CardHeader title={`${matches.length} contrato(s)`} subtitle="Elige el contrato del cliente" />
          <ul className="divide-y divide-border">
            {matches.slice(0, 30).map((e) => {
              const c = calcularLiquidacion(e);
              return (
                <li key={e.id}>
                  <Link
                    href={`/mostrador?q=${encodeURIComponent(t)}&id=${e.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        <span className="font-mono text-xs text-muted">{e.folio}</span> ·{" "}
                        {e.cliente.nombre} {e.cliente.apellidoPaterno} {e.cliente.apellidoMaterno}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {e.prenda.descripcion} · vence {formatFecha(e.fechaVencimiento)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{formatMXN(c.totalDesempeno)}</span>
                      {estadoEmpenoBadge(c.vencido && (e.estado === "activo" || e.estado === "refrendado") ? "vencido" : e.estado)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Expediente({ e, q }: { e: EmpenoConDetalle; q: string }) {
  const calc = calcularLiquidacion(e);
  const activo = e.estado === "activo" || e.estado === "refrendado";
  const cli = e.cliente;
  const nombreCompleto = `${cli.nombre} ${cli.apellidoPaterno} ${cli.apellidoMaterno}`.trim();

  return (
    <div className="space-y-6">
      {/* Cabecera del contrato */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted">Contrato</span>
            <span className="text-xl font-bold tracking-tight text-foreground">{e.folio}</span>
            {estadoEmpenoBadge(calc.vencido && activo ? "vencido" : e.estado)}
          </div>
          <Link href={`/mostrador?q=${encodeURIComponent(q)}`} className="text-sm font-medium text-muted hover:text-foreground">
            ← Otra búsqueda
          </Link>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-3">
          {/* Cliente */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Cliente</p>
            <div className="flex items-start gap-3">
              {cli.foto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cli.foto} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-xl text-muted">👤</span>
              )}
              <div className="min-w-0">
                <Link href={`/clientes/${cli.id}`} className="text-sm font-semibold text-foreground hover:text-primary">
                  {nombreCompleto}
                </Link>
                {cli.telefono && <p className="text-xs text-muted">📞 {cli.telefono}</p>}
                {cli.direccion && <p className="text-xs text-muted">📍 {cli.direccion}</p>}
                {cli.numeroIdentificacion && (
                  <p className="text-xs text-muted">{cli.tipoIdentificacion}: {cli.numeroIdentificacion}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contrato */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Contrato</p>
            <dl className="space-y-1.5 text-sm">
              <Dato k="Inicio" v={formatFecha(e.fechaInicio)} />
              <Dato k="Vencimiento" v={formatFecha(e.fechaVencimiento)} tono={calc.vencido && activo ? "danger" : undefined} />
              <Dato k="Préstamo" v={formatMXN(e.montoPrestado)} />
              <Dato k="Plazo" v={`${e.plazoPeriodos} ${e.periodo} · ${e.tasaInteres}%`} />
              {activo && (
                <Dato
                  k="Estatus"
                  v={calc.vencido ? `Vencido hace ${Math.abs(calc.diasParaVencer)} día(s)` : `Faltan ${calc.diasParaVencer} día(s)`}
                  tono={calc.vencido ? "danger" : undefined}
                />
              )}
            </dl>
          </div>

          {/* Prenda */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Prenda</p>
            <div className="flex items-start gap-3">
              {e.prenda.fotos[0] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={e.prenda.fotos[0]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-xl text-muted">📦</span>
              )}
              <div className="min-w-0">
                <Link href={`/prendas/${e.prenda.id}`} className="text-sm font-semibold text-foreground hover:text-primary">
                  {e.prenda.descripcion}
                </Link>
                <p className="text-xs text-muted">{e.prenda.folio} · {e.prenda.categoria}</p>
                <p className="text-xs text-muted">Avalúo {formatMXN(e.prenda.valorAvaluo)}</p>
                {e.prenda.ubicacionResguardo && <p className="truncate text-xs text-muted">🗄️ {e.prenda.ubicacionResguardo}</p>}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Montos a cobrar */}
      {activo ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <FormRefrendo e={e} calc={calc} />
          <FormDesempeno e={e} calc={calc} />
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between gap-3 px-5 py-6">
            <p className="text-sm text-muted">
              Este contrato está <strong className="text-foreground">{e.estado}</strong>; no admite más cobros.
            </p>
            <Link href={`/empenos/${e.id}`} className="text-sm font-medium text-primary">Ver historial →</Link>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={`/empenos/${e.id}`} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2">
          Ver contrato completo
        </Link>
        <a href={`/api/estado/${e.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2">
          🖨️ Estado de cuenta (PDF)
        </a>
      </div>
    </div>
  );
}

function FormRefrendo({ e, calc }: { e: EmpenoConDetalle; calc: CalculoLiquidacion }) {
  return (
    <Card>
      <CardHeader title="Refrendo (pago del periodo)" subtitle="Renueva el contrato otro periodo" />
      <div className="px-5 pb-2">
        <p className="text-3xl font-bold tracking-tight text-primary">{formatMXN(calc.totalRefrendo)}</p>
        <p className="mt-1 text-xs text-muted">Interés + almacenaje + IVA del periodo</p>
      </div>
      <form action={refrendarEmpeno.bind(null, e.id)} className="space-y-3 p-5 pt-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Método de pago
            <select name="metodoPago" defaultValue={e.metodoPago} className={campoCls}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </label>
          <Num name="moratorios" label="Moratorios" />
          <Num name="abonoCapital" label="Abono a capital" />
          <Num name="descuento" label="Descuento" />
          <Num name="recibido" label="Efectivo recibido" />
        </div>
        <ConfirmSubmit confirmacion="¿Registrar el refrendo y generar el recibo?" className="w-full">
          Refrendar y entregar recibo
        </ConfirmSubmit>
      </form>
    </Card>
  );
}

function FormDesempeno({ e, calc }: { e: EmpenoConDetalle; calc: CalculoLiquidacion }) {
  return (
    <Card>
      <CardHeader title="Desempeño (liquidación)" subtitle="El cliente recupera su prenda" />
      <div className="px-5 pb-2">
        <p className="text-3xl font-bold tracking-tight text-foreground">{formatMXN(calc.totalDesempeno)}</p>
        <p className="mt-1 text-xs text-muted">Capital {formatMXN(calc.capital)} + interés + almacenaje + IVA</p>
      </div>
      <form action={desempenarEmpeno.bind(null, e.id)} className="space-y-3 p-5 pt-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Método de pago
            <select name="metodoPago" defaultValue={e.metodoPago} className={campoCls}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </label>
          <Num name="moratorios" label="Moratorios" />
          <Num name="descuento" label="Descuento" />
          <Num name="recibido" label="Efectivo recibido" />
        </div>
        <ConfirmSubmit variante="secondary" confirmacion={`¿Registrar desempeño por ${formatMXN(calc.totalDesempeno)}?`} className="w-full">
          Desempeñar y entregar ticket
        </ConfirmSubmit>
      </form>
    </Card>
  );
}

function Num({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input name={name} type="number" step="0.01" placeholder="0.00" className={campoCls} />
    </label>
  );
}

function Dato({ k, v, tono }: { k: string; v: string; tono?: "danger" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className={`font-medium ${tono === "danger" ? "text-danger" : "text-foreground"}`}>{v}</dd>
    </div>
  );
}
