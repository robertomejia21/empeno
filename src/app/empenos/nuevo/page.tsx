import { listarClientes, listarPrendasDisponibles, listarEmpenos } from "@/lib/db/repo";
import { PageHeader } from "@/components/ui";
import { EmpenoForm } from "./EmpenoForm";

export default async function NuevoEmpeno({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const [clientesRaw, prendasRaw, empenos] = await Promise.all([
    listarClientes(),
    listarPrendasDisponibles(),
    listarEmpenos(),
  ]);

  const clientes = clientesRaw.map((c) => ({
    id: c.id,
    nombre: `${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno}`.trim(),
    previos: empenos.filter((e) => e.clienteId === c.id).length,
  }));

  const prendas = prendasRaw.map((p) => ({
    id: p.id,
    folio: p.folio,
    descripcion: p.descripcion,
    montoPrestamoSugerido: p.montoPrestamoSugerido,
    valorAvaluo: p.valorAvaluo,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nuevo empeño" subtitle="Registro del contrato prendario" />
      <EmpenoForm clientes={clientes} prendas={prendas} clienteInicial={cliente} />
    </div>
  );
}
