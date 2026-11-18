// Desglose línea por línea de lo que paga el cliente (refrendo o desempeño),
// para que quede claro cada monto. Los moratorios se calculan solos según las
// reglas del sistema y no se pueden borrar ni editar (se muestran con candado).
import { Lock } from "lucide-react";
import { formatMXN } from "@/lib/format";

export interface LineaCobro {
  concepto: string;
  monto: number;
  /** Se resta del total (abonos, descuento). */
  resta?: boolean;
  nota?: string;
  bloqueado?: boolean;
  /** Se muestra aunque sea 0. */
  siempre?: boolean;
}

export function DesgloseCobro({ lineas, total, titulo = "Total a pagar" }: { lineas: LineaCobro[]; total: number; titulo?: string }) {
  const visibles = lineas.filter((l) => l.siempre || l.monto > 0);
  return (
    <div className="rounded-lg border border-border bg-surface text-sm">
      <dl className="divide-y divide-border/60">
        {visibles.map((l) => (
          <div key={l.concepto} className="flex items-start justify-between gap-3 px-3 py-1.5">
            <dt className="min-w-0 text-muted">
              <span className="inline-flex items-center gap-1">
                {l.concepto}
                {l.bloqueado && <Lock className="h-3 w-3 text-warning" aria-label="Calculado por el sistema" />}
              </span>
              {l.nota && <span className="block text-[11px] leading-tight text-muted/80">{l.nota}</span>}
            </dt>
            <dd className={`shrink-0 text-right tabular-nums ${l.resta ? "text-success" : "text-foreground"}`}>
              {l.resta && l.monto > 0 ? "− " : ""}
              {formatMXN(l.monto)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-2/60 px-3 py-2">
        <span className="font-semibold text-foreground">{titulo}</span>
        <span className="text-lg font-bold tabular-nums text-primary">{formatMXN(total)}</span>
      </div>
    </div>
  );
}

/** Texto de la nota de moratorios: "6% por 4 días de atraso" o "Sin atraso". */
export function notaMoratorios(moratorios: number, diasAtraso: number, tasa: number): string {
  if (moratorios > 0) return `${tasa}% del préstamo · ${diasAtraso} día(s) hábil(es) de atraso`;
  return diasAtraso > 0 ? `Dentro de los días de gracia (${diasAtraso} día(s) de atraso)` : "Sin atraso";
}
