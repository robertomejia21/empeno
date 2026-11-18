"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatMXN } from "@/lib/format";
import { TASA_MORATORIOS } from "@/lib/interes";
import { ConfirmSubmit } from "@/components/actions-ui";
import { DesgloseCobro, notaMoratorios } from "./DesgloseCobro";

const campoCls =
  "rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

/**
 * Refrendo / abono con desglose en vivo:
 * intereses + almacenaje + IVA + moratorios (fijos, del sistema) + gastos admin.
 * + abono a capital − descuento. Mismo cálculo que refrendarEmpeno en el servidor.
 */
export function RefrendoForm({
  accion,
  metodoDefault,
  interes,
  almacenaje,
  iva,
  moratorios,
  diasAtraso,
  capitalPendiente,
  proximoVencInhabil,
  titulo = "Refrendo / abono mensual",
}: {
  accion: (form: FormData) => void | Promise<void>;
  metodoDefault: string;
  interes: number;
  almacenaje: number;
  iva: number;
  /** Calculados por el sistema; el servidor vuelve a calcularlos y no acepta otro valor. */
  moratorios: number;
  diasAtraso: number;
  capitalPendiente: number;
  proximoVencInhabil?: boolean;
  titulo?: string;
}) {
  const [v, setV] = useState({ gastosAdmin: "", abonoCapital: "", descuento: "", recibido: "" });
  const n = (x: string) => {
    const f = parseFloat(x);
    return Number.isFinite(f) && f > 0 ? f : 0;
  };
  const abono = Math.min(n(v.abonoCapital), capitalPendiente);
  const total = Math.max(0, interes + almacenaje + iva + moratorios + n(v.gastosAdmin) + abono - n(v.descuento));
  const recibido = n(v.recibido);
  const cambio = recibido > total ? recibido - total : 0;
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <form action={accion} className="rounded-xl border border-border bg-surface-2/60 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{titulo}</p>
      {proximoVencInhabil && (
        <p className="mb-3 flex items-start gap-2 rounded-lg border border-info/20 bg-info-soft px-3 py-2 text-xs text-info">
          <CalendarDays className="mt-px h-4 w-4 shrink-0" aria-hidden />
          <span>
          El siguiente día de pago cae en domingo o festivo. El cliente puede pagar el día hábil más cercano sin
          recargo — la fecha de pago registrada no se mueve por esto.
          </span>
        </p>
      )}
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
          <Campo name="gastosAdmin" label="Gastos admin." value={v.gastosAdmin} onChange={set("gastosAdmin")} />
          <Campo name="abonoCapital" label="Abono a capital" value={v.abonoCapital} onChange={set("abonoCapital")} />
          <Campo name="descuento" label="Descuento" value={v.descuento} onChange={set("descuento")} />
          <Campo name="recibido" label="Efectivo recibido" value={v.recibido} onChange={set("recibido")} />
        </div>
        <div className="space-y-2">
          <DesgloseCobro
            total={total}
            lineas={[
              { concepto: "Intereses", monto: interes, siempre: true },
              { concepto: "Almacenaje (resguardo)", monto: almacenaje, siempre: true },
              { concepto: "IVA", monto: iva, siempre: true },
              { concepto: "Moratorios", monto: moratorios, siempre: true, bloqueado: true, nota: notaMoratorios(moratorios, diasAtraso, TASA_MORATORIOS) },
              { concepto: "Gastos admin.", monto: n(v.gastosAdmin) },
              { concepto: "Abono a capital", monto: abono },
              { concepto: "Descuento", monto: n(v.descuento), resta: true },
            ]}
          />
          {recibido > 0 && (
            <p className="flex justify-between px-1 text-sm">
              <span className="text-muted">Cambio</span>
              <span className="tabular-nums text-foreground">{formatMXN(cambio)}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <ConfirmSubmit confirmacion={`¿Registrar el refrendo/abono por ${formatMXN(total)} y generar el recibo?`}>
          Registrar y entregar recibo
        </ConfirmSubmit>
      </div>
    </form>
  );
}

function Campo({
  name, label, value, onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input name={name} type="number" step="0.01" min={0} placeholder="0.00" value={value} onChange={onChange} className={campoCls} />
    </label>
  );
}
