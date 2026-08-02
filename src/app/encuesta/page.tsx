import type { Metadata } from "next";
import { SUCURSAL } from "@/lib/negocio";
import { EncuestaForm } from "./EncuestaForm";

export const metadata: Metadata = {
  title: "Encuesta de satisfacción — Turbo Presta El Dorado",
};

export default function EncuestaPage() {
  return (
    <div className="min-h-screen bg-surface-2 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{SUCURSAL.nombre}</h1>
          <p className="mt-1 text-lg font-semibold text-foreground">Encuesta de satisfacción</p>
          <p className="mt-1 text-sm text-muted">
            Su opinión es muy valiosa para mejorar nuestro servicio. Le pedimos responder las siguientes preguntas.
          </p>
        </div>
        <EncuestaForm />
      </div>
    </div>
  );
}
