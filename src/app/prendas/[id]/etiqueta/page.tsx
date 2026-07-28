import { notFound } from "next/navigation";
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
    <div className="mx-auto max-w-md p-6">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton>🖨️ Imprimir etiqueta</PrintButton>
      </div>
      <div className="mx-auto w-[260px] rounded-lg border-2 border-black bg-white p-3 text-center text-black">
        <p className="text-[11px] font-bold uppercase tracking-wide">{PROVEEDOR.marca}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt={p.folio} className="mx-auto my-2 h-40 w-40" />
        <p className="text-lg font-bold leading-none">{p.folio}</p>
        <p className="mt-1 text-xs">{p.descripcion}</p>
        {detalle && <p className="text-[11px] text-gray-700">{detalle}</p>}
      </div>
    </div>
  );
}
