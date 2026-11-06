"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarChecklistVehicular } from "@/lib/actions";
import { Check, CircleCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";
import type { Prenda, FilaChecklistVehiculo } from "@/lib/types";
import {
  PUNTOS_REVISION,
  CALIFICACIONES_REVISION,
  CALIFICACION_ETIQUETA,
  RESPONSABLE_CHECKLIST_DEFAULT,
  type PuntoRevision,
  type CalificacionRevision,
} from "@/lib/checklist";

type ClaveItem = keyof Omit<FilaChecklistVehiculo, "prendaId" | "observaciones" | "revision">;

const ITEMS: { clave: ClaveItem; label: string }[] = [
  { clave: "presente", label: "Presente" },
  { clave: "exterior", label: "Exterior" },
  { clave: "interior", label: "Interior" },
  { clave: "llantas", label: "Llantas" },
  { clave: "fugas", label: "Sin fugas" },
  { clave: "cerradoSeguro", label: "Cerrado/Seguro" },
  { clave: "llaves", label: "Llaves" },
  { clave: "bateria", label: "Batería" },
  { clave: "carroceria", label: "Carrocería" },
];

function filaVacia(prendaId: string): FilaChecklistVehiculo {
  return {
    prendaId,
    presente: false,
    exterior: false,
    interior: false,
    llantas: false,
    fugas: false,
    cerradoSeguro: false,
    llaves: false,
    bateria: false,
    carroceria: false,
    observaciones: null,
  };
}

export function ChecklistVehiculosForm({ vehiculos }: { vehiculos: Prenda[] }) {
  const router = useRouter();
  const [responsable, setResponsable] = useState(RESPONSABLE_CHECKLIST_DEFAULT);
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});
  const [incidencias, setIncidencias] = useState("");
  const [filas, setFilas] = useState<Record<string, FilaChecklistVehiculo>>(
    Object.fromEntries(vehiculos.map((v) => [v.id, filaVacia(v.id)]))
  );
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  function toggle(prendaId: string, clave: ClaveItem) {
    setFilas((s) => ({ ...s, [prendaId]: { ...s[prendaId], [clave]: !s[prendaId][clave] } }));
  }

  function calificar(prendaId: string, punto: PuntoRevision, cal: CalificacionRevision) {
    setFilas((s) => {
      const actual = s[prendaId].revision ?? {};
      const revision = { ...actual, [punto]: actual[punto] === cal ? undefined : cal };
      return { ...s, [prendaId]: { ...s[prendaId], revision } };
    });
  }

  function setObs(prendaId: string, texto: string) {
    setFilas((s) => ({ ...s, [prendaId]: { ...s[prendaId], observaciones: texto || null } }));
  }

  async function guardar() {
    if (!responsable.trim()) return;
    setGuardando(true);
    try {
      await guardarChecklistVehicular(responsable, Object.values(filas), incidencias || null);
      setGuardado(true);
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  if (guardado) {
    return (
      <Card className="border-success/30 bg-success-soft p-6 text-center">
        <p className="inline-flex flex-wrap items-center justify-center gap-1.5 font-medium text-success">
          <CircleCheck className="h-5 w-5" aria-hidden /> Checklist guardado — {vehiculos.length} vehículo(s) revisados.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Vehículos a revisar hoy" subtitle={`${vehiculos.length} en resguardo`} />
      <div className="space-y-4 p-4 sm:p-6">
        <label className="flex max-w-xl flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Responsable *</span>
          <input
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Nombre de quien hace la revisión"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary-2 focus:bg-surface focus:ring-2 focus:ring-primary-2/20"
          />
        </label>

        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {vehiculos.map((v) => (
            <div key={v.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
              <p className="break-words text-sm font-semibold text-foreground">
                {v.folio} · {[v.marca, v.submarca, v.modelo].filter(Boolean).join(" ") || v.descripcion}
              </p>
              <p className="text-xs text-muted">{v.placas ?? "sin placas"}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ITEMS.map((it) => {
                  const activo = filas[v.id]?.[it.clave] as boolean;
                  return (
                    <button
                      key={it.clave}
                      type="button"
                      onClick={() => toggle(v.id, it.clave)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        activo ? "border-success bg-success-soft text-success" : "border-border bg-surface text-muted hover:bg-surface-2"
                      }`}
                    >
                      {activo && <Check className="h-3.5 w-3.5" aria-hidden />}
                      {it.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setAbiertos((s) => ({ ...s, [v.id]: !s[v.id] }))}
                className="mt-2 text-xs font-medium text-info hover:underline"
              >
                {abiertos[v.id] ? "Ocultar revisión B/R/M" : "Revisión B/R/M (aceite, frenos, luces…)"}
              </button>
              {abiertos[v.id] && (
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {PUNTOS_REVISION.map((punto) => (
                    <div key={punto} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2/60 px-2 py-1">
                      <span className="text-xs text-foreground">{punto}</span>
                      <span className="flex gap-1">
                        {CALIFICACIONES_REVISION.map((cal) => {
                          const sel = filas[v.id]?.revision?.[punto] === cal;
                          const tono = cal === "B" ? "border-success bg-success-soft text-success" : cal === "R" ? "border-warning bg-warning-soft text-warning" : "border-danger bg-danger-soft text-danger";
                          return (
                            <button
                              key={cal}
                              type="button"
                              title={CALIFICACION_ETIQUETA[cal]}
                              onClick={() => calificar(v.id, punto, cal)}
                              className={`h-6 w-6 rounded-md border text-[11px] font-semibold transition ${sel ? tono : "border-border bg-surface text-muted hover:bg-surface-2"}`}
                            >
                              {cal}
                            </button>
                          );
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <input
                value={filas[v.id]?.observaciones ?? ""}
                onChange={(e) => setObs(v.id, e.target.value)}
                placeholder="Observaciones (opcional)"
                className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-primary-2 focus:bg-surface"
              />
            </div>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Incidencias detectadas</span>
          <textarea
            value={incidencias}
            onChange={(e) => setIncidencias(e.target.value)}
            rows={3}
            placeholder="Describe cualquier incidencia general del día…"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary-2 focus:bg-surface focus:ring-2 focus:ring-primary-2/20"
          />
        </label>

        <button
          type="button"
          onClick={guardar}
          disabled={guardando || !responsable.trim()}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-soft transition hover:brightness-105 disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar checklist del día"}
        </button>
      </div>
    </Card>
  );
}
