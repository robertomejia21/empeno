import type { Metadata } from "next";
import { listarCitasGps } from "@/lib/db/repo";
import { SUCURSAL } from "@/lib/negocio";
import { AgendaPublica } from "./AgendaPublica";

export const metadata: Metadata = {
  title: "Agendar cita de GPS — Turbo Presta El Dorado",
};

export default async function AgendarGpsPage() {
  const citas = await listarCitasGps();
  return (
    <div className="min-h-screen bg-surface-2 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{SUCURSAL.nombre}</h1>
          <p className="mt-1 text-sm text-muted">Agenda la instalación de tu GPS · horario 8:00 a 16:00</p>
        </div>
        <AgendaPublica citas={citas} sucursal={{ nombre: SUCURSAL.nombre, direccion: SUCURSAL.direccion ?? "" }} />
        <p className="mt-4 text-center text-xs text-muted">📍 {SUCURSAL.direccion}</p>
      </div>
    </div>
  );
}
