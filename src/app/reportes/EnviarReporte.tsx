"use client";

import { useState, useTransition } from "react";
import { Mail, Send } from "lucide-react";
import { enviarReporteDireccion } from "@/lib/actions";

const btn =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary disabled:opacity-50";

/** Envía el reporte del rango a Dirección: WhatsApp (Green API) o correo (abre el cliente de correo). */
export function EnviarReporte({
  desde,
  hasta,
  texto,
  correo,
  whatsapp,
}: {
  desde: string;
  hasta: string;
  texto: string;
  correo: string;
  whatsapp: string;
}) {
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const mailto = `mailto:${correo}?subject=${encodeURIComponent(texto.split("\n")[0].replace("📊 ", "") + " · " + texto.split("\n")[1])}&body=${encodeURIComponent(texto.replace(/\*/g, ""))}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted">Enviar a Dirección:</span>
      <button
        type="button"
        disabled={pendiente || !whatsapp}
        title={whatsapp ? `WhatsApp ${whatsapp}` : "Captura el WhatsApp de Dirección en Configuración"}
        onClick={() =>
          iniciar(async () => {
            const r = await enviarReporteDireccion(desde, hasta);
            setMsg({ ok: r.ok, texto: r.mensaje });
          })
        }
        className={btn}
      >
        <Send className="h-3.5 w-3.5" aria-hidden /> {pendiente ? "Enviando…" : "WhatsApp"}
      </button>
      {correo ? (
        <a href={mailto} className={btn} title={correo}>
          <Mail className="h-3.5 w-3.5" aria-hidden /> Correo
        </a>
      ) : null}
      {msg && <span className={`text-xs ${msg.ok ? "text-success" : "text-danger"}`}>{msg.texto}</span>}
    </div>
  );
}
