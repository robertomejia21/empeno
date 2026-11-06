"use client";

// Simulador rápido de mostrador: "¿cuánto pago por $10,000?". Con solo el monto
// y el producto (tasa) muestra el refrendo mensual y el desempeño, sin capturar
// cliente ni prenda. Usa las mismas reglas que calcularLiquidacion (interés +
// almacenaje por periodo, más IVA sobre ambos).
import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";
import { formatMXN } from "@/lib/format";
import { IVA_FIJO, requiereAutorizacionTasa } from "@/lib/interes";
import type { ProductoInteres } from "@/lib/types";

const inputCls =
  "w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-2 focus:outline-none focus:ring-2 focus:ring-primary-2/20";

interface Opcion {
  id: string;
  etiqueta: string;
  tasa: number;
  almacenaje: number;
}

/** Tasas dictadas por la sucursal; se usan si el catálogo de /configuracion está vacío. */
const RESPALDO: Opcion[] = [
  { id: "veh-1080", etiqueta: "VEHÍCULOS — 10.8%", tasa: 10.8, almacenaje: 0 },
  { id: "veh-864", etiqueta: "VEHÍCULOS (+3 empeños) — 8.64%", tasa: 8.64, almacenaje: 0 },
  { id: "veh-648", etiqueta: "VEHÍCULOS — 6.48% · requiere autorización", tasa: 6.48, almacenaje: 0 },
  { id: "art-2160", etiqueta: "ARTÍCULOS (electrónicos, herramienta, alhajas…) — 21.6%", tasa: 10.8, almacenaje: 10.8 },
];

/** Vehículos y GPS no cargan almacenaje; en artículos el almacenaje es igual al interés. */
function opciones(productos: ProductoInteres[]): Opcion[] {
  const desdeCatalogo = productos
    .filter((p) => p.activo && p.periodo === "mensual" && p.tipo === "tradicional")
    .map((p) => {
      const esVehiculo = p.modalidad !== null;
      const almacenaje = esVehiculo ? 0 : p.tasa;
      const total = p.tasa + almacenaje;
      const nombre = p.modalidad === "gps" ? `${p.nombre} (GPS)` : p.nombre;
      return {
        id: p.id,
        etiqueta: `${nombre} — ${Number(total.toFixed(2))}%${requiereAutorizacionTasa(p.tasa) ? " · requiere autorización" : ""}`,
        tasa: p.tasa,
        almacenaje,
      };
    });
  return desdeCatalogo.length > 0 ? desdeCatalogo : RESPALDO;
}

export function SimuladorRapido({ productos }: { productos: ProductoInteres[] }) {
  const ops = useMemo(() => opciones(productos), [productos]);
  const [monto, setMonto] = useState("10000");
  const [opId, setOpId] = useState(ops.find((o) => o.almacenaje === 0)?.id ?? ops[0]?.id ?? "");
  const [meses, setMeses] = useState("1");

  const op = ops.find((o) => o.id === opId);
  const capital = parseFloat(monto.replace(/,/g, "")) || 0;
  const n = Math.max(1, Math.round(parseFloat(meses) || 1));

  const interes = op ? capital * (op.tasa / 100) : 0;
  const almacenaje = op ? capital * (op.almacenaje / 100) : 0;
  const iva = (interes + almacenaje) * (IVA_FIJO / 100);
  const refrendo = interes + almacenaje + iva;
  const desempeno = capital + refrendo * n;

  return (
    <Card>
      <CardHeader
        title="Simulador rápido"
        subtitle="¿Cuánto paga el cliente? Solo monto y tipo de empeño, sin capturar nada más"
      />
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <label className="flex flex-col gap-1.5 sm:col-span-1">
            <span className="text-sm font-medium text-foreground">Monto del préstamo</span>
            <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-1 xl:col-span-1">
            <span className="text-sm font-medium text-foreground">Tipo / tasa mensual</span>
            <select value={opId} onChange={(e) => setOpId(e.target.value)} className={inputCls}>
              {ops.map((o) => (
                <option key={o.id} value={o.id}>{o.etiqueta}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Meses para liquidar</span>
            <input value={meses} onChange={(e) => setMeses(e.target.value)} inputMode="numeric" className={inputCls} />
          </label>
        </div>

        {op && capital > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-primary/30 bg-primary-soft/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Refrendo mensual</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{formatMXN(refrendo)}</p>
              <p className="mt-1 text-xs text-muted">
                Interés {formatMXN(interes)}
                {almacenaje > 0 && ` + almacenaje ${formatMXN(almacenaje)}`} + IVA {IVA_FIJO}% {formatMXN(iva)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Desempeño {n === 1 ? "al mes" : `a los ${n} meses`}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{formatMXN(desempeno)}</p>
              <p className="mt-1 text-xs text-muted">
                Préstamo {formatMXN(capital)} + {n} {n === 1 ? "mes" : "meses"} de cargos
              </p>
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Calculator className="h-4 w-4" aria-hidden /> Escribe un monto para ver el refrendo y el desempeño.
          </p>
        )}
      </div>
    </Card>
  );
}
