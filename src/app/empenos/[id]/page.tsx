import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerEmpeno } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { refrendarEmpeno, desempenarEmpeno, enviarFotoVehiculo } from "@/lib/actions";
import { formatMXN, formatFecha, formatFechaLarga, formatPorcentaje } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge, VolverLink } from "@/components/ui";
import { estadoEmpenoBadge } from "@/components/badges";
import { PrintButton, ConfirmSubmit } from "@/components/actions-ui";
import { Boleta } from "./Boleta";

const periodoLabel: Record<string, string> = {
  mensual: "Mensual",
  quincenal: "Quincenal",
  semanal: "Semanal",
};

export default async function EmpenoDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const empeno = await obtenerEmpeno(id);
  if (!empeno) notFound();

  const calc = calcularLiquidacion(empeno);
  const activo = empeno.estado === "activo" || empeno.estado === "refrendado";
  const estadoMostrar = activo && calc.vencido ? "vencido" : empeno.estado;

  const refrendar = refrendarEmpeno.bind(null, empeno.id);
  const desempenar = desempenarEmpeno.bind(null, empeno.id);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print">
        <VolverLink href="/empenos" label="Empeños" />
        <PageHeader
          title={`Empeño ${empeno.folio}`}
          subtitle={`Creado el ${formatFechaLarga(empeno.creadoEn)}`}
          action={
            <div className="flex items-center gap-2">
              <Link
                href={`/empenos/${empeno.id}/contrato`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
              >
                📝 Contrato PROFECO
              </Link>
              <a
                href={`/api/boleta/${empeno.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
              >
                📄 Descargar PDF
              </a>
              <PrintButton>🖨️ Imprimir</PrintButton>
              {estadoEmpenoBadge(estadoMostrar)}
            </div>
          }
        />

        {calc.vencido && activo && (
          <div className="mb-6 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            ⚠️ Este empeño está <strong>vencido</strong> (venció el{" "}
            {formatFecha(empeno.fechaVencimiento)}). Pasados los días de gracia puede
            pasar a remate.
          </div>
        )}

        {activo && <LineaTiempo inicio={empeno.fechaInicio} fin={empeno.fechaVencimiento} />}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Liquidación */}
          <Card className="md:col-span-2">
            <CardHeader
              title="Liquidación al día de hoy"
              subtitle={`${calc.periodosTranscurridos} periodo(s) · ${calc.diasTranscurridos} días transcurridos`}
            />
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
              <Celda etiqueta="Capital pendiente" valor={formatMXN(calc.capital)} />
              <Celda etiqueta="Interés acumulado" valor={formatMXN(calc.interesAcumulado)} />
              <Celda etiqueta="Almacenaje" valor={formatMXN(calc.almacenajeAcumulado)} />
              <Celda etiqueta="IVA" valor={formatMXN(calc.ivaAcumulado)} />
              <Celda etiqueta="Refrendo (periodo)" valor={formatMXN(calc.totalRefrendo)} />
              <Celda etiqueta="Total desempeño" valor={formatMXN(calc.totalDesempeno)} destacado />
            </div>
            {empeno.abonoCapital > 0 && (
              <p className="border-t border-border px-5 py-2 text-xs text-muted">
                Abonos a capital aplicados: <strong className="text-success">{formatMXN(empeno.abonoCapital)}</strong>
              </p>
            )}

            {activo && (
              <div className="space-y-4 border-t border-border px-5 py-4">
                {/* Refrendo / abono mensual con recibo */}
                <form action={refrendar} className="rounded-xl bg-surface-2 p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">Refrendo / abono mensual</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1 text-xs text-muted">
                      Método de pago
                      <select name="metodoPago" defaultValue={empeno.metodoPago} className={campoCls}>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="tarjeta">Tarjeta</option>
                      </select>
                    </label>
                    <CampoNum name="moratorios" label="Moratorios" />
                    <CampoNum name="gastosAdmin" label="Gastos admin." />
                    <CampoNum name="abonoCapital" label="Abono a capital" />
                    <CampoNum name="descuento" label="Descuento" />
                    <CampoNum name="recibido" label="Efectivo recibido" />
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Intereses {formatMXN(calc.totalRefrendo)} (interés + almacenaje + IVA por periodo). El total se
                    calcula con moratorios/abono/descuento y se genera el recibo.
                  </p>
                  <div className="mt-3">
                    <ConfirmSubmit confirmacion="¿Registrar el refrendo/abono y generar el recibo?">
                      Registrar y entregar recibo
                    </ConfirmSubmit>
                  </div>
                </form>
                <form action={desempenar} className="rounded-xl border border-border bg-surface-2/40 p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">Desempeño (liquidación)</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1 text-xs text-muted">
                      Método de pago
                      <select name="metodoPago" defaultValue={empeno.metodoPago} className={campoCls}>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="tarjeta">Tarjeta</option>
                      </select>
                    </label>
                    <CampoNum name="moratorios" label="Moratorios" />
                    <CampoNum name="gastosAdmin" label="Gastos admin." />
                    <CampoNum name="rentaGps" label="Renta GPS" />
                    <CampoNum name="rentaSeguro" label="Renta seguro" />
                    <CampoNum name="pension" label="Pensión" />
                    <CampoNum name="gastosVenta" label="Gastos venta" />
                    <CampoNum name="descuento" label="Descuento" />
                    <CampoNum name="recibido" label="Efectivo recibido" />
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    A liquidar hoy: <strong>{formatMXN(calc.totalDesempeno)}</strong> (capital + interés + almacenaje +
                    IVA). Los cargos extra se suman y se genera el ticket de desempeño.
                  </p>
                  <div className="mt-3">
                    <ConfirmSubmit
                      variante="secondary"
                      confirmacion={`¿Registrar desempeño por ${formatMXN(calc.totalDesempeno)}? El cliente recupera su prenda.`}
                    >
                      Desempeñar y entregar ticket
                    </ConfirmSubmit>
                  </div>
                </form>
              </div>
            )}
          </Card>

          {/* Datos del contrato */}
          <Card>
            <CardHeader title="Contrato" />
            <dl className="space-y-3 p-5 text-sm">
              <Linea etiqueta="Inicio" valor={formatFecha(empeno.fechaInicio)} />
              <Linea etiqueta="Vencimiento" valor={formatFecha(empeno.fechaVencimiento)} />
              <Linea etiqueta="Periodo" valor={periodoLabel[empeno.periodo]} />
              <Linea etiqueta="Plazo" valor={`${empeno.plazoPeriodos} periodo(s)`} />
              <Linea etiqueta="Días de gracia" valor={empeno.diasGracia.toString()} />
              <Linea etiqueta="Método de pago" valor={empeno.metodoPago} />
              {(empeno.almacenajePct > 0 || empeno.ivaPct > 0) && (
                <Linea etiqueta="Cargos" valor={`Almacenaje ${empeno.almacenajePct}% · IVA ${empeno.ivaPct}%`} />
              )}
              {empeno.comisionista && <Linea etiqueta="Comisionista" valor={empeno.comisionista} />}
            </dl>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Cliente */}
          <Card>
            <CardHeader
              title="Cliente"
              action={
                <Link href={`/clientes/${empeno.cliente.id}`} className="text-sm text-primary">
                  Ver ficha →
                </Link>
              }
            />
            <dl className="space-y-3 p-5 text-sm">
              <Linea
                etiqueta="Nombre"
                valor={`${empeno.cliente.nombre} ${empeno.cliente.apellidoPaterno} ${empeno.cliente.apellidoMaterno}`}
              />
              <Linea etiqueta="CURP" valor={empeno.cliente.curp ?? "—"} />
              <Linea
                etiqueta="Identificación"
                valor={`${empeno.cliente.tipoIdentificacion} · ${empeno.cliente.numeroIdentificacion}`}
              />
              <Linea etiqueta="Teléfono" valor={empeno.cliente.telefono ?? "—"} />
            </dl>
          </Card>

          {/* Prenda */}
          <Card>
            <CardHeader
              title="Prenda en garantía"
              action={
                empeno.prenda.categoria === "Vehículos" ? (
                  empeno.prenda.verificado ? (
                    <Badge tono="success">✓ Verificado REPUVE</Badge>
                  ) : (
                    <Badge tono="danger">Sin verificar</Badge>
                  )
                ) : undefined
              }
            />
            <dl className="space-y-3 p-5 text-sm">
              <Linea etiqueta="Folio" valor={empeno.prenda.folio} />
              <Linea etiqueta="Descripción" valor={empeno.prenda.descripcion} />
              <Linea etiqueta="Departamento" valor={empeno.prenda.categoria} />
              <Linea etiqueta="Avalúo" valor={formatMXN(empeno.prenda.valorAvaluo)} />
              {empeno.prenda.ubicacionResguardo && (
                <Linea etiqueta="Resguardo" valor={empeno.prenda.ubicacionResguardo} />
              )}
              {empeno.prenda.categoria === "Vehículos" && (
                <>
                  {empeno.prenda.gps && <Linea etiqueta="GPS" valor={empeno.prenda.gps} />}
                  {empeno.prenda.repuveFolio && <Linea etiqueta="Folio REPUVE" valor={empeno.prenda.repuveFolio} />}
                </>
              )}
            </dl>
            {empeno.prenda.categoria === "Vehículos" && activo && (
              <div className="border-t border-border px-5 py-4">
                <form action={enviarFotoVehiculo.bind(null, empeno.id)}>
                  <ConfirmSubmit variante="secondary" confirmacion="¿Enviar la foto del vehículo al propietario por WhatsApp?">
                    📷 Enviar foto al propietario
                  </ConfirmSubmit>
                </form>
                <p className="mt-2 text-xs text-muted">Automático cada miércoles a las 10:00.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Boleta para imprimir */}
      <Boleta empeno={empeno} calc={calc} />
    </div>
  );
}

const campoCls =
  "rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground focus:border-primary-2 focus:outline-none focus:ring-2 focus:ring-primary-2/20";

function CampoNum({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input name={name} type="number" step="0.01" placeholder="0.00" className={campoCls} />
    </label>
  );
}

function LineaTiempo({ inicio, fin }: { inicio: string; fin: string }) {
  const msDia = 86400000;
  const t0 = new Date(inicio + "T00:00:00").getTime();
  const t1 = new Date(fin + "T00:00:00").getTime();
  const ahora = Date.now();
  const total = Math.max(1, Math.round((t1 - t0) / msDia));
  const trans = Math.round((ahora - t0) / msDia);
  const pct = Math.max(2, Math.min(100, (trans / total) * 100));
  const vencido = ahora > t1;
  return (
    <Card className="mb-6 p-5">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">Inicio · {formatFecha(inicio)}</span>
        <span className="text-muted">{Math.max(0, total - trans)} días restantes</span>
        <span className="font-medium text-foreground">Vence · {formatFecha(fin)}</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${vencido ? "bg-danger" : "bg-gold-gradient"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}

function Celda({
  etiqueta,
  valor,
  destacado,
}: {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div className="bg-surface px-5 py-4">
      <p className="text-xs text-muted">{etiqueta}</p>
      <p
        className={`mt-1 font-bold ${destacado ? "text-xl text-primary" : "text-base text-foreground"}`}
      >
        {valor}
      </p>
    </div>
  );
}

function Linea({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted">{etiqueta}</dt>
      <dd className="text-right font-medium text-foreground">{valor}</dd>
    </div>
  );
}
