import { PageHeader } from "@/components/ui";
import { PrendaForm } from "./PrendaForm";
import { obtenerAjustes } from "@/lib/db/repo";

export default async function NuevaPrenda() {
  const { prestamo } = await obtenerAjustes();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Registrar artículo"
        subtitle="Captura del bien y su avalúo (empeño o compra)"
      />
      <PrendaForm reglaPrestamo={prestamo} />
    </div>
  );
}
