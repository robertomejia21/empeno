import { listarClientes, listarEmpenos, listarProductosInteres } from "@/lib/db/repo";
import { PageHeader } from "@/components/ui";
import { AsistenteEmpeno } from "./AsistenteEmpeno";

export default async function AsistentePage() {
  const [clientesRaw, empenos, productos] = await Promise.all([
    listarClientes(),
    listarEmpenos(),
    listarProductosInteres(true),
  ]);

  const clientes = clientesRaw.map((c) => ({
    id: c.id,
    nombre: `${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno}`.trim(),
    curp: c.curp,
    telefono: c.telefono,
    previos: empenos.filter((e) => e.clienteId === c.id).length,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Asistente de empeño"
        subtitle="Flujo guiado PRENDAFLEX · Etapa 1: Empeños"
      />
      <AsistenteEmpeno clientes={clientes} productos={productos} />
    </div>
  );
}
