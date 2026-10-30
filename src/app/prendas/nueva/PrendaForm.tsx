"use client";

import { useState } from "react";
import Link from "next/link";
import { crearPrenda } from "@/lib/actions";
import { prestamoSugerido } from "@/lib/interes";
import { Card, CardHeader, Button, Field, TextArea } from "@/components/ui";
import { MapaResguardo } from "@/components/MapaResguardo";
import { rangoPorAnio } from "@/lib/valorVehiculoReferencia";
import { formatMXN } from "@/lib/format";
import { ArrowRight, BookOpen, CircleCheck, Satellite, Search, TriangleAlert, Warehouse } from "lucide-react";
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
  const [gpsUbicacion, setGpsUbicacion] = useState("");
  const [ubicacionResguardo, setUbicacionResguardo] = useState("");
  const [modeloAnio, setModeloAnio] = useState("");
  const [sinRobo, setSinRobo] = useState(false);
  const [repuveFolio, setRepuveFolio] = useState("");

  const esVehiculo = categoria === "Vehículos";
  const esJoyeria = categoria === "Joyería";
  const sugerido = prestamoSugerido(valorAvaluo);
  const rangoReferencia = esVehiculo ? rangoPorAnio(parseInt(modeloAnio, 10)) : null;

  return (
    <form action={crearPrenda}>
      <Card>
        <CardHeader title="Departamento y descripción" />
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Departamento <span className="text-danger">*</span>
            </span>
            <select
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaPrenda)}
              required
              className="w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <Field label="Marca" name="marca" placeholder="Ej. Nissan" />
            <Field label="Submarca / línea" name="submarca" placeholder="Ej. Versa" />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Modelo (año)</span>
              <input
                name="modelo"
                value={modeloAnio}
                onChange={(e) => setModeloAnio(e.target.value)}
                placeholder="Ej. 2020"
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition focus:border-primary-2 focus:bg-surface focus:ring-2 focus:ring-primary-2/20"
              />
            </label>
            <Field label="Color" name="color" />
            <Field label="Número de serie (NIV)" name="serie" />
            <Field label="Placas" name="placas" />
          </div>

          {rangoReferencia && (
            <div className="mx-4 mb-4 rounded-xl sm:mx-6 sm:mb-6 border border-info/20 bg-info-soft px-4 py-3 text-sm text-info">
              <BookOpen className="mr-1.5 inline h-4 w-4 -translate-y-px align-middle" aria-hidden />
              Referencia externa para {rangoReferencia.anioDesde}–{rangoReferencia.anioHasta}: valor comercial{" "}
              {rangoReferencia.valorDesde === rangoReferencia.valorHasta
                ? formatMXN(rangoReferencia.valorDesde)
                : `${formatMXN(rangoReferencia.valorDesde)}–${formatMXN(rangoReferencia.valorHasta)}`}{" "}
              · préstamo sugerido {formatMXN(rangoReferencia.prestamoDesde)}–{formatMXN(rangoReferencia.prestamoHasta)}.
              Es solo una guía, no reemplaza el avalúo físico.
            </div>
          )}

          <div className="mx-4 mb-4 rounded-xl sm:mx-6 sm:mb-6 border border-border bg-surface-2/50 p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Modalidad del vehículo</p>
            <input type="hidden" name="modalidad" value={modalidad} />
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setModalidad("resguardo")}
                className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition ${modalidad === "resguardo" ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-foreground hover:bg-surface-2"}`}
              >
                <span className="inline-flex items-center gap-1.5"><Warehouse className="h-4 w-4" aria-hidden /> Resguardo</span>
                <span className="block text-[11px] font-normal text-muted">Queda en nuestra bóveda/patio</span>
              </button>
              <button
                type="button"
                onClick={() => setModalidad("gps")}
                className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition ${modalidad === "gps" ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-foreground hover:bg-surface-2"}`}
              >
                <span className="inline-flex items-center gap-1.5"><Satellite className="h-4 w-4" aria-hidden /> GPS</span>
                <span className="block text-[11px] font-normal text-muted">El cliente lo conserva con GPS</span>
              </button>
            </div>
            {modalidad === "gps" && (
              <div className="mt-4 space-y-4">
                <Field label="GPS mensual (MXN)" name="gpsMensual" type="number" step="0.01" />
                <input type="hidden" name="gpsUbicacion" value={gpsUbicacion} />
                <MapaResguardo label="Ubicación del GPS" onChange={setGpsUbicacion} />
              </div>
            )}
          </div>

          <div className="mx-4 mb-4 rounded-xl sm:mx-6 sm:mb-6 border border-warning/30 bg-warning-soft p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Verificación REPUVE</p>
            <p className="mb-2 text-xs text-muted">
              Obligatoria antes de poder empeñar este vehículo.{" "}
              <a
                href="https://www2.repuve.gob.mx:8443/ciudadania/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
              >
                <Search className="h-3.5 w-3.5" aria-hidden /> Abrir REPUVE <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Folio de consulta REPUVE</span>
                <input
                  value={repuveFolio}
                  onChange={(e) => setRepuveFolio(e.target.value)}
                  placeholder="Folio o referencia de la consulta"
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary-2 focus:ring-2 focus:ring-primary-2/20"
                />
              </label>
              <label className="flex items-start gap-2 pb-1.5 text-sm font-medium text-foreground sm:items-center">
                <input type="checkbox" checked={sinRobo} onChange={(e) => setSinRobo(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary sm:mt-0" />
                REPUVE consultado: SIN reporte de robo
              </label>
            </div>
            <input type="hidden" name="verificado" value={sinRobo ? "on" : ""} />
            <input type="hidden" name="repuveFolio" value={repuveFolio} />
          </div>
        </Card>
      ) : esJoyeria ? (
        <Card className="mt-6">
          <CardHeader title="Datos de joyería" />
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <Field label="Metal" name="metal" placeholder="Oro, plata..." />
            <Field label="Kilataje" name="kilataje" placeholder="10k, 14k, 18k, 24k" />
            <Field label="Gramos" name="gramos" type="number" step="0.01" />
            <Field label="Color" name="color" />
          </div>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader title="Identificación del bien" />
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <Field label="Marca" name="marca" />
            <Field label="Modelo" name="modelo" />
            <Field label="Número de serie" name="serie" />
            <Field label="Color" name="color" />
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader title="Monto solicitado" subtitle="Lo que pide el cliente, antes de avaluar el bien" />
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Monto solicitado por el cliente (MXN)</span>
            <input
              name="montoSolicitado"
              type="number"
              step="0.01"
              onChange={(e) => setMontoSolicitado(parseFloat(e.target.value) || 0)}
              className="w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-xs text-muted">Captúralo antes de avaluar, para comparar contra el valor real del bien.</span>
          </label>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Avalúo" subtitle="Valor comercial y préstamo recomendado" />
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
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
              className="w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
          <p className={`flex items-start gap-2 px-4 pb-4 text-sm font-medium sm:px-6 ${montoSolicitado <= sugerido ? "text-success" : "text-danger"}`}>
            {montoSolicitado <= sugerido ? (
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>
            {montoSolicitado <= sugerido
              ? `El avalúo respalda lo solicitado (préstamo sugerido ${sugerido.toLocaleString("es-MX", { style: "currency", currency: "MXN" })} ≥ solicitado ${montoSolicitado.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}).`
              : `El avalúo NO respalda lo solicitado (préstamo sugerido ${sugerido.toLocaleString("es-MX", { style: "currency", currency: "MXN" })} < solicitado ${montoSolicitado.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}).`}
            </span>
          </p>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Resguardo y notas" />
        <div className="grid gap-4 p-4 sm:p-6">
          <input type="hidden" name="ubicacionResguardo" value={ubicacionResguardo} />
          <MapaResguardo onChange={setUbicacionResguardo} />
          <TextArea
            label="Comentarios del bien (estado y daños)"
            name="notas"
            placeholder="¿Está dañado? Golpes, rayones, piezas faltantes, si enciende, accesorios incluidos..."
          />
        </div>
      </Card>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/prendas"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-soft transition hover:bg-surface-2"
        >
          Cancelar
        </Link>
        <Button type="submit">Guardar prenda</Button>
      </div>
    </form>
  );
}
