import { redirect } from "next/navigation";
import { listarCotizaciones, listarEmpenos } from "@/lib/db/repo";
import { getUsuarioActual } from "@/lib/session";
import { coincideTexto } from "@/lib/buscar";
import { Card, CardHeader, PageHeader, SearchForm, EmptyState } from "@/components/ui";
import { AvaluosMecanico } from "./AvaluosMecanico";
import { FotoLavado } from "../empenos/[id]/FotoLavado";

export default async function AvaluosPage({
  searchParams,
}: {
  searchParams: Promise<{ folio?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario || !["mecanico", "admin", "gerente"].includes(usuario.rol)) redirect("/");

  const { folio } = await searchParams;
  const q = (folio ?? "").trim();
  const encontrados = q
    ? (await listarEmpenos()).filter((e) => e.prenda.categoria === "Vehículos" && coincideTexto([e.folio], q))
    : [];

  const vehiculos = (await listarCotizaciones()).filter((c) => c.tipo === "vehiculo");
  const pendientes = vehiculos.filter((c) => c.avaluoEstado === "solicitado");
  const respondidas = vehiculos.filter((c) => c.avaluoEstado === "respondido");

  return (
    <div>
      <PageHeader title="Avalúos de vehículos" subtitle="Da tu retroalimentación sobre el valor real de los autos" />

      <Card className="mb-6">
        <CardHeader title="Foto del vehículo por contrato" subtitle="Busca el número de contrato y sube la foto del auto lavado" />
        <div className="p-5 pb-0">
          <SearchForm q={folio} placeholder="Número de contrato (ej. EM-0012)" />
        </div>
        {q && encontrados.length === 0 ? (
          <EmptyState titulo="Sin resultados" descripcion={`No encontramos un vehículo con el contrato "${q}".`} />
        ) : (
          <ul className="divide-y divide-border">
            {encontrados.map((e) => (
              <li key={e.id} className="space-y-2 px-5 py-4">
                <p className="text-sm font-medium text-foreground">
                  {e.folio} · {e.cliente.nombre} {e.cliente.apellidoPaterno} · {e.prenda.descripcion}
                </p>
                <FotoLavado empenoId={e.id} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AvaluosMecanico pendientes={pendientes} respondidas={respondidas} />
    </div>
  );
}
