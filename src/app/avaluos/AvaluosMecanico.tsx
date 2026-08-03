"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { responderAvaluoMecanico } from "@/lib/actions";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui";
import type { Cotizacion } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

export function AvaluosMecanico({ pendientes, respondidas }: { pendientes: Cotizacion[]; respondidas: Cotizacion[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Vehículos por avaluar" subtitle={`${pendientes.length} pendiente(s)`} />
        {pendientes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No hay vehículos pendientes de avalúo. 🎉</p>
        ) : (
          <ul className="divide-y divide-border">
            {pendientes.map((c) => (
              <ItemPendiente key={c.id} c={c} />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Avalúos realizados" subtitle={`${respondidas.length}`} />
        {respondidas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Aún no has enviado avalúos.</p>
        ) : (
          <ul className="divide-y divide-border">
            {respondidas.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{c.descripcion}{c.modelo ? ` (${c.modelo})` : ""}</p>
                  <p className="truncate text-xs text-muted">
                    Facebook: {c.busquedaFacebook ? formatMXN(c.busquedaFacebook) : "s/d"}
                    {c.comentarioMecanico ? ` · ${c.comentarioMecanico}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-success">{c.avaluoMecanico != null ? formatMXN(c.avaluoMecanico) : "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ItemPendiente({ c }: { c: Cotizacion }) {
  const router = useRouter();
  const [monto, setMonto] = useState("");
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  const archivos = [...c.fotos, ...c.documentos];

  async function guardar() {
    const m = parseFloat(monto);
    if (!Number.isFinite(m) || m <= 0) return;
    setGuardando(true);
    try {
      await responderAvaluoMecanico(c.id, m, comentario.trim() || null);
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <li className="space-y-3 px-5 py-4">
      <div>
        <p className="font-medium text-foreground">{c.descripcion}{c.modelo ? ` (${c.modelo})` : ""}</p>
        <p className="text-xs text-muted">
          {[c.marca, c.submarca, c.placas, c.serie, c.kilometraje ? `${c.kilometraje} km` : null].filter(Boolean).join(" · ") || "—"}
        </p>
        <p className="mt-1 text-sm text-foreground">
          Valor de referencia (Facebook): <strong>{c.busquedaFacebook ? formatMXN(c.busquedaFacebook) : "sin dato"}</strong>
          <span className="ml-2 text-xs text-muted">· solicitado {formatFecha(c.creadoEn)}</span>
        </p>
      </div>

      {archivos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {archivos.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-surface-2 px-3 py-1 text-xs font-medium hover:bg-surface">
              📎 archivo {i + 1}
            </a>
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input type="number" step="0.01" placeholder="Tu avalúo (MXN)" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputCls} />
        <input placeholder="Comentario: estado, fallas, detalles…" value={comentario} onChange={(e) => setComentario(e.target.value)} className={inputCls} />
        <button type="button" onClick={guardar} disabled={guardando || !monto} className="rounded-lg bg-success px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          {guardando ? "Enviando…" : "Enviar avalúo"}
        </button>
      </div>
    </li>
  );
}
