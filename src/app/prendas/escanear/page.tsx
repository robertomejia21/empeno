import { PageHeader } from "@/components/ui";
import { Escaner } from "./Escaner";

export default function EscanearPage() {
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Escanear prenda" subtitle="Lee el código QR para abrir la ficha de la prenda" />
      <Escaner />
    </div>
  );
}
