import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerEmpeno } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { generarQR, urlPrenda } from "@/lib/qr";
import { SUCURSAL } from "@/lib/negocio";
import { ContratoProfeco } from "@/app/empenos/[id]/contrato/ContratoProfeco";
import { FirmaContrato } from "@/app/empenos/[id]/contrato/FirmaContrato";

export const metadata: Metadata = {
  title: "Firma tu contrato — Turbo Presta El Dorado",
};

export default async function FirmarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empeno = await obtenerEmpeno(id);
  if (!empeno) notFound();

  const calc = calcularLiquidacion(empeno);
  const qrPrenda = await generarQR(urlPrenda(empeno.prenda.id), 130);

  return (
    <div className="min-h-screen bg-surface-2 px-2 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 text-center">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{SUCURSAL.nombre}</h1>
          <p className="mt-1 text-sm text-muted">Revisa y firma tu contrato de empeño {empeno.folio}</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <ContratoProfeco empeno={empeno} calc={calc} qrPrenda={qrPrenda} />
        </div>

        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <FirmaContrato empenoId={empeno.id} yaFirmado={!!empeno.firmaCliente} />
        </div>
      </div>
    </div>
  );
}
