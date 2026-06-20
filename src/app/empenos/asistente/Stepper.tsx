"use client";

import { PASOS } from "./pasos";

export function Stepper({ actual }: { actual: number }) {
  const def = PASOS[actual - 1];

  return (
    <div className="mb-6">
      {/* Barra de pasos (escritorio) */}
      <ol className="hidden items-center md:flex">
        {PASOS.map((p, i) => {
          const completado = p.n < actual;
          const activo = p.n === actual;
          return (
            <li key={p.n} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white transition"
                  style={{
                    backgroundColor: completado || activo ? p.color : "#d6d3d1",
                    boxShadow: activo ? `0 0 0 4px ${p.color}33` : undefined,
                  }}
                >
                  {completado ? "✓" : p.n}
                </span>
              </div>
              {i < PASOS.length - 1 && (
                <span
                  className="mx-1 h-0.5 flex-1 rounded transition"
                  style={{ backgroundColor: p.n < actual ? p.color : "#e7e5e4" }}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Encabezado del paso actual */}
      <div className="mt-4 flex items-center gap-3 md:mt-5">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl text-xl text-white"
          style={{ backgroundColor: def.color }}
        >
          {def.icono}
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: def.color }}>
            Paso {def.n} de {PASOS.length}
          </p>
          <h2 className="text-lg font-bold text-foreground">{def.titulo}</h2>
          <p className="text-sm text-muted">{def.descripcion}</p>
        </div>
      </div>

      {/* Barra de progreso (móvil) */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border md:hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(actual / PASOS.length) * 100}%`, backgroundColor: def.color }}
        />
      </div>
    </div>
  );
}
