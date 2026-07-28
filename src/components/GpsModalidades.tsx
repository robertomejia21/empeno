import { formatMXN, formatPorcentaje } from "@/lib/format";
import type { ResumenGps } from "@/lib/gps";

export function GpsModalidades({ resumen }: { resumen: ResumenGps }) {
  const cards = [
    { titulo: "GPS", icono: "📡", data: resumen.gps, tono: "info" as const, sub: "El cliente conserva el vehículo con GPS" },
    { titulo: "Resguardo", icono: "🏢", data: resumen.resguardo, tono: "primary" as const, sub: "Vehículo en nuestra bóveda/patio" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((c) => (
        <div key={c.titulo} className="shadow-soft rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="text-lg">{c.icono}</span> Modalidad {c.titulo}
              </p>
              <p className="mt-0.5 text-xs text-muted">{c.sub}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                c.tono === "info" ? "bg-info-soft text-info" : "bg-primary-soft text-primary"
              }`}
            >
              {formatPorcentaje(c.data.pct)} del total
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[32px] font-bold leading-none tracking-tight text-foreground">{c.data.cantidad}</p>
              <p className="mt-1 text-xs text-muted">contratos activos</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums text-foreground">{formatMXN(c.data.montoPrestado)}</p>
              <p className="text-xs text-muted">prestado</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
