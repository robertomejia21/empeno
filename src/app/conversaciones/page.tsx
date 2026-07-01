import { listarBitacora } from "@/lib/db/repo";
import { estadoInstancia, whatsappHabilitado } from "@/lib/whatsapp";
import { formatFechaHora } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge, EmptyState } from "@/components/ui";

export const metadata = { title: "Conversaciones WhatsApp" };

export default async function ConversacionesPage() {
  const habilitado = whatsappHabilitado();
  const estado = habilitado ? await estadoInstancia() : "no_configurado";
  const conectado = estado === "open";

  const eventos = (await listarBitacora(300)).filter((e) =>
    /whatsapp|recordatorio|foto de veh/i.test(e.accion)
  );

  const estadoLabel: Record<string, { txt: string; tono: Parameters<typeof Badge>[0]["tono"] }> = {
    open: { txt: "Conectado", tono: "success" },
    connecting: { txt: "Conectando / sin vincular", tono: "warning" },
    close: { txt: "Desconectado", tono: "danger" },
    no_configurado: { txt: "No configurado", tono: "muted" },
    error: { txt: "Error", tono: "danger" },
  };
  const est = estadoLabel[estado] ?? estadoLabel.error;

  return (
    <div>
      <PageHeader
        title="Conversaciones WhatsApp"
        subtitle="Mensajería con clientes"
        action={<Badge tono={est.tono}>{est.txt}</Badge>}
      />

      {!conectado && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning-soft px-5 py-4 text-sm text-warning">
          ⏳ <strong>WhatsApp aún no está vinculado.</strong> Para activar el chat en vivo y el envío automático
          (recordatorios y fotos de vehículos), escanea el código QR con el WhatsApp de la casa de empeño.
          Pídele al administrador que genere el QR.
        </div>
      )}

      <Card>
        <CardHeader title="Actividad de WhatsApp" subtitle="Mensajes enviados desde el sistema" />
        {eventos.length === 0 ? (
          <EmptyState
            titulo="Sin actividad todavía"
            descripcion="Aquí verás los recordatorios y fotos enviados a los clientes por WhatsApp."
          />
        ) : (
          <ul className="divide-y divide-border">
            {eventos.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{e.accion}</p>
                  <p className="truncate text-xs text-muted">{e.detalle}{e.referencia ? ` · ${e.referencia}` : ""}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">{formatFechaHora(e.fecha)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-6 text-xs text-muted">
        El chat bidireccional en vivo se habilita al vincular el número. Mientras tanto, los avisos salen de
        Recordatorios, Cobranza y el envío semanal de fotos de vehículos.
      </p>
    </div>
  );
}
