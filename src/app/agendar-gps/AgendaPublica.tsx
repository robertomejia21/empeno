"use client";

import { useMemo, useState } from "react";
import { agendarCitaGps } from "@/lib/actions";
import { HORARIOS_GPS } from "@/lib/citas";
import { hoyISO, formatFecha } from "@/lib/format";
import type { CitaGps } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

export function AgendaPublica({
  citas,
  sucursal,
}: {
  citas: CitaGps[];
  sucursal: { nombre: string; direccion: string };
}) {
  const [fecha, setFecha] = useState(hoyISO());
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ clienteNombre: "", telefono: "", vehiculo: "" });
  const [sitioWeb, setSitioWeb] = useState(""); // honeypot — un humano nunca llena esto
  const [msg, setMsg] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmada, setConfirmada] = useState<{ fecha: string; hora: string } | null>(null);

  const ocupados = useMemo(
    () => new Set(citas.filter((c) => c.fecha === fecha && c.estado !== "cancelada").map((c) => c.hora)),
    [citas, fecha]
  );

  async function reservar() {
    if (!slot) return;
    if (!form.clienteNombre.trim() || !form.telefono.trim()) {
      setMsg("Escribe tu nombre y teléfono para confirmar.");
      return;
    }
    setGuardando(true);
    setMsg(null);
    try {
      const r = await agendarCitaGps({
        fecha,
        hora: slot,
        clienteNombre: form.clienteNombre.trim(),
        telefono: form.telefono.trim(),
        vehiculo: form.vehiculo.trim() || null,
        notas: "Agendada por el cliente",
        honeypot: sitioWeb,
      });
      if (!r.ok) {
        setMsg(r.error ?? "No se pudo agendar. Intenta otro horario.");
        return;
      }
      setConfirmada({ fecha, hora: slot });
    } finally {
      setGuardando(false);
    }
  }

  if (confirmada) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl">✅</div>
        <h2 className="text-lg font-semibold text-foreground">¡Cita confirmada!</h2>
        <p className="mt-2 text-sm text-muted">
          Te esperamos el <strong className="text-foreground">{formatFecha(confirmada.fecha)}</strong> a las{" "}
          <strong className="text-foreground">{confirmada.hora} hrs</strong>.
        </p>
        <p className="mt-1 text-sm text-muted">📍 {sucursal.nombre} — {sucursal.direccion}</p>
        <p className="mt-3 text-xs text-muted">Te enviamos la confirmación por WhatsApp al número que registraste.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-foreground">1. Elige el día</p>
      <input type="date" min={hoyISO()} value={fecha} onChange={(e) => { setFecha(e.target.value); setSlot(null); }} className={`${inputCls} mt-2`} />

      <p className="mt-5 text-sm font-medium text-foreground">2. Elige la hora (8:00 a 16:00)</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {HORARIOS_GPS.map((h) => {
          const taken = ocupados.has(h);
          const activo = slot === h;
          return (
            <button
              key={h}
              type="button"
              disabled={taken}
              onClick={() => setSlot(h)}
              className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                taken
                  ? "cursor-not-allowed border-border bg-surface-2 text-muted line-through"
                  : activo
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-surface text-foreground hover:border-primary hover:bg-primary-soft"
              }`}
            >
              {h}
            </button>
          );
        })}
      </div>

      {slot && (
        <div className="mt-5 space-y-3">
          {/* Honeypot: invisible para una persona, un bot que llena todo lo llena. */}
          <input
            type="text"
            value={sitioWeb}
            onChange={(e) => setSitioWeb(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px]"
          />
          <p className="text-sm font-medium text-foreground">3. Tus datos</p>
          <input placeholder="Nombre completo" value={form.clienteNombre} onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })} className={inputCls} />
          <input placeholder="Teléfono (WhatsApp)" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className={inputCls} />
          <input placeholder="Vehículo (marca, modelo, placas)" value={form.vehiculo} onChange={(e) => setForm({ ...form, vehiculo: e.target.value })} className={inputCls} />
          {msg && <p className="text-sm text-danger">{msg}</p>}
          <button
            type="button"
            onClick={reservar}
            disabled={guardando}
            className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-fg hover:opacity-90 disabled:opacity-50"
          >
            {guardando ? "Agendando…" : `Confirmar cita · ${formatFecha(fecha)} ${slot}`}
          </button>
        </div>
      )}
    </div>
  );
}
