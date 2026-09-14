"use client";

import { useState } from "react";
import Link from "next/link";
import { crearPrenda } from "@/lib/actions";
import { prestamoSugerido } from "@/lib/interes";
import { Card, CardHeader, Button, Field, SelectField, TextArea } from "@/components/ui";
import type { CategoriaPrenda } from "@/lib/types";

const categorias: { value: CategoriaPrenda; label: string }[] = [
  { value: "Joyería", label: "Joyería" },
  { value: "Electrónica", label: "Electrónica" },
  { value: "Herramientas", label: "Herramientas" },
  { value: "Relojes", label: "Relojes" },
  { value: "Vehículos", label: "Vehículos" },
  { value: "Instrumentos", label: "Instrumentos" },
  { value: "Electrodomésticos", label: "Electrodomésticos" },
  { value: "Otro", label: "Otro" },
];

export function PrendaForm() {
  const [categoria, setCategoria] = useState<CategoriaPrenda>("Joyería");
  const [montoSolicitado, setMontoSolicitado] = useState<number>(0);
  const [valorAvaluo, setValorAvaluo] = useState<number>(0);
  const [modalidad, setModalidad] = useState<"gps" | "resguardo">("resguardo");

  const esVehiculo = categoria === "Vehículos";
  const esJoyeria = categoria === "Joyería";
  const sugerido = prestamoSugerido(valorAvaluo);

  return (
    <form action={crearPrenda}>
      <Card>
        <CardHeader title="Departamento y descripción" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Departamento <span className="text-danger">*</span>
            </span>
            <select
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaPrenda)}
              required
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div />
          <div className="sm:col-span-2">
            <Field
              label="Descripción del bien"
              name="descripcion"
              placeholder={esVehiculo ? "Ej. Automóvil sedán 4 puertas" : "Ej. Anillo de oro con incrustación"}
              required
            />
          </div>
        </div>
      </Card>

      {/* Datos específicos por departamento */}
      {esVehiculo ? (
        <Card className="mt-6">
          <CardHeader title="Datos del vehículo" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Marca" name="marca" placeholder="Ej. Nissan" />
            <Field label="Submarca / línea" name="submarca" placeholder="Ej. Versa" />
            <Field label="Modelo (año)" name="modelo" placeholder="Ej. 2020" />
            <Field label="Color" name="color" />
            <Field label="Número de serie (NIV)" name="serie" />
            <Field label="Placas" name="placas" />
          </div>

          <div className="mx-5 mb-5 rounded-lg border border-border bg-surface-2/50 p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Modalidad del vehículo</p>
            <input type="hidden" name="modalidad" value={modalidad} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModalidad("resguardo")}
                className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition ${modalidad === "resguardo" ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface hover:bg-surface-2"}`}
              >
                🏢 Resguardo
                <span className="block text-[11px] font-normal text-muted">Queda en nuestra bóveda/patio</span>
              </button>
              <button
                type="button"
                onClick={() => setModalidad("gps")}
                className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition ${modalidad === "gps" ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface hover:bg-surface-2"}`}
              >
                📡 GPS
                <span className="block text-[11px] font-normal text-muted">El cliente lo conserva con GPS</span>
              </button>
            </div>
            {modalidad === "gps" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="GPS mensual (MXN)" name="gpsMensual" type="number" step="0.01" />
                <Field label="Ubicación del GPS" name="gpsUbicacion" placeholder="Coordenadas o liga de Maps" />
              </div>
            )}
          </div>
        </Card>
      ) : esJoyeria ? (
        <Card className="mt-6">
          <CardHeader title="Datos de joyería" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Metal" name="metal" placeholder="Oro, plata..." />
            <Field label="Kilataje" name="kilataje" placeholder="10k, 14k, 18k, 24k" />
            <Field label="Gramos" name="gramos" type="number" step="0.01" />
            <Field label="Color" name="color" />
          </div>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader title="Identificación del bien" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Marca" name="marca" />
            <Field label="Modelo" name="modelo" />
            <Field label="Número de serie" name="serie" />
            <Field label="Color" name="color" />
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader title="Monto solicitado" subtitle="Lo que pide el cliente, antes de avaluar el bien" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Monto solicitado por el cliente (MXN)</span>
            <input
              name="montoSolicitado"
              type="number"
              step="0.01"
              onChange={(e) => setMontoSolicitado(parseFloat(e.target.value) || 0)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <span className="text-xs text-muted">Captúralo antes de avaluar, para comparar contra el valor real del bien.</span>
          </label>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Avalúo" subtitle="Valor comercial y préstamo recomendado" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Valor de avalúo (MXN) <span className="text-danger">*</span>
            </span>
            <input
              name="valorAvaluo"
              type="number"
              step="0.01"
              required
              onChange={(e) => setValorAvaluo(parseFloat(e.target.value) || 0)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <Field
            label="Préstamo sugerido (50%)"
            name="montoPrestamoSugerido"
            type="number"
            step="0.01"
            defaultValue={sugerido || undefined}
            placeholder={sugerido ? sugerido.toString() : "Se calcula al 50%"}
          />
        </div>
        {montoSolicitado > 0 && valorAvaluo > 0 && (
          <p className={`px-5 pb-4 text-sm font-medium ${montoSolicitado <= sugerido ? "text-success" : "text-danger"}`}>
            {montoSolicitado <= sugerido
              ? `✅ El avalúo respalda lo solicitado (préstamo sugerido ${sugerido.toLocaleString("es-MX", { style: "currency", currency: "MXN" })} ≥ solicitado ${montoSolicitado.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}).`
              : `⚠️ El avalúo NO respalda lo solicitado (préstamo sugerido ${sugerido.toLocaleString("es-MX", { style: "currency", currency: "MXN" })} < solicitado ${montoSolicitado.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}).`}
          </p>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Resguardo y notas" />
        <div className="grid gap-4 p-5">
          <Field
            label="Ubicación de resguardo"
            name="ubicacionResguardo"
            placeholder="Ej. Bóveda - Caja 3 / Estacionamiento"
          />
          <TextArea
            label="Comentarios del bien (estado y daños)"
            name="notas"
            placeholder="¿Está dañado? Golpes, rayones, piezas faltantes, si enciende, accesorios incluidos..."
          />
        </div>
      </Card>

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href="/prendas"
          className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
        >
          Cancelar
        </Link>
        <Button type="submit">Guardar prenda</Button>
      </div>
    </form>
  );
}
