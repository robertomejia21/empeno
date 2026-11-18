"use client";

// Simulador rápido de mostrador: "¿cuánto pago por $10,000?". Con solo el monto
// y el producto (tasa) muestra el refrendo mensual y el desempeño, sin capturar
// cliente ni prenda. Usa las mismas reglas que calcularLiquidacion (interés +
// almacenaje por periodo, más IVA sobre ambos).
import { useState } from "react";
import { Calculator } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";
import { CargosEditor } from "@/components/CargosEditor";
import { IVA_FIJO, PRESETS_CARGOS } from "@/lib/interes";
import type { ProductoInteres } from "@/lib/types";

const inputCls =
  "w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-2 focus:outline-none focus:ring-2 focus:ring-primary-2/20";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SimuladorRapido({ productos: _productos }: { productos: ProductoInteres[] }) {
  const auto = PRESETS_CARGOS[0];
  const [monto, setMonto] = useState("10000");
  const [interes, setInteres] = useState(auto.interes);
  const [almacenaje, setAlmacenaje] = useState(auto.almacenaje);
  const [meses, setMeses] = useState("1");

  const capital = parseFloat(monto.replace(/,/g, "")) || 0;
  const n = Math.max(1, Math.round(parseFloat(meses) || 1));

  return (
    <Card>
      <CardHeader
        title="Simulador rápido"
        subtitle="¿Cuánto paga el cliente? Solo monto y tipo de empeño, sin capturar nada más"
      />
      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:max-w-xl">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Monto del préstamo</span>
            <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Meses para liquidar</span>
            <input value={meses} onChange={(e) => setMeses(e.target.value)} inputMode="numeric" className={inputCls} />
          </label>
        </div>
        <CargosEditor
          monto={capital}
          interes={interes}
          almacenaje={almacenaje}
          ivaPct={IVA_FIJO}
          periodos={n}
          onChange={(i, a) => {
            setInteres(i);
            setAlmacenaje(a);
          }}
        />
        {capital <= 0 && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Calculator className="h-4 w-4" aria-hidden /> Escribe un monto para ver el refrendo y el desempeño.
          </p>
        )}
      </div>
    </Card>
  );
}
