import type { Metadata } from "next";
import { SUCURSAL } from "@/lib/negocio";
import { CotizadorPublico } from "./CotizadorPublico";

export const metadata: Metadata = {
  title: "Cotiza tu vehículo — Turbo Presta El Dorado",
};

export default function CotizaVehiculoPage() {
  return (
    <div className="min-h-screen bg-surface-2 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{SUCURSAL.nombre}</h1>
          <p className="mt-1 text-sm text-muted">Cotiza tu vehículo en un minuto</p>
        </div>
        <CotizadorPublico />
        <p className="mt-4 text-center text-xs text-muted">📍 {SUCURSAL.direccion}</p>
      </div>
    </div>
  );
}
