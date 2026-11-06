"use client";

// Revisión semanal (viernes): por cada vehículo en resguardo se sube un video
// 360° (o fotos) para compararlo con cómo ingresó. Si a la semana le falta la
// revisión de alguna unidad, aparece como pendiente (en rojo desde el viernes).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2, TriangleAlert, Upload, Video } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";
import { crearSubidaChecklist, guardarChecklistSemanal } from "@/lib/actions";
import type { ChecklistSemanal as Registro, Prenda } from "@/lib/types";

const inputCls =
  "w-full min-w-0 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs outline-none focus:border-primary-2 focus:bg-surface";

function nombreVehiculo(v: Prenda) {
  return [v.marca, v.submarca, v.modelo].filter(Boolean).join(" ") || v.descripcion;
}

export function ChecklistSemanal({
  vehiculos,
  registros,
  semana,
  esDiaLimite,
  responsableDefault,
}: {
  vehiculos: Prenda[];
  registros: Registro[];
  semana: string;
  esDiaLimite: boolean;
  responsableDefault: string;
}) {
  const hechos = new Map(registros.filter((r) => r.semana === semana).map((r) => [r.prendaId, r]));
  const pendientes = vehiculos.filter((v) => !hechos.has(v.id)).length;
  const [, d, m] = [0, semana.slice(8, 10), semana.slice(5, 7)];

  return (
    <Card className="mt-6">
      <CardHeader
        title={`Revisión semanal · viernes ${d}/${m}`}
        subtitle="Video 360° o fotos de cada vehículo en resguardo, para compararlo con cómo ingresó"
      />
      <div className="space-y-3 p-4 sm:p-6">
        {pendientes > 0 ? (
          <p className={`flex items-center gap-1.5 text-sm font-medium ${esDiaLimite ? "text-danger" : "text-warning"}`}>
            <TriangleAlert className="h-4 w-4" aria-hidden /> {pendientes} vehículo(s) sin revisión semanal
            {esDiaLimite ? " — hoy es el día límite" : " — vence el viernes"}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm font-medium text-success">
            <CircleCheck className="h-4 w-4" aria-hidden /> Todas las unidades tienen su revisión de esta semana.
          </p>
        )}
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {vehiculos.map((v) => (
            <TarjetaVehiculo
              key={v.id}
              v={v}
              hecho={hechos.get(v.id) ?? null}
              semana={semana}
              urgente={esDiaLimite}
              responsableDefault={responsableDefault}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function TarjetaVehiculo({
  v,
  hecho,
  semana,
  urgente,
  responsableDefault,
}: {
  v: Prenda;
  hecho: Registro | null;
  semana: string;
  urgente: boolean;
  responsableDefault: string;
}) {
  const router = useRouter();
  const [archivos, setArchivos] = useState<string[]>([]);
  const [responsable, setResponsable] = useState(responsableDefault);
  const [obs, setObs] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subir(files: FileList | null) {
    if (!files?.length) return;
    setSubiendo(true);
    setError(null);
    try {
      for (const f of Array.from(files)) {
        const prep = await crearSubidaChecklist(v.id, f.name);
        if (!prep.ok) throw new Error(prep.error);
        const res = await fetch(prep.urlSubida, {
          method: "PUT",
          headers: { "Content-Type": f.type || "application/octet-stream", "x-upsert": "false" },
          body: f,
        });
        if (!res.ok) throw new Error(`No se pudo subir ${f.name} (${res.status}).`);
        setArchivos((a) => [...a, prep.urlPublica]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir.");
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    setError(null);
    const r = await guardarChecklistSemanal({ prendaId: v.id, semana, responsable, archivos, observaciones: obs || null });
    if (!r.ok) setError(r.error ?? "No se pudo guardar.");
    else router.refresh();
  }

  const borde = hecho ? "border-success/40" : urgente ? "border-danger/50 bg-danger-soft/30" : "border-warning/40";

  return (
    <div className={`min-w-0 rounded-xl border bg-surface p-4 ${borde}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-foreground">
            {v.folio} · {nombreVehiculo(v)}
          </p>
          <p className="text-xs text-muted">{v.placas ?? "sin placas"}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            hecho ? "bg-success-soft text-success" : urgente ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
          }`}
        >
          {hecho ? "Hecho" : "Pendiente"}
        </span>
      </div>

      {hecho ? (
        <div className="mt-2 space-y-1 text-xs text-muted">
          <p>
            {hecho.responsable} · {hecho.archivos.length} archivo(s)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {hecho.archivos.map((u, i) => (
              <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-info hover:bg-surface-2">
                <Video className="h-3 w-3" aria-hidden /> {i + 1}
              </a>
            ))}
          </div>
          {hecho.observaciones && <p className="text-foreground">{hecho.observaciones}</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-fg">
            {subiendo ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Upload className="h-3.5 w-3.5" aria-hidden />}
            {subiendo ? "Subiendo…" : "Subir video / fotos"}
            <input type="file" accept="video/*,image/*" multiple capture="environment" className="hidden" disabled={subiendo} onChange={(e) => subir(e.target.files)} />
          </label>
          {archivos.length > 0 && <p className="text-xs text-success">{archivos.length} archivo(s) listos</p>}
          <input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Responsable" className={inputCls} />
          <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones / cambios vs. ingreso (opcional)" className={inputCls} />
          <button
            type="button"
            onClick={guardar}
            disabled={subiendo || archivos.length === 0 || !responsable.trim()}
            className="w-full rounded-lg border border-primary/40 bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50"
          >
            Guardar revisión de la semana
          </button>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
