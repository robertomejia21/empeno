"use client";

import { useState } from "react";
import { formatMXN } from "@/lib/format";
import { TASA_MORATORIOS } from "@/lib/interes";
import { ConfirmSubmit } from "@/components/actions-ui";
import { DesgloseCobro, notaMoratorios } from "./DesgloseCobro";

const campoCls =
  "rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const EXTRAS = [
  ["gastosAdmin", "Gastos admin."],
  ["rentaGps", "Renta GPS"],
  ["rentaSeguro", "Renta seguro"],
  ["pension", "Pensión"],
  ["gastosVenta", "Gastos venta"],
] as const;
type Extra = (typeof EXTRAS)[number][0];

/**
 * Desempeño: préstamo + intereses + almacenaje + IVA + moratorios (del sistema,
 * bloqueados) + cargos extra − abonos previos − descuento. Mismo cálculo que
 * desempenarEmpeno en el servidor.
 */
export function DesempenoForm({
  accion,
  metodoDefault,
  prestamo,
  abonos,
  interes,
  almacenaje,
  iva,
  moratorios,
  diasAtraso,
  abonosRefrendo = 0,
  conExtras = true,
}: {
  accion: (form: FormData) => void | Promise<void>;
  metodoDefault: string;
  prestamo: number;
  abonos: number;
  interes: number;
  almacenaje: number;
  iva: number;
  moratorios: number;
  diasAtraso: number;
  /** Abonos parciales hechos al refrendo pendiente (se descuentan al liquidar). */
  abonosRefrendo?: number;
  /** Muestra los cargos de GPS, seguro, pensión, etc. */
  conExtras?: boolean;
}) {
  const [extras, setExtras] = useState<Record<Extra, string>>({ gastosAdmin: "", rentaGps: "", rentaSeguro: "", pension: "", gastosVenta: "" });
  const [descuento, setDescuento] = useState("");
  const [recibido, setRecibido] = useState("");
  const n = (x: string) => {
    const f = parseFloat(x);
    return Number.isFinite(f) && f > 0 ? f : 0;
  };
  const sumaExtras = EXTRAS.reduce((s, [k]) => s + n(extras[k]), 0);
  const total = Math.max(0, prestamo + interes + almacenaje + iva + moratorios + sumaExtras - abonos - abonosRefrendo - n(descuento));
  const cambio = n(recibido) > total ? n(recibido) - total : 0;

  return (
    <form action={accion} className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">Desempeño (liquidación)</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid grid-cols-1 content-start gap-3 min-[400px]:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Método de pago
            <select name="metodoPago" defaultValue={metodoDefault} className={campoCls}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </label>
          {conExtras &&
            EXTRAS.map(([k, label]) => (
              <Campo key={k} name={k} label={label} value={extras[k]} onChange={(x) => setExtras({ ...extras, [k]: x })} />
            ))}
          <Campo name="descuento" label="Descuento" value={descuento} onChange={setDescuento} />
          <Campo name="recibido" label="Efectivo recibido" value={recibido} onChange={setRecibido} />
        </div>
        <div className="space-y-2">
          <DesgloseCobro
            titulo="Total para desempeñar"
            total={total}
            lineas={[
              { concepto: "Préstamo", monto: prestamo, siempre: true },
              { concepto: "Abonos a capital", monto: abonos, resta: true },
              { concepto: "Abonos al refrendo pendiente", monto: abonosRefrendo, resta: true },
              { concepto: "Intereses", monto: interes, siempre: true },
              { concepto: "Almacenaje (resguardo)", monto: almacenaje, siempre: true },
              { concepto: "IVA", monto: iva, siempre: true },
              { concepto: "Moratorios", monto: moratorios, siempre: true, bloqueado: true, nota: notaMoratorios(moratorios, diasAtraso, TASA_MORATORIOS) },
              ...EXTRAS.map(([k, label]) => ({ concepto: label, monto: n(extras[k]) })),
              { concepto: "Descuento", monto: n(descuento), resta: true },
            ]}
          />
          {n(recibido) > 0 && (
            <p className="flex justify-between px-1 text-sm">
              <span className="text-muted">Cambio</span>
              <span className="tabular-nums text-foreground">{formatMXN(cambio)}</span>
            </p>
          )}
        </div>
      </div>
      <div className="mt-3">
        <ConfirmSubmit variante="secondary" confirmacion={`¿Registrar desempeño por ${formatMXN(total)}? El cliente recupera su prenda.`}>
          Desempeñar y entregar ticket
        </ConfirmSubmit>
      </div>
    </form>
  );
}

function Campo({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input name={name} type="number" step="0.01" min={0} placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)} className={campoCls} />
    </label>
  );
}
