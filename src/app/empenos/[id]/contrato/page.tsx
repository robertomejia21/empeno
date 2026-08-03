import { notFound } from "next/navigation";
import { obtenerEmpeno } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { getUsuarioActual } from "@/lib/session";
import { generarQR, urlPrenda } from "@/lib/qr";
import { enviarContratoWhatsApp } from "@/lib/actions";
import { PageHeader, VolverLink, Card } from "@/components/ui";
import { PrintButton, ConfirmSubmit } from "@/components/actions-ui";
import { ContratoProfeco } from "./ContratoProfeco";
import { FirmaContrato } from "./FirmaContrato";

export default async function ContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empeno = await obtenerEmpeno(id);
  if (!empeno) notFound();

  const calc = calcularLiquidacion(empeno);
  const usuario = await getUsuarioActual();
  const invitado = usuario?.rol === "invitado";
  const qrPrenda = await generarQR(urlPrenda(empeno.prenda.id), 130);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="no-print">
        <VolverLink href={`/empenos/${empeno.id}`} label={`Empeño ${empeno.folio}`} />
        <PageHeader
          title="Contrato de mutuo (PROFECO)"
          subtitle={`Empeño ${empeno.folio}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              {!invitado && (
                <form action={enviarContratoWhatsApp.bind(null, empeno.id)}>
                  <ConfirmSubmit variante="secondary" confirmacion="¿Enviar el contrato al cliente por WhatsApp para que lo revise y firme?">
                    📲 Enviar al cliente para firmar
                  </ConfirmSubmit>
                </form>
              )}
              <PrintButton>🖨️ Imprimir / PDF</PrintButton>
            </div>
          }
        />
      </div>

      <div className="shadow-card overflow-x-auto rounded-xl border border-border">
        <ContratoProfeco empeno={empeno} calc={calc} qrPrenda={qrPrenda} />
      </div>

      {!invitado && (
        <Card className="no-print mt-6 p-5">
          <FirmaContrato empenoId={empeno.id} yaFirmado={!!empeno.firmaCliente} />
        </Card>
      )}
    </div>
  );
}
