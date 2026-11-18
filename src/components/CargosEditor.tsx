"use client";

// Captura de cargos por periodo (interés, almacenaje/resguardo e IVA), con el
// mismo desglose que la boleta del sistema anterior:
//   Importe del mutuo · Intereses · Almacenaje · IVA · Por refrendo · Por desempeño
// Cada concepto se puede escribir a mano en % o en pesos; los chips precargan
// los montos típicos según el tipo de bien (automóvil o artículo).
import { useState } from "react";
import { Lock } from "lucide-react";
import { formatMXN } from "@/lib/format";
import { PRESETS_CARGOS, tasaEfectiva, type PresetCargos } from "@/lib/interes";

const inputCls =
  "w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

/** Input numérico que conserva lo que se teclea ("5.", "0.") mientras tiene el foco. */
function NumInput({
  value,
  onChange,
  disabled,
  prefijo,
  sufijo,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  prefijo?: string;
  sufijo?: string;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="relative">
      {prefijo && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{prefijo}</span>}
      <input
        aria-label={ariaLabel}
        inputMode="decimal"
        disabled={disabled}
        value={draft ?? (Number.isFinite(value) ? String(value) : "")}
        onFocus={() => setDraft(String(value))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9.]/g, "");
          setDraft(t);
          onChange(parseFloat(t) || 0);
        }}
        className={`${inputCls} tabular-nums ${prefijo ? "pl-7" : ""} ${sufijo ? "pr-8" : ""}`}
      />
      {sufijo && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{sufijo}</span>}
    </div>
  );
}

/** Un concepto (interés o almacenaje) editable en % o en $. */
function Concepto({
  titulo,
  pct,
  monto,
  onPct,
}: {
  titulo: string;
  pct: number;
  monto: number;
  onPct: (n: number) => void;
}) {
  const pesos = r2(monto * (pct / 100));
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{titulo}</p>
      <div className="grid grid-cols-2 gap-2">
        <NumInput ariaLabel={`${titulo} en porcentaje`} value={pct} sufijo="%" onChange={(n) => onPct(r4(n))} />
        <NumInput
          ariaLabel={`${titulo} en pesos`}
          value={pesos}
          prefijo="$"
          disabled={monto <= 0}
          onChange={(n) => onPct(monto > 0 ? r4((n / monto) * 100) : 0)}
        />
      </div>
    </div>
  );
}

export function CargosEditor({
  monto,
  interes,
  almacenaje,
  ivaPct,
  onChange,
  sugeridoId,
  periodos = 1,
  ocultarTotales = false,
  presets = PRESETS_CARGOS,
}: {
  monto: number;
  interes: number;
  almacenaje: number;
  ivaPct: number;
  onChange: (interes: number, almacenaje: number, preset?: PresetCargos) => void;
  /** Chip sugerido por el tipo de bien / historial (se marca como "sugerido"). */
  sugeridoId?: string;
  /** Periodos a sumar en "Por desempeño" (default 1). */
  periodos?: number;
  ocultarTotales?: boolean;
  presets?: PresetCargos[];
}) {
  const interesP = r2(monto * (interes / 100));
  const almacenajeP = r2(monto * (almacenaje / 100));
  const ivaP = r2((interesP + almacenajeP) * (ivaPct / 100));
  const refrendo = r2(interesP + almacenajeP + ivaP);
  const desempeno = r2(monto + refrendo * Math.max(1, periodos));
  const activo = presets.find((p) => p.interes === interes && p.almacenaje === almacenaje);

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted">Carga rápida por tipo de bien</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const sel = activo?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(p.interes, p.almacenaje, p)}
                className={`rounded-full border px-3 py-1.5 text-left text-sm transition ${
                  sel ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-foreground hover:border-primary/40"
                }`}
              >
                <span className="font-medium">{p.etiqueta}</span>{" "}
                <span className="text-xs text-muted">
                  {p.interes}% + {p.almacenaje}% + IVA = {tasaEfectiva(p.interes, p.almacenaje, ivaPct)}%
                </span>
                {p.requiereAutorizacion && <Lock className="ml-1 inline h-3 w-3 align-[-1px] text-warning" aria-label="Requiere autorización" />}
                {sugeridoId === p.id && <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-px text-[10px] font-semibold uppercase text-primary">sugerido</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Concepto titulo="Intereses" pct={interes} monto={monto} onPct={(n) => onChange(n, almacenaje)} />
        <Concepto titulo="Almacenaje (resguardo)" pct={almacenaje} monto={monto} onPct={(n) => onChange(interes, n)} />
        <div className="rounded-xl border border-border bg-surface-2/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">IVA {ivaPct}% (fijo)</p>
          <p className="py-2 text-sm font-semibold tabular-nums text-foreground">{formatMXN(ivaP)}</p>
          <p className="text-[11px] text-muted">Sobre intereses + almacenaje</p>
        </div>
      </div>

      {!ocultarTotales && monto > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] text-sm tabular-nums">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 text-right font-semibold">Importe</th>
                <th className="px-3 py-2 text-right font-semibold">Intereses</th>
                <th className="px-3 py-2 text-right font-semibold">Almacenaje</th>
                <th className="px-3 py-2 text-right font-semibold">IVA</th>
                <th className="px-3 py-2 text-right font-semibold text-primary">Por refrendo</th>
                <th className="px-3 py-2 text-right font-semibold">Por desempeño</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-3 py-2 text-right">{formatMXN(monto)}</td>
                <td className="px-3 py-2 text-right">{formatMXN(interesP)}</td>
                <td className="px-3 py-2 text-right">{formatMXN(almacenajeP)}</td>
                <td className="px-3 py-2 text-right">{formatMXN(ivaP)}</td>
                <td className="px-3 py-2 text-right font-semibold text-primary">{formatMXN(refrendo)}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatMXN(desempeno)}</td>
              </tr>
            </tbody>
          </table>
          <p className="border-t border-border px-3 py-1.5 text-[11px] text-muted">
            Tasa total {tasaEfectiva(interes, almacenaje, ivaPct)}% por periodo ({interes}% + {almacenaje}% + IVA {ivaPct}%)
          </p>
        </div>
      )}
    </div>
  );
}
