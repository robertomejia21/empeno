import { PageHeader } from "@/components/ui";
import { PrendaForm } from "./PrendaForm";

export default function NuevaPrenda() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Registrar artículo"
        subtitle="Captura del bien y su avalúo (empeño o compra)"
      />
      <PrendaForm />
    </div>
  );
}
