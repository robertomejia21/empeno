"use client";

import { Check } from "lucide-react";
import { PASOS } from "./pasos";

export function Stepper({ actual }: { actual: number }) {
  const def = PASOS[actual - 1];
  const Icono = def.icono;

  return (
    <div className="mb-6">
      {/* Barra de pasos (escritorio) */}
      <ol className="hidden items-center md:flex">
        {PASOS.map((p, i) => {
          const completado = p.n < actual;
          const activo = p.n === actual;
          return (
            <li key={p.n} className="flex flex-1 items-center last:flex-none">
              <span
                title={p.titulo}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                  completado
                    ? "bg-primary text-primary-fg"
                    : activo
                      ? "bg-primary text-primary-fg ring-4 ring-primary/20"
                      : "border border-border bg-surface text-muted"
                }`}
              >
                {completado ? <Check className="h-4 w-4" aria-hidden /> : p.n}
              </span>
              {i < PASOS.length - 1 && (
                <span
                  className={`mx-1 h-0.5 flex-1 rounded transition ${p.n < actual ? "bg-primary" : "bg-border"}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Encabezado del paso actual */}
      <div className="mt-4 flex items-center gap-3 md:mt-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icono className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Paso {def.n} de {PASOS.length}
          </p>
          <h2 className="text-lg font-bold tracking-tight text-foreground">{def.titulo}</h2>
          <p className="text-sm text-muted">{def.descripcion}</p>
        </div>
      </div>

      {/* Barra de progreso (móvil) */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border md:hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(actual / PASOS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
