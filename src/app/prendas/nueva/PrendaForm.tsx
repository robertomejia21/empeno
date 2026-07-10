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
  const [valorAvaluo, setValorAvaluo] = useState<number>(0);

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
