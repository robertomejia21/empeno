"use client";

import { useState } from "react";
import { PageHeader, Card, CardHeader } from "@/components/ui";
import { PRECIO_ORO_24K_GRAMO, PRECIO_PLATA_GRAMO } from "@/lib/compliance";
import { Coins } from "lucide-react";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const f = (n: number) => mxn.format(isFinite(n) ? n : 0);

const kilatesOro = [
  { k: "24k", pureza: 1 },
  { k: "22k", pureza: 22 / 24 },
  { k: "18k", pureza: 18 / 24 },
  { k: "14k", pureza: 14 / 24 },
  { k: "10k", pureza: 10 / 24 },
];

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition focus:border-primary-2 focus:bg-surface focus:ring-2 focus:ring-primary-2/20";

export default function AvaluoPage() {
  const [metal, setMetal] = useState<"oro" | "plata">("oro");
  const [gramos, setGramos] = useState("");
  const [kilataje, setKilataje] = useState("14k");
  const [precioOro, setPrecioOro] = useState(String(PRECIO_ORO_24K_GRAMO));
  const [precioPlata, setPrecioPlata] = useState(String(PRECIO_PLATA_GRAMO));
  const [porcentaje, setPorcentaje] = useState(50);

  const g = parseFloat(gramos) || 0;
  const pureza = kilatesOro.find((x) => x.k === kilataje)?.pureza ?? 1;
  const precioGramo = metal === "oro" ? parseFloat(precioOro) || 0 : parseFloat(precioPlata) || 0;
  const valorMetal = metal === "oro" ? g * pureza * precioGramo : g * precioGramo;
  const prestamoSugerido = valorMetal * (porcentaje / 100);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Avalúo de metales" subtitle="Calculadora de oro y plata por gramaje" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Datos del metal" />
          <div className="space-y-4 p-5">
            <div className="flex gap-2">
              {(["oro", "plata"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetal(m)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                    metal === m
                      ? "bg-primary text-primary-fg shadow-soft"
                      : "border border-border bg-surface text-foreground hover:bg-surface-2"
                  }`}
                >
                  <Coins className="h-4 w-4" aria-hidden />
                  {m === "oro" ? "Oro" : "Plata"}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Peso (gramos)</span>
              <input type="number" step="0.01" value={gramos} onChange={(e) => setGramos(e.target.value)} className={inputCls} placeholder="0.00" />
            </label>

            {metal === "oro" && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Kilataje</span>
                <select value={kilataje} onChange={(e) => setKilataje(e.target.value)} className={inputCls}>
                  {kilatesOro.map((x) => (
                    <option key={x.k} value={x.k}>
                      {x.k} ({Math.round(x.pureza * 1000) / 10}% puro)
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Precio {metal === "oro" ? "oro 24k" : "plata"} (MXN/gramo)
              </span>
              <input
                type="number"
                step="0.01"
                value={metal === "oro" ? precioOro : precioPlata}
                onChange={(e) => (metal === "oro" ? setPrecioOro(e.target.value) : setPrecioPlata(e.target.value))}
                className={inputCls}
              />
              <span className="mt-1 block text-xs text-muted">Actualiza según el precio spot del día.</span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Préstamo sugerido: {porcentaje}% del valor
              </span>
              <input
                type="range"
                min={30}
                max={90}
                value={porcentaje}
                onChange={(e) => setPorcentaje(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </label>
          </div>
        </Card>

        <div className="shadow-card self-start overflow-hidden rounded-2xl border border-primary bg-primary text-primary-fg">
          <div className="border-b border-primary-fg/20 px-5 py-4">
            <h2 className="text-[15px] font-semibold">Resultado del avalúo</h2>
          </div>
          <div className="space-y-5 p-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary-fg/75">Contenido de metal fino</p>
              <p className="wrap-break-word text-lg font-semibold">
                {metal === "oro" ? `${(g * pureza).toFixed(2)} g de oro puro` : `${g.toFixed(2)} g de plata`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-primary-fg/75">Valor estimado del metal</p>
              <p className="wrap-break-word text-3xl font-bold tracking-tight tabular-nums">{f(valorMetal)}</p>
            </div>
            <div className="rounded-xl bg-primary-fg/15 p-4">
              <p className="text-xs uppercase tracking-wide text-primary-fg/80">Préstamo sugerido ({porcentaje}%)</p>
              <p className="wrap-break-word text-2xl font-bold tracking-tight tabular-nums">{f(prestamoSugerido)}</p>
            </div>
            <p className="text-xs text-primary-fg/75">
              Valor referencial sobre el contenido de metal. No incluye valor de mano de obra, piedras ni marca.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
