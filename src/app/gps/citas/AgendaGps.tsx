"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { agendarCitaGps, actualizarEstadoCitaGps } from "@/lib/actions";
import { HORARIOS_GPS } from "@/lib/citas";
import { hoyISO, formatFecha } from "@/lib/format";
import { Card, CardHeader, Badge } from "@/components/ui";
import type { CitaGps } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

export function AgendaGps({ citas }: { citas: CitaGps[] }) {
  const router = useRouter();
  const [fecha, setFecha] = useState(hoyISO());
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ clienteNombre: "", telefono: "", vehiculo: "", notas: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const ocupados = useMemo(() => {
    const m = new Map<string, CitaGps>();
    for (const c of citas) if (c.fecha === fecha && c.estado !== "cancelada") m.set(c.hora, c);
    return m;
  }, [citas, fecha]);

  const proximas = useMemo(
    () => citas.filter((c) => c.estado === "agendada" && c.fecha >= hoyISO()).slice(0, 30),
    [citas]
  );

  async function reservar() {
    if (!slot) return;
    setGuardando(true);
    setMsg(null);
    try {
      const r = await agendarCitaGps({
        fecha,
        hora: slot,
        clienteNombre: form.clienteNombre || null,
        telefono: form.telefono || null,
        vehiculo: form.vehiculo || null,
        notas: form.notas || null,
      });
      if (!r.ok) {
        setMsg(r.error ?? "No se pudo agendar.");
        return;
      }
      setSlot(null);
      setForm({ clienteNombre: "", telefono: "", vehiculo: "", notas: "" });
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Disponibilidad" subtitle="Horario de instalación: 8:00 a 16:00" />
        <div className="space-y-4 p-5">
          <div className="max-w-xs">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Fecha</label>
            <input type="date" min={hoyISO()} value={fecha} onChange={(e) => { setFecha(e.target.value); setSlot(null); }} className={inputCls} />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {HORARIOS_GPS.map((h) => {
              const cita = ocupados.get(h);
              const activo = slot === h;
              return (
                <button
                  key={h}
                  type="button"
                  disabled={!!cita}
                  onClick={() => setSlot(h)}
                  className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                    cita
                      ? "cursor-not-allowed border-border bg-surface-2 text-muted"
                      : activo
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-surface text-foreground hover:border-primary hover:bg-primary-soft"
                  }`}
                >
                  <span className="block">{h}</span>
                  <span className="block text-[10px] font-normal">{cita ? "Ocupado" : "Libre"}</span>
                </button>
              );
            })}
          </div>

          {slot && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary-soft/40 p-4">
              <p className="text-sm font-semibold text-foreground">
                Agendar cita · {formatFecha(fecha)} a las {slot}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input placeholder="Nombre del cliente" value={form.clienteNombre} onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })} className={inputCls} />
                <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className={inputCls} />
                <input placeholder="Vehículo (marca, placas…)" value={form.vehiculo} onChange={(e) => setForm({ ...form, vehiculo: e.target.value })} className={inputCls} />
                <input placeholder="Notas (opcional)" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className={inputCls} />
              </div>
              {msg && <p className="text-sm text-danger">{msg}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={reservar} disabled={guardando} className="rounded-lg bg-success px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                  {guardando ? "Agendando…" : "Confirmar cita"}
                </button>
                <button type="button" onClick={() => { setSlot(null); setMsg(null); }} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Próximas citas" subtitle={`${proximas.length} agendada(s)`} />
        {proximas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No hay citas agendadas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {proximas.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {formatFecha(c.fecha)} · {c.hora} — {c.clienteNombre ?? "—"}
                  </p>
                  <p className="text-xs text-muted">
                    {[c.vehiculo, c.telefono, c.notas].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tono="info">{c.hora}</Badge>
                  <button type="button" onClick={() => actualizarEstadoCitaGps(c.id, "completada").then(() => router.refresh())} className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-surface-2">
                    ✓ Completada
                  </button>
                  <button type="button" onClick={() => actualizarEstadoCitaGps(c.id, "cancelada").then(() => router.refresh())} className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-danger hover:bg-surface-2">
                    Cancelar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
