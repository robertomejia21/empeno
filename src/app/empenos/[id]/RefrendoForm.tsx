"use client";

import { useState } from "react";
import { CalendarDays, HandCoins, ShieldCheck, TriangleAlert } from "lucide-react";
import { formatMXN, formatFecha } from "@/lib/format";
import { TASA_MORATORIOS } from "@/lib/interes";
import { ConfirmSubmit } from "@/components/actions-ui";
import { DesgloseCobro, notaMoratorios } from "./DesgloseCobro";

const campoCls =
  "rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export interface AbonosRefrendoInfo {
  /** Abonos ya hechos al refrendo en curso. */
  abonos: { fecha: string; total: number }[];
  total: number;
  /** Lo que falta de cada concepto (ya descontado lo abonado). */
  pendiente: { moratorios: number; intereses: number; almacenaje: number; iva: number };
  /** Hasta cuándo un abono protege la prenda (siguiente vencimiento). */
  protegeHasta: string;
}

/**
 * Refrendo / abono con desglose en vivo:
 * - Refrendo completo: intereses + almacenaje + IVA + moratorios (fijos, del
 *   sistema) + gastos admin. + abono a capital − descuento − abonos previos.
 * - Solo abono: pago parcial al refrendo; no renueva el periodo, pero protege
 *   la prenda de remate hasta el siguiente vencimiento (los moratorios siguen).
 * Mismo cálculo que refrendarEmpeno en el servidor.
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
  abonos,
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
  abonos: AbonosRefrendoInfo;
  titulo?: string;
}) {
  const [modo, setModo] = useState<"refrendo" | "abono">("refrendo");
  const [metodo, setMetodo] = useState(metodoDefault);
  const [v, setV] = useState({ gastosAdmin: "", abonoCapital: "", descuento: "", recibido: "", montoAbono: "" });
  const n = (x: string) => {
    const f = parseFloat(x);
    return Number.isFinite(f) && f > 0 ? f : 0;
  };
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const pend = abonos.pendiente;
  const saldoRefrendo = r2(pend.moratorios + pend.intereses + pend.almacenaje + pend.iva);

  // Refrendo completo
  const abonoCap = Math.min(n(v.abonoCapital), capitalPendiente);
  const total = Math.max(0, r2(saldoRefrendo + n(v.gastosAdmin) + abonoCap - n(v.descuento)));

  // Solo abono
  const montoAbono = r2(n(v.montoAbono));
  const abonoCubre = montoAbono >= saldoRefrendo && montoAbono > 0;
  const saldoTrasAbono = Math.max(0, r2(saldoRefrendo - montoAbono));

  const aCobrar = modo === "abono" ? montoAbono : total;
  const recibido = n(v.recibido);
  const cambio = recibido > aCobrar ? recibido - aCobrar : 0;
  const efectivoInsuficiente = modo === "refrendo" && metodo === "efectivo" && recibido > 0 && recibido < total;
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  const pasarAAbono = () => {
    setModo("abono");
    setV({ ...v, montoAbono: String(recibido), recibido: "" });
  };

  const bloqueado = modo === "abono" ? montoAbono <= 0 : efectivoInsuficiente;
  const confirmacion =
    modo === "abono"
      ? abonoCubre
        ? `El monto cubre el refrendo completo (${formatMXN(saldoRefrendo)}). ¿Registrar el REFRENDO y generar el recibo?`
        : `¿Registrar un ABONO de ${formatMXN(montoAbono)}? NO renueva el periodo; quedará un saldo de ${formatMXN(saldoTrasAbono)} por cubrir antes del ${formatFecha(abonos.protegeHasta)}.`
      : `¿Registrar el refrendo por ${formatMXN(total)} y generar el recibo?`;

  return (
    <form action={accion} className="rounded-xl border border-border bg-surface-2/60 p-4">
      <input type="hidden" name="modo" value={modo} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <div role="radiogroup" aria-label="Tipo de pago" className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-sm">
          {([
            ["refrendo", "Refrendo completo"],
            ["abono", "Solo abono (parcial)"],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={modo === k}
              onClick={() => setModo(k)}
              className={`rounded-md px-3 py-1 font-medium transition ${modo === k ? "bg-primary text-primary-fg shadow-soft" : "text-muted hover:text-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {proximoVencInhabil && modo === "refrendo" && (
        <p className="mb-3 flex items-start gap-2 rounded-lg border border-info/20 bg-info-soft px-3 py-2 text-xs text-info">
          <CalendarDays className="mt-px h-4 w-4 shrink-0" aria-hidden />
          <span>
          El siguiente día de pago cae en domingo o festivo. El cliente puede pagar el día hábil más cercano sin
          recargo — la fecha de pago registrada no se mueve por esto.
          </span>
        </p>
      )}

      {abonos.abonos.length > 0 && (
        <div className="mb-3 rounded-lg border border-info/30 bg-info-soft px-3 py-2 text-xs text-info">
          <p className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Este refrendo tiene {abonos.abonos.length} abono(s) por {formatMXN(abonos.total)} — prenda protegida hasta el{" "}
            {formatFecha(abonos.protegeHasta)}.
          </p>
          <ul className="mt-1 space-y-0.5 pl-5">
            {abonos.abonos.map((a, i) => (
              <li key={i} className="list-disc">
                {formatFecha(a.fecha)}: {formatMXN(a.total)}
              </li>
            ))}
          </ul>
          <p className="mt-1">Saldo por cubrir del refrendo: <strong>{formatMXN(saldoRefrendo)}</strong></p>
        </div>
      )}

      {modo === "abono" && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">
          <HandCoins className="mt-px h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong>Solo abono:</strong> el cliente no completa el refrendo. El abono <strong>no renueva el periodo</strong>, pero
            protege la prenda/vehículo de remate hasta el <strong>{formatFecha(abonos.protegeHasta)}</strong>. Los moratorios
            siguen aplicando conforme a las reglas del sistema; el cliente puede seguir abonando y, al cubrir el saldo, el
            refrendo queda completo.
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid grid-cols-1 content-start gap-3 min-[400px]:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Método de pago
            <select name="metodoPago" value={metodo} onChange={(e) => setMetodo(e.target.value)} className={campoCls}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </label>
          {modo === "abono" ? (
            <Campo name="montoAbono" label={`Monto del abono (saldo ${formatMXN(saldoRefrendo)})`} value={v.montoAbono} onChange={set("montoAbono")} />
          ) : (
            <>
              <Campo name="gastosAdmin" label="Gastos admin." value={v.gastosAdmin} onChange={set("gastosAdmin")} />
              <Campo name="abonoCapital" label="Abono a capital" value={v.abonoCapital} onChange={set("abonoCapital")} />
              <Campo name="descuento" label="Descuento" value={v.descuento} onChange={set("descuento")} />
            </>
          )}
          <Campo name="recibido" label="Efectivo recibido" value={v.recibido} onChange={set("recibido")} />
        </div>
        <div className="space-y-2">
          {modo === "abono" ? (
            <>
              <DesgloseCobro
                titulo="Saldo del refrendo"
                total={saldoRefrendo}
                lineas={[
                  { concepto: "Intereses", monto: pend.intereses, siempre: true },
                  { concepto: "Almacenaje (resguardo)", monto: pend.almacenaje, siempre: true },
                  { concepto: "IVA", monto: pend.iva, siempre: true },
                  { concepto: "Moratorios", monto: pend.moratorios, siempre: true, bloqueado: true, nota: notaMoratorios(moratorios, diasAtraso, TASA_MORATORIOS) },
                ]}
              />
              <dl className="rounded-lg border border-border bg-surface text-sm">
                <div className="flex justify-between px-3 py-1.5">
                  <dt className="text-muted">Este abono</dt>
                  <dd className="tabular-nums text-success">− {formatMXN(montoAbono)}</dd>
                </div>
                <div className="flex justify-between border-t border-border bg-surface-2/60 px-3 py-2">
                  <dt className="font-semibold text-foreground">Saldo pendiente tras el abono</dt>
                  <dd className="text-lg font-bold tabular-nums text-warning">{formatMXN(saldoTrasAbono)}</dd>
                </div>
              </dl>
              {abonoCubre && (
                <p className="px-1 text-xs font-medium text-success">
                  El monto cubre el saldo completo: se registrará como <strong>refrendo</strong> y se renovará el periodo.
                </p>
              )}
            </>
          ) : (
            <DesgloseCobro
              total={total}
              lineas={[
                { concepto: "Intereses", monto: interes, siempre: true },
                { concepto: "Almacenaje (resguardo)", monto: almacenaje, siempre: true },
                { concepto: "IVA", monto: iva, siempre: true },
                { concepto: "Moratorios", monto: moratorios, siempre: true, bloqueado: true, nota: notaMoratorios(moratorios, diasAtraso, TASA_MORATORIOS) },
                { concepto: "Gastos admin.", monto: n(v.gastosAdmin) },
                { concepto: "Abono a capital", monto: abonoCap },
                { concepto: "Abonos previos al refrendo", monto: abonos.total, resta: true },
                { concepto: "Descuento", monto: n(v.descuento), resta: true },
              ]}
            />
          )}
          {recibido > 0 && !efectivoInsuficiente && (
            <p className="flex justify-between px-1 text-sm">
              <span className="text-muted">Cambio</span>
              <span className="tabular-nums text-foreground">{formatMXN(cambio)}</span>
            </p>
          )}
          {efectivoInsuficiente && (
            <div className="flex flex-wrap items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
              <TriangleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                El efectivo recibido ({formatMXN(recibido)}) no cubre el refrendo ({formatMXN(total)}). Si el cliente solo
                trae esa cantidad, regístrala como abono.
              </span>
              <button type="button" onClick={pasarAAbono} className="rounded-md bg-danger px-2 py-1 font-medium text-white">
                Registrar como abono
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        {bloqueado ? (
          <span className="inline-flex cursor-not-allowed items-center rounded-lg bg-primary/50 px-4 py-2 text-sm font-medium text-primary-fg">
            {modo === "abono" ? "Indica el monto del abono" : "Revisa el efectivo recibido"}
          </span>
        ) : (
          <ConfirmSubmit confirmacion={confirmacion}>
            {modo === "abono" && !abonoCubre ? "Registrar abono y entregar recibo" : "Registrar y entregar recibo"}
          </ConfirmSubmit>
        )}
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
