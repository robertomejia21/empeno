"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { crearEmpeno } from "@/lib/actions";
import { tasaPorHistorial, calcularVencimiento } from "@/lib/interes";
import { formatMXN, formatFecha, hoyISO } from "@/lib/format";
import { Card, CardHeader, Button, Field, SelectField, TextArea } from "@/components/ui";

interface ClienteOpt {
  id: string;
  nombre: string;
  previos: number;
}
interface PrendaOpt {
  id: string;
  folio: string;
  descripcion: string;
  montoPrestamoSugerido: number;
  valorAvaluo: number;
}

export function EmpenoForm({
  clientes,
  prendas,
  clienteInicial,
}: {
  clientes: ClienteOpt[];
  prendas: PrendaOpt[];
  clienteInicial?: string;
}) {
  const [clienteId, setClienteId] = useState(clienteInicial ?? "");
  const [prendaId, setPrendaId] = useState("");
  const [periodo, setPeriodo] = useState("mensual");
  const [plazo, setPlazo] = useState(1);
  const [fechaInicio, setFechaInicio] = useState(hoyISO());

  const cliente = clientes.find((c) => c.id === clienteId);
  const prenda = prendas.find((p) => p.id === prendaId);
  const historial = tasaPorHistorial(cliente?.previos ?? 0);

  const [monto, setMonto] = useState(0);
  const [tasa, setTasa] = useState(historial.tasa);

  const vencimiento = useMemo(
    () => calcularVencimiento(fechaInicio, periodo as "mensual" | "quincenal" | "semanal", plazo),
    [fechaInicio, periodo, plazo]
  );

  // Cuando cambia el cliente, sugerir su tasa por historial
  function onCliente(id: string) {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    setTasa(tasaPorHistorial(c?.previos ?? 0).tasa);
  }
  // Cuando cambia la prenda, prefijar el préstamo sugerido
  function onPrenda(id: string) {
    setPrendaId(id);
    const p = prendas.find((x) => x.id === id);
    if (p) setMonto(p.montoPrestamoSugerido);
  }

  const sinPrendas = prendas.length === 0;

  return (
    <form action={crearEmpeno}>
      <Card>
        <CardHeader title="1. Cliente" subtitle="Selecciona el cliente del empeño" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Cliente <span className="text-danger">*</span>
            </span>
            <select
              name="clienteId"
              value={clienteId}
              onChange={(e) => onCliente(e.target.value)}
              required
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">— Selecciona —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.previos} empeños)
                </option>
              ))}
            </select>
            <Link href="/clientes/nuevo" className="text-xs text-primary">
              + Registrar nuevo cliente
            </Link>
          </label>

          {cliente && (
            <div className="rounded-lg bg-surface-2 p-3 text-sm">
              <p className="text-xs text-muted">Nivel del cliente</p>
              <p className="font-medium text-foreground">{historial.nivel}</p>
              <p className="mt-1 text-xs text-muted">
                Tasa sugerida: <span className="font-semibold text-primary">{historial.tasa}%</span>
                {historial.requiereAutorizacion && " · requiere autorización de Gerencia"}
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="2. Prenda en garantía" subtitle="Bien que respalda el préstamo" />
        <div className="p-5">
          {sinPrendas ? (
            <p className="text-sm text-muted">
              No hay prendas disponibles.{" "}
              <Link href="/prendas/nueva" className="text-primary">
                Registra una prenda
              </Link>{" "}
              (en avalúo) para poder empeñarla.
            </p>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Prenda <span className="text-danger">*</span>
              </span>
              <select
                name="prendaId"
                value={prendaId}
                onChange={(e) => onPrenda(e.target.value)}
                required
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">— Selecciona —</option>
                {prendas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.folio} · {p.descripcion} (avalúo {formatMXN(p.valorAvaluo)})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="3. Condiciones del préstamo" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Monto a prestar (MXN) <span className="text-danger">*</span>
            </span>
            <input
              name="montoPrestado"
              type="number"
              step="0.01"
              required
              value={monto || ""}
              onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {prenda && (
              <span className="text-xs text-muted">
                Sugerido: {formatMXN(prenda.montoPrestamoSugerido)}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Tasa de interés (% por periodo) <span className="text-danger">*</span>
            </span>
            <input
              name="tasaInteres"
              type="number"
              step="0.01"
              required
              value={tasa}
              onChange={(e) => setTasa(parseFloat(e.target.value) || 0)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          <SelectField
            label="Periodo"
            name="periodo"
            options={[
              { value: "mensual", label: "Mensual (30 días)" },
              { value: "quincenal", label: "Quincenal (15 días)" },
              { value: "diario", label: "Diario (1 día)" },
              { value: "semanal", label: "Semanal (7 días)" },
            ]}
            defaultValue="mensual"
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Plazo (periodos)</span>
            <input
              name="plazoPeriodos"
              type="number"
              min={1}
              value={plazo}
              onChange={(e) => setPlazo(parseInt(e.target.value) || 1)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Fecha de inicio</span>
            <input
              name="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <Field label="Días de gracia" name="diasGracia" type="number" defaultValue={7} />

          <div className="sm:col-span-2">
            <TextArea label="Notas" name="notas" />
          </div>
        </div>
      </Card>

      {/* Resumen */}
      <Card className="mt-6 border-primary/30 bg-primary-soft/30">
        <div className="grid gap-4 p-5 sm:grid-cols-4">
          <Resumen etiqueta="Préstamo" valor={formatMXN(monto)} />
          <Resumen etiqueta="Interés por periodo" valor={formatMXN(monto * (tasa / 100))} />
          <Resumen
            etiqueta="A liquidar (1er periodo)"
            valor={formatMXN(monto + monto * (tasa / 100))}
          />
          <Resumen etiqueta="Vence" valor={formatFecha(vencimiento)} />
        </div>
      </Card>

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href="/empenos"
          className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={sinPrendas}>
          Crear empeño
        </Button>
      </div>
    </form>
  );
}

function Resumen({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{etiqueta}</p>
      <p className="mt-0.5 text-lg font-bold text-foreground">{valor}</p>
    </div>
  );
}
