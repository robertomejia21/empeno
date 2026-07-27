"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolverAutorizacion } from "@/lib/actions";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, Badge } from "@/components/ui";
import type { Autorizacion, EstadoAutorizacion } from "@/lib/types";

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
          <p className="px-5 py-8 text-center text-sm text-muted">No hay solicitudes pendientes. 🎉</p>
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
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div className="min-w-0">
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
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
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
            className="min-w-[180px] flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={procesando}
            onClick={() => resolver(true)}
            className="rounded-lg bg-success px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            ✓ Aprobar
          </button>
          <button
            type="button"
            disabled={procesando}
            onClick={() => resolver(false)}
            className="rounded-lg bg-danger px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            ✕ Rechazar
          </button>
        </div>
      )}
    </li>
  );
}
