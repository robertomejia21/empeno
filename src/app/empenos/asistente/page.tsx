import { listarClientes, listarEmpenos, listarProductosInteres, obtenerAjustes } from "@/lib/db/repo";
import { PageHeader } from "@/components/ui";
import { AsistenteEmpeno } from "./AsistenteEmpeno";
import { inicioVentanaAcumulacion } from "@/lib/compliance";
import { hoyISO, aISOLocal } from "@/lib/format";

export default async function AsistentePage() {
  const [clientesRaw, empenos, productos, ajustes] = await Promise.all([
    listarClientes(),
    listarEmpenos(),
    listarProductosInteres(true),
    obtenerAjustes(),
  ]);

  const clientes = clientesRaw.map((c) => ({
    id: c.id,
    nombre: `${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno}`.trim(),
    curp: c.curp,
    telefono: c.telefono,
    previos: empenos.filter((e) => e.clienteId === c.id).length,
    acumulado6m: empenos
      .filter((e) => e.clienteId === c.id && e.estado !== "cancelado" && e.estado !== "borrador")
      .filter((e) => aISOLocal(new Date(e.creadoEn)) > inicioVentanaAcumulacion(hoyISO()))
      .reduce((s, e) => s + e.montoPrestado, 0),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Asistente de empeño"
        subtitle="Flujo guiado PRENDAFLEX · Etapa 1: Empeños"
      />
      <AsistenteEmpeno
        clientes={clientes}
        productos={productos}
        reglaPrestamo={ajustes.prestamo}
      />
    </div>
  );
}
