import { PageHeader } from "@/components/ui";
import { PrendaForm } from "./PrendaForm";

export default function NuevaPrenda() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Registrar prenda"
        subtitle="Captura del bien prendario y avalúo"
      />
      <PrendaForm />
    </div>
  );
}
