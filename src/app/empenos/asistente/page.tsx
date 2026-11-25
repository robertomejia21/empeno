import { listarClientes, listarEmpenos, listarProductosInteres, obtenerAjustes, obtenerCotizacion } from "@/lib/db/repo";
import { PageHeader } from "@/components/ui";
import { AsistenteEmpeno, type CotizacionPrefill } from "./AsistenteEmpeno";
import { inicioVentanaAcumulacion } from "@/lib/compliance";
import { hoyISO, aISOLocal } from "@/lib/format";

const soloDigitos = (t: string | null | undefined) => (t ?? "").replace(/\D/g, "").slice(-10);

export default async function AsistentePage({ searchParams }: { searchParams: Promise<{ cotizacion?: string }> }) {
  const { cotizacion: cotizacionId } = await searchParams;
  const [clientesRaw, empenos, productos, ajustes, cot] = await Promise.all([
    listarClientes(),
    listarEmpenos(),
    listarProductosInteres(true),
    obtenerAjustes(),
    cotizacionId ? obtenerCotizacion(cotizacionId) : Promise.resolve(null),
  ]);

  // Conversión de una cotización: se precargan bien, avalúo, monto y prospecto.
  // Si el teléfono del prospecto coincide con un cliente ya registrado, se usa ese cliente.
  let cotizacion: CotizacionPrefill | null = null;
  if (cot) {
    const tel = soloDigitos(cot.prospectoTelefono);
    const clientePorTel = tel.length === 10 ? clientesRaw.find((c) => soloDigitos(c.telefono) === tel) : undefined;
    cotizacion = {
      id: cot.id,
      folio: cot.folio,
      categoria: cot.categoria,
      descripcion: cot.descripcion,
      marca: cot.marca,
      submarca: cot.submarca,
      modelo: cot.modelo,
      serie: cot.serie,
      placas: cot.placas,
      metal: cot.metal,
      kilataje: cot.kilataje,
      gramos: cot.gramos,
      kilometraje: cot.kilometraje,
      valorAvaluo: cot.avaluoMecanico ?? cot.valorEstimado ?? cot.valorMercado,
      monto: cot.prestamoOfrecido,
      fotos: cot.fotos ?? [],
      notas: cot.notas,
      clienteId: cot.clienteId ?? clientePorTel?.id ?? null,
      prospectoNombre: cot.prospectoNombre,
      prospectoTelefono: cot.prospectoTelefono,
    };
  }

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
        subtitle={cotizacion ? `Conversión de la cotización ${cotizacion.folio}` : "Flujo guiado PRENDAFLEX · Etapa 1: Empeños"}
      />
      <AsistenteEmpeno
        clientes={clientes}
        productos={productos}
        reglaPrestamo={ajustes.prestamo}
        cotizacion={cotizacion}
      />
    </div>
  );
}
