import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Camera, Download, FileSignature, Hourglass, Printer, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { obtenerEmpeno, contarRefrendos } from "@/lib/db/repo";
import { calcularLiquidacion, moratoriosSugeridos, calcularVencimiento } from "@/lib/interes";
import { esDiaInhabil } from "@/lib/diasInhabiles";
import { refrendarEmpeno, desempenarEmpeno, enviarFotoVehiculo, cancelarEmpeno, eliminarEmpenoPermanente } from "@/lib/actions";
import { getUsuarioActual } from "@/lib/session";
import { formatMXN, formatFecha, formatFechaLarga } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge, VolverLink } from "@/components/ui";
import { estadoEmpenoBadge } from "@/components/badges";
import { PrintButton, ConfirmSubmit } from "@/components/actions-ui";
import { Boleta } from "./Boleta";
import { RefrendoForm } from "./RefrendoForm";
import { FotoLavado } from "./FotoLavado";

const periodoLabel: Record<string, string> = {
  mensual: "Mensual",
  quincenal: "Quincenal",
  diario: "Diario",
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
  const cancelar = cancelarEmpeno.bind(null, empeno.id);
  const eliminar = eliminarEmpenoPermanente.bind(null, empeno.id);
  // Cancelar solo tiene sentido antes de que el contrato tenga movimientos
  // (refrendos o abonos) — después de eso se cierra con desempeño.
  const refrendos = await contarRefrendos(empeno.id);
  const puedeCancelar =
    (empeno.estado === "borrador" || empeno.estado === "activo") && empeno.abonoCapital === 0 && refrendos === 0;
  const esAdmin = (await getUsuarioActual())?.rol === "admin";
  // La fecha de pago queda fija desde el contrato: el próximo vencimiento
  // siempre ancla al periodo anterior (ver refrendarEmpeno), nunca al día
  // real de pago — aquí solo se avisa si ese día fijo cae en domingo/festivo.
  const proximoVenc = calcularVencimiento(empeno.fechaVencimiento, empeno.periodo, empeno.plazoPeriodos);
  const proximoVencInhabil = esDiaInhabil(proximoVenc);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="no-print">
        <VolverLink href="/empenos" label="Empeños" />
        <PageHeader
          title={`Empeño ${empeno.folio}`}
          subtitle={`Creado el ${formatFechaLarga(empeno.creadoEn)}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/empenos/${empeno.id}/contrato`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground shadow-soft transition hover:bg-surface-2"
              >
                <FileSignature className="h-4 w-4" aria-hidden /> Contrato PROFECO
              </Link>
              <a
                href={`/api/boleta/${empeno.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground shadow-soft transition hover:bg-surface-2"
              >
                <Download className="h-4 w-4" aria-hidden /> Descargar PDF
              </a>
              <PrintButton>
                <Printer className="h-4 w-4" aria-hidden /> Imprimir
              </PrintButton>
              {estadoEmpenoBadge(estadoMostrar)}
            </div>
          }
        />

        {empeno.estado === "borrador" && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
            <Hourglass className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
            Este empeño está en <strong>borrador</strong>, pendiente de autorización de Dirección por tasa especial. No se puede cerrar (refrendar/desempeñar) hasta que se autorice en{" "}
            <Link href="/autorizaciones" className="font-semibold underline underline-offset-2">Autorizaciones</Link>.
            </p>
          </div>
        )}

        {calc.vencido && activo && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
            Este empeño está <strong>vencido</strong> (venció el{" "}
            {formatFecha(empeno.fechaVencimiento)}). Pasados los días de gracia puede
            pasar a remate.
            </p>
          </div>
        )}

        {activo && <LineaTiempo inicio={empeno.fechaInicio} fin={empeno.fechaVencimiento} />}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Liquidación */}
          <Card className="min-w-0 lg:col-span-2">
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
              <div className="space-y-4 border-t border-border px-4 py-4 sm:px-5">
                {/* Refrendo / abono mensual con recibo */}
                <RefrendoForm
                  accion={refrendar}
                  base={calc.totalRefrendo}
                  metodoDefault={empeno.metodoPago}
                  montoPrestado={empeno.montoPrestado}
                  vencido={calc.vencido}
                  proximoVencInhabil={proximoVencInhabil}
                />
                <form action={desempenar} className="rounded-xl border border-border bg-surface p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">Desempeño (liquidación)</p>
                  <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3">
                    <label className="flex flex-col gap-1 text-xs text-muted">
                      Método de pago
                      <select name="metodoPago" defaultValue={empeno.metodoPago} className={campoCls}>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="tarjeta">Tarjeta</option>
                      </select>
                    </label>
                    <CampoNum
                      name="moratorios"
                      label="Moratorios"
                      defaultValue={moratoriosSugeridos(empeno.montoPrestado, calc.vencido)}
                      nota={calc.vencido ? "6% por atraso (editable)" : undefined}
                    />
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
                <Link href={`/clientes/${empeno.cliente.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Ver ficha <ArrowRight className="h-4 w-4" aria-hidden />
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
                    <Badge tono="success">
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden /> Verificado REPUVE
                    </Badge>
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
              <div className="space-y-3 border-t border-border px-5 py-4">
                <FotoLavado empenoId={empeno.id} />
                <form action={enviarFotoVehiculo.bind(null, empeno.id)}>
                  <ConfirmSubmit variante="secondary" confirmacion="¿Enviar la última foto guardada del vehículo al propietario por WhatsApp?">
                    <Camera className="h-4 w-4" aria-hidden /> Enviar última foto guardada
                  </ConfirmSubmit>
                </form>
              </div>
            )}
          </Card>
        </div>

        {puedeCancelar && (
          <Card className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Cancelar contrato</p>
                <p className="text-xs text-muted">
                  Solo disponible sin refrendos ni abonos. Libera la prenda y revierte el préstamo en caja.
                </p>
              </div>
              <form action={cancelar}>
                <ConfirmSubmit
                  variante="secondary"
                  confirmacion={`¿Cancelar el contrato ${empeno.folio}? Esta acción no se puede deshacer.`}
                >
                  Cancelar contrato
                </ConfirmSubmit>
              </form>
            </div>
          </Card>
        )}

        {esAdmin && (
          <Card className="mt-6 border-danger/20">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Eliminar contrato (uso exclusivo Dirección General)</p>
                <p className="text-xs text-muted">
                  Borra el contrato, su prenda y sus pagos de forma permanente — para depurar datos de prueba. No se
                  puede deshacer y no está disponible si la prenda ya se vendió.
                </p>
              </div>
              <form action={eliminar}>
                <ConfirmSubmit
                  variante="danger"
                  confirmacion={`¿Eliminar PERMANENTEMENTE el contrato ${empeno.folio} de ${empeno.cliente.nombre} ${empeno.cliente.apellidoPaterno}? Esto borra el contrato, su prenda y sus pagos. No se puede deshacer.`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Eliminar contrato permanentemente
                </ConfirmSubmit>
              </form>
            </div>
          </Card>
        )}
      </div>

      {/* Boleta para imprimir */}
      <Boleta empeno={empeno} calc={calc} />
    </div>
  );
}

const campoCls =
  "rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function CampoNum({ name, label, defaultValue, nota }: { name: string; label: string; defaultValue?: number; nota?: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input name={name} type="number" step="0.01" placeholder="0.00" defaultValue={defaultValue || undefined} className={campoCls} />
      {nota && <span className="text-[10px] text-info">{nota}</span>}
    </label>
  );
}

