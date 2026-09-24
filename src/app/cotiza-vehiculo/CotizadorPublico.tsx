"use client";

import { useState } from "react";
import { crearCotizacionPublica } from "@/lib/actions";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

export function CotizadorPublico() {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    descripcion: "",
    marca: "",
    modelo: "",
    montoSolicitado: "",
  });
  const [sitioWeb, setSitioWeb] = useState(""); // honeypot — un humano nunca llena esto
  const [msg, setMsg] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [folio, setFolio] = useState<string | null>(null);

  async function enviar() {
    setMsg(null);
    const monto = parseFloat(form.montoSolicitado);
    setEnviando(true);
    try {
      const r = await crearCotizacionPublica({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        descripcion: form.descripcion.trim(),
        marca: form.marca.trim() || null,
        modelo: form.modelo.trim() || null,
        montoSolicitado: Number.isFinite(monto) ? monto : 0,
        honeypot: sitioWeb,
      });
      if (!r.ok) {
        setMsg(r.error ?? "No se pudo enviar. Intenta de nuevo.");
        return;
      }
      // Si el honeypot atrapó un bot, r.ok viene en true sin folio (se finge
      // éxito a propósito) — mostramos la misma pantalla de éxito siempre,
      // para no delatar que se detectó.
      setFolio(r.folio ?? null);
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl">✅</div>
        <h2 className="text-lg font-semibold text-foreground">¡Recibimos tu solicitud!</h2>
        <p className="mt-2 text-sm text-muted">
          {folio && (
            <>
              Folio <strong className="text-foreground">{folio}</strong>.{" "}
            </>
          )}
          Te contactaremos por WhatsApp para agendar la evaluación de tu vehículo.
        </p>
        <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
          Este monto es un aproximado y está sujeto a evaluación física del vehículo.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <p className="mb-4 rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
        Cuéntanos de tu vehículo y cuánto necesitas — el monto final se confirma cuando lo evaluemos en sucursal.
      </p>

      <div className="space-y-3">
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
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Marca (ej. Nissan)"
            value={form.marca}
            onChange={(e) => setForm({ ...form, marca: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder="Año / modelo"
            value={form.modelo}
            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            className={inputCls}
          />
        </div>
        <input
          placeholder="Descripción del vehículo (ej. Versa 2020 sedán)"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          className={inputCls}
        />
        <input
          type="number"
          placeholder="¿Cuánto necesitas aproximadamente? (MXN)"
          value={form.montoSolicitado}
          onChange={(e) => setForm({ ...form, montoSolicitado: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="Tu nombre completo"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="Teléfono (WhatsApp)"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          className={inputCls}
        />
        {msg && <p className="text-sm text-danger">{msg}</p>}
        <button
          type="button"
          onClick={enviar}
          disabled={enviando}
          className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-fg hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? "Enviando…" : "Cotizar mi vehículo"}
        </button>
        <p className="text-center text-[11px] text-muted">
          Es un estimado preliminar, sujeto a evaluación del vehículo en sucursal.
        </p>
      </div>
    </div>
  );
}
