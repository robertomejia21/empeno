"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolverAutorizacion } from "@/lib/actions";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, Badge } from "@/components/ui";
import type { Autorizacion, EstadoAutorizacion } from "@/lib/types";
import { Check, CircleCheck, X } from "lucide-react";

const TONO: Record<EstadoAutorizacion, "warning" | "success" | "danger"> = {
  pendiente: "warning",
  aprobada: "success",
  rechazada: "danger",
};
const ETIQUETA: Record<EstadoAutorizacion, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

export function BandejaAutorizaciones({
  autorizaciones,
  puedeResolver,
}: {
  autorizaciones: Autorizacion[];
  puedeResolver: boolean;
}) {
  const pendientes = autorizaciones.filter((a) => a.estado === "pendiente");
  const resueltas = autorizaciones.filter((a) => a.estado !== "pendiente");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Pendientes de autorización"
          subtitle={puedeResolver ? "Aprueba o rechaza como Dirección General" : "En espera de resolución de Dirección General"}
        />
        {pendientes.length === 0 ? (
          <p className="flex items-center justify-center gap-2 px-5 py-8 text-center text-sm text-muted">
            <CircleCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
            No hay solicitudes pendientes.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pendientes.map((a) => (
              <Solicitud key={a.id} a={a} puedeResolver={puedeResolver} />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Historial" subtitle={`${resueltas.length} resueltas`} />
        {resueltas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Aún no hay autorizaciones resueltas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {resueltas.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {a.folio} · {a.clienteNombre ?? "—"} · tasa {a.tasaSolicitada ?? "?"}%
                  </p>
                  <p className="truncate text-xs text-muted">
                    {a.bien ?? ""} {a.autorizadorNombre ? `· por ${a.autorizadorNombre}` : ""}
                    {a.comentarioResolucion ? ` · "${a.comentarioResolucion}"` : ""}
                  </p>
                </div>
                <Badge tono={TONO[a.estado]}>{ETIQUETA[a.estado]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Solicitud({ a, puedeResolver }: { a: Autorizacion; puedeResolver: boolean }) {
  const router = useRouter();
  const [comentario, setComentario] = useState("");
  const [procesando, setProcesando] = useState(false);

  async function resolver(aprobada: boolean) {
    setProcesando(true);
    try {
      await resolverAutorizacion(a.id, aprobada, comentario || null);
      router.refresh();
    } finally {
      setProcesando(false);
    }
  }

  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="wrap-break-word font-medium text-foreground">
            {a.folio} · Tasa especial {a.tasaSolicitada ?? "?"}%
            <span className="text-muted"> (catálogo {a.tasaEstandar ?? "?"}%)</span>
          </p>
          <p className="mt-0.5 text-sm text-muted">
            Cliente: <strong className="text-foreground">{a.clienteNombre ?? "—"}</strong>
            {a.bien ? ` · ${a.bien}` : ""}
            {a.monto ? ` · préstamo ${formatMXN(a.monto)}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Solicitó {a.solicitanteNombre ?? "—"} · {formatFecha(a.creadoEn)}
            {a.referencia ? ` · ref. ${a.referencia}` : ""}
            {a.motivo ? ` · motivo: ${a.motivo}` : ""}
          </p>
        </div>
        <Badge tono="warning">Pendiente</Badge>
      </div>

      {puedeResolver && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Comentario (opcional)"
            className="min-w-0 flex-1 basis-48 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm outline-none transition focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            disabled={procesando}
            onClick={() => resolver(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" aria-hidden />
            Aprobar
          </button>
          <button
            type="button"
            disabled={procesando}
            onClick={() => resolver(false)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden />
            Rechazar
          </button>
        </div>
      )}
    </li>
  );
}
