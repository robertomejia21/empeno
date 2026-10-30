import Link from "next/link";
import { listarEmpenos } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { enviarRecordatorioWhatsApp, enviarRecordatoriosHoy } from "@/lib/actions";
import { whatsappHabilitado } from "@/lib/whatsapp";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge, EmptyState } from "@/components/ui";
import { ConfirmSubmit } from "@/components/actions-ui";
import { CircleCheck, Hourglass, MessageCircle, Phone, Send } from "lucide-react";

export default async function RecordatoriosPage() {
  const empenos = await listarEmpenos();
  const activos = empenos
    .filter((e) => e.estado === "activo" || e.estado === "refrendado")
    .map((e) => ({ e, calc: calcularLiquidacion(e) }));

  const vencidos = activos.filter((x) => x.calc.vencido).sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);
  const porVencer = activos
    .filter((x) => !x.calc.vencido && x.calc.diasParaVencer <= 7)
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);
  const proximos = activos
    .filter((x) => !x.calc.vencido && x.calc.diasParaVencer > 7 && x.calc.diasParaVencer <= 30)
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);

  const waOn = whatsappHabilitado();

  return (
    <div>
      <PageHeader
        title="Recordatorios"
        subtitle="Seguimiento de vencimientos para contactar al cliente"
        action={
          waOn ? (
            <form action={enviarRecordatoriosHoy}>
              <ConfirmSubmit confirmacion="¿Enviar por WhatsApp un recordatorio a todos los vencidos y por vencer (≤3 días)?">
                <Send className="h-4 w-4" aria-hidden />
                Enviar recordatorios de hoy
              </ConfirmSubmit>
            </form>
          ) : undefined
        }
      />

      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-info/20 bg-info-soft px-4 py-3 text-sm text-info sm:px-5">
        {waOn ? (
          <>
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>WhatsApp conectado. Además, cada día a las 10:00 se envían los recordatorios automáticamente.</span>
          </>
        ) : (
          <>
            <Hourglass className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>WhatsApp aún no está vinculado: los botones abren WhatsApp Web. Escanea el QR para activar el envío automático diario (10:00 a.m.).</span>
          </>
        )}
      </div>

      <div className="space-y-6">
        <Grupo titulo="Vencidos" tono="danger" items={vencidos} vencido waOn={waOn} />
        <Grupo titulo="Por vencer (≤ 7 días)" tono="warning" items={porVencer} waOn={waOn} />
        <Grupo titulo="Próximos (8–30 días)" tono="info" items={proximos} waOn={waOn} />
      </div>
    </div>
  );
}

function Grupo({
  titulo,
  tono,
  items,
  vencido,
  waOn,
}: {
  titulo: string;
  tono: "danger" | "warning" | "info";
  items: { e: Awaited<ReturnType<typeof import("@/lib/db/repo").listarEmpenos>>[number]; calc: ReturnType<typeof calcularLiquidacion> }[];
  vencido?: boolean;
  waOn?: boolean;
}) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            {titulo} <Badge tono={tono}>{items.length}</Badge>
          </span>
        }
      />
      {items.length === 0 ? (
        <EmptyState titulo="Nada por aquí" descripcion="No hay empeños en este rango." />
      ) : (
        <ul className="divide-y divide-border">
          {items.map(({ e, calc }) => {
            const tel = e.cliente.telefono?.replace(/\D/g, "");
            return (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1 basis-56">
                  <Link href={`/empenos/${e.id}`} className="wrap-break-word text-sm font-medium text-foreground hover:text-primary">
                    {e.folio} · {e.cliente.nombre} {e.cliente.apellidoPaterno}
                  </Link>
                  <p className="text-xs text-muted">
                    {e.prenda.descripcion} · {vencido ? "venció" : "vence"} {formatFecha(e.fechaVencimiento)} ·{" "}
                    {Math.abs(calc.diasParaVencer)} días {vencido ? "atrás" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-foreground">{formatMXN(calc.totalDesempeno)}</span>
                  {e.cliente.telefono ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <a
                        href={`tel:${tel}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium transition hover:bg-surface-2"
                      >
                        <Phone className="h-3.5 w-3.5" aria-hidden />
                        Llamar
                      </a>
                      {waOn ? (
                        <form action={enviarRecordatorioWhatsApp.bind(null, e.id)}>
                          <ConfirmSubmit confirmacion={`¿Enviar recordatorio por WhatsApp a ${e.cliente.nombre}?`}>
                            Enviar WhatsApp
                          </ConfirmSubmit>
                        </form>
                      ) : (
                        <a
                          href={`https://wa.me/52${tel}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                        >
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted">sin teléfono</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
