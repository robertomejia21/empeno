import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerEmpeno } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { refrendarEmpeno, desempenarEmpeno } from "@/lib/actions";
import { formatMXN, formatFecha, formatFechaLarga, formatPorcentaje } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge } from "@/components/ui";
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
        <PageHeader
          title={`Empeño ${empeno.folio}`}
          subtitle={`Creado el ${formatFechaLarga(empeno.creadoEn)}`}
          action={
            <div className="flex items-center gap-2">
              <PrintButton>🖨️ Imprimir boleta</PrintButton>
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

        <div className="grid gap-6 md:grid-cols-3">
          {/* Liquidación */}
          <Card className="md:col-span-2">
            <CardHeader
              title="Liquidación al día de hoy"
              subtitle={`${calc.periodosTranscurridos} periodo(s) · ${calc.diasTranscurridos} días transcurridos`}
            />
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
              <Celda etiqueta="Capital" valor={formatMXN(calc.capital)} />
              <Celda etiqueta="Interés acumulado" valor={formatMXN(calc.interesAcumulado)} />
              <Celda
                etiqueta="Total desempeño"
                valor={formatMXN(calc.totalDesempeno)}
                destacado
              />
              <Celda etiqueta="Refrendo (sólo interés)" valor={formatMXN(calc.totalRefrendo)} />
              <Celda etiqueta="Tasa" valor={`${formatPorcentaje(empeno.tasaInteres)} ${periodoLabel[empeno.periodo].toLowerCase()}`} />
              <Celda
                etiqueta={calc.diasParaVencer >= 0 ? "Días para vencer" : "Días vencido"}
                valor={Math.abs(calc.diasParaVencer).toString()}
              />
            </div>

            {activo && (
              <div className="flex flex-wrap gap-3 border-t border-border px-5 py-4">
                <form action={refrendar}>
                  <ConfirmSubmit
                    variante="secondary"
                    confirmacion={`¿Registrar refrendo por ${formatMXN(calc.totalRefrendo)}? Se renovará el plazo.`}
                  >
                    Refrendar · {formatMXN(calc.totalRefrendo)}
                  </ConfirmSubmit>
                </form>
                <form action={desempenar}>
                  <ConfirmSubmit
                    confirmacion={`¿Registrar desempeño por ${formatMXN(calc.totalDesempeno)}? El cliente recupera su prenda.`}
                  >
                    Desempeñar · {formatMXN(calc.totalDesempeno)}
                  </ConfirmSubmit>
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
            <CardHeader title="Prenda en garantía" />
            <dl className="space-y-3 p-5 text-sm">
              <Linea etiqueta="Folio" valor={empeno.prenda.folio} />
              <Linea etiqueta="Descripción" valor={empeno.prenda.descripcion} />
              <Linea etiqueta="Departamento" valor={empeno.prenda.categoria} />
              <Linea etiqueta="Avalúo" valor={formatMXN(empeno.prenda.valorAvaluo)} />
              {empeno.prenda.ubicacionResguardo && (
                <Linea etiqueta="Resguardo" valor={empeno.prenda.ubicacionResguardo} />
              )}
            </dl>
          </Card>
        </div>
      </div>

      {/* Boleta para imprimir */}
      <Boleta empeno={empeno} calc={calc} />
    </div>
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