function LineaTiempo({ inicio, fin }: { inicio: string; fin: string }) {
  const msDia = 86400000;
  const t0 = new Date(inicio + "T00:00:00").getTime();
  const t1 = new Date(fin + "T00:00:00").getTime();
  // eslint-disable-next-line react-hooks/purity -- Server Component: se evalúa una sola vez por request.
  const ahora = Date.now();
  const total = Math.max(1, Math.round((t1 - t0) / msDia));
  const trans = Math.round((ahora - t0) / msDia);
  const pct = Math.max(2, Math.min(100, (trans / total) * 100));
  const vencido = ahora > t1;
  return (
    <Card className="mb-6 p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <span className="font-medium text-foreground">Inicio · {formatFecha(inicio)}</span>
        <span className="text-muted">{Math.max(0, total - trans)} días restantes</span>
        <span className="font-medium text-foreground">Vence · {formatFecha(fin)}</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${vencido ? "bg-danger" : "bg-primary"}`}
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
    <div className="min-w-0 bg-surface px-4 py-4 sm:px-5">
      <p className="text-xs text-muted">{etiqueta}</p>
      <p
        className={`mt-1 break-words font-bold tabular-nums ${destacado ? "text-xl text-primary" : "text-base text-foreground"}`}
      >
        {valor}
      </p>
    </div>
  );
}

function Linea({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted">{etiqueta}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-foreground">{valor}</dd>
    </div>
  );
}
