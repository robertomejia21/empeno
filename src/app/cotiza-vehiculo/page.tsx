import type { Metadata } from "next";
import { SUCURSAL } from "@/lib/negocio";
import { CotizadorPublico } from "./CotizadorPublico";
import { Car, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Cotiza tu vehículo — Turbo Presta El Dorado",
};

export default function CotizaVehiculoPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Car className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{SUCURSAL.nombre}</h1>
          <p className="mt-1 text-sm text-muted">Cotiza tu vehículo en un minuto</p>
        </div>
        <CotizadorPublico />
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {SUCURSAL.direccion}
        </p>
      </div>
    </div>
  );
}
