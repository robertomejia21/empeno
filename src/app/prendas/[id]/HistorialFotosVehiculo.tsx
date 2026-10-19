"use client";

import { useEffect, useRef, useState } from "react";
import { formatFechaHora } from "@/lib/format";
import { fechaDeFotoUrl } from "@/lib/fotos";

/** Historial del vehículo: siempre compara la primera foto contra la más reciente. */
export function HistorialFotosVehiculo({ fotos }: { fotos: string[] }) {
  const [abierto, setAbierto] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  if (fotos.length === 0) return null;

  const primera = fotos[0];
  const actual = fotos[fotos.length - 1];
  const mismaFoto = fotos.length === 1;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <FotoConFecha url={primera} etiqueta="Primera (ingreso)" />
        <FotoConFecha url={actual} etiqueta={mismaFoto ? "Única foto" : "Más reciente"} />
      </div>
      {fotos.length > 2 && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-3 text-sm font-medium text-info underline-offset-2 hover:underline"
        >
          Ver las {fotos.length} fotos por fecha →
        </button>
      )}

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="historial-fotos-titulo"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-5 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="historial-fotos-titulo" className="text-base font-semibold text-foreground">
                Historial de fotos del vehículo
              </h3>
              <button
                ref={cerrarRef}
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-lg border border-border px-2.5 py-1 text-sm text-muted hover:bg-surface-2"
              >
                ✕ Cerrar
              </button>
            </div>
            <div className="space-y-4">
              {fotos.map((url, i) => (
                <div key={url} className={i === 0 ? "rounded-xl border-2 border-primary p-2" : "rounded-xl border border-border p-2"}>
                  {i === 0 && (
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                      📌 Referencia fija — primera foto
                    </p>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full rounded-lg object-contain" />
                  <p className="mt-1.5 text-xs text-muted">{formatFechaHora(fechaDeFotoUrl(url)) || "Fecha no disponible"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FotoConFecha({ url, etiqueta }: { url: string; etiqueta: string }) {
  const fecha = fechaDeFotoUrl(url);
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={etiqueta} className="aspect-square w-full object-cover" />
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-foreground">{etiqueta}</p>
        <p className="text-[11px] text-muted">{fecha ? formatFechaHora(fecha) : "Fecha no disponible"}</p>
      </div>
    </div>
  );
}
