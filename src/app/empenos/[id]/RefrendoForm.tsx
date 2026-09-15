"use client";

import { useState } from "react";
import { formatMXN } from "@/lib/format";
import { moratoriosSugeridos } from "@/lib/interes";
import { ConfirmSubmit } from "@/components/actions-ui";

const campoCls =
  "rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground focus:border-primary-2 focus:outline-none focus:ring-2 focus:ring-primary-2/20";

/**
 * Refrendo / abono con cálculo del total en vivo.
 * total = intereses(base) + moratorios + gastos admin + abono a capital − descuento.
 */
export function RefrendoForm({
  accion,
  base,
  metodoDefault,
  montoPrestado,
  vencido,
}: {
  accion: (form: FormData) => void | Promise<void>;
  base: number;
  metodoDefault: string;
  montoPrestado: number;
  vencido: boolean;
}) {
  const moratoriosInicial = moratoriosSugeridos(montoPrestado, vencido);
  const [v, setV] = useState({
    moratorios: moratoriosInicial ? String(moratoriosInicial) : "",
    gastosAdmin: "",
    abonoCapital: "",
    descuento: "",
    recibido: "",
  });
  const n = (x: string) => {
    const f = parseFloat(x);
    return Number.isFinite(f) ? f : 0;
  };
  const total = Math.max(0, base + n(v.moratorios) + n(v.gastosAdmin) + n(v.abonoCapital) - n(v.descuento));
  const recibido = n(v.recibido);
  const cambio = recibido > total ? recibido - total : 0;
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <form action={accion} className="rounded-xl bg-surface-2 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">Refrendo / abono mensual</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Método de pago
          <select name="metodoPago" defaultValue={metodoDefault} className={campoCls}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="cheque">Cheque</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </label>
        <Campo
          name="moratorios"
          label="Moratorios"
          value={v.moratorios}
          onChange={set("moratorios")}
          nota={vencido ? "6% por atraso (editable)" : undefined}
        />
        <Campo name="gastosAdmin" label="Gastos admin." value={v.gastosAdmin} onChange={set("gastosAdmin")} />
        <Campo name="abonoCapital" label="Abono a capital" value={v.abonoCapital} onChange={set("abonoCapital")} />
        <Campo name="descuento" label="Descuento" value={v.descuento} onChange={set("descuento")} />
        <Campo name="recibido" label="Efectivo recibido" value={v.recibido} onChange={set("recibido")} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface p-3 text-sm">
        <span className="text-muted">Intereses del periodo</span>
        <span className="text-right tabular-nums text-foreground">{formatMXN(base)}</span>
        <span className="font-semibold text-foreground">Total a pagar</span>
        <span className="text-right text-base font-bold tabular-nums text-primary">{formatMXN(total)}</span>
        {recibido > 0 && (
          <>
            <span className="text-muted">Cambio</span>
            <span className="text-right tabular-nums text-foreground">{formatMXN(cambio)}</span>
          </>
        )}
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
  name, label, value, onChange, nota,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  nota?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input name={name} type="number" step="0.01" placeholder="0.00" value={value} onChange={onChange} className={campoCls} />
      {nota && <span className="text-[10px] text-info">{nota}</span>}
    </label>
  );
}
