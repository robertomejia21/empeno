// Gráficas en SVG puro (sin dependencias externas).

const mxnCompact = new Intl.NumberFormat("es-MX", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export interface BarraMes {
  mes: string; // etiqueta corta, ej "ene"
  ingresos: number;
  egresos: number;
}

/** Gráfica de barras agrupadas: ingresos vs egresos por mes. */
export function BarrasIngresoEgreso({ datos }: { datos: BarraMes[] }) {
  const max = Math.max(1, ...datos.flatMap((d) => [d.ingresos, d.egresos]));
  const W = 520;
  const H = 220;
  const padX = 36;
  const padY = 24;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const grupo = innerW / datos.length;
  const barW = Math.min(18, grupo / 3);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[460px]">
        {/* líneas guía */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padY + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={4} y={y + 3} fontSize={9} fill="var(--muted)">
                {mxnCompact.format(max * t)}
              </text>
            </g>
          );
        })}
        {datos.map((d, i) => {
          const x0 = padX + grupo * i + grupo / 2;
          const hi = (d.ingresos / max) * innerH;
          const he = (d.egresos / max) * innerH;
          return (
            <g key={i}>
              <rect
                x={x0 - barW - 2}
                y={padY + innerH - hi}
                width={barW}
                height={hi}
                rx={2}
                fill="var(--success)"
              />
              <rect
                x={x0 + 2}
                y={padY + innerH - he}
                width={barW}
                height={he}
                rx={2}
                fill="var(--danger)"
              />
              <text x={x0} y={H - 6} fontSize={10} fill="var(--muted)" textAnchor="middle">
                {d.mes}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--success)" }} /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--danger)" }} /> Egresos
        </span>
      </div>
    </div>
  );
}

export interface SegmentoDona {
  etiqueta: string;
  valor: number;
  color: string;
}

/** Gráfica de dona para distribución (ej. cartera por estado). */
export function Dona({ segmentos }: { segmentos: SegmentoDona[] }) {
  const total = Math.max(1, segmentos.reduce((s, x) => s + x.valor, 0));
  const R = 60;
  const r = 38;
  const cx = 80;
  const cy = 80;
  let acc = 0;

  function arco(frac0: number, frac1: number) {
    const a0 = frac0 * 2 * Math.PI - Math.PI / 2;
    const a1 = frac1 * 2 * Math.PI - Math.PI / 2;
    const large = frac1 - frac0 > 0.5 ? 1 : 0;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1);
    const xi0 = cx + r * Math.cos(a0), yi0 = cy + r * Math.sin(a0);
    return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${r} ${r} 0 ${large} 0 ${xi0} ${yi0} Z`;
  }

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 160 160" className="h-36 w-36 shrink-0">
        {segmentos.filter((s) => s.valor > 0).map((s, i) => {
          const f0 = acc / total;
          acc += s.valor;
          const f1 = acc / total;
          return <path key={i} d={arco(f0, f1)} fill={s.color} />;
        })}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segmentos.map((s) => (
          <li key={s.etiqueta} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-muted">{s.etiqueta}</span>
            <span className="font-medium text-foreground">{s.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
