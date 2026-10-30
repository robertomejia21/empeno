import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { obtenerPrenda } from "@/lib/db/repo";
import { generarQR, urlPrenda } from "@/lib/qr";
import { PROVEEDOR } from "@/lib/negocio";
import { PrintButton } from "@/components/actions-ui";

export default async function EtiquetaPrenda({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await obtenerPrenda(id);
  if (!p) notFound();

  const qr = await generarQR(urlPrenda(p.id), 320);
  const detalle = [p.marca, p.submarca, p.modelo].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-md p-4 sm:p-6">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton>
          <Printer className="h-4 w-4" aria-hidden /> Imprimir etiqueta
        </PrintButton>
      </div>
      <div className="mx-auto w-[260px] max-w-full rounded-xl border-2 border-black bg-white p-3 text-center text-black">
        <p className="text-[11px] font-bold uppercase tracking-wide">{PROVEEDOR.marca}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt={p.folio} className="mx-auto my-2 h-40 w-40" />
        <p className="text-lg font-bold leading-none">{p.folio}</p>
        <p className="mt-1 break-words text-xs">{p.descripcion}</p>
        {detalle && <p className="text-[11px] text-black/70">{detalle}</p>}
      </div>
    </div>
  );
}
