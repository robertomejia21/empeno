import { redirect } from "next/navigation";
import { listarCotizaciones } from "@/lib/db/repo";
import { getUsuarioActual } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { AvaluosMecanico } from "./AvaluosMecanico";

export default async function AvaluosPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || !["mecanico", "admin", "gerente"].includes(usuario.rol)) redirect("/");

  const vehiculos = (await listarCotizaciones()).filter((c) => c.tipo === "vehiculo");
  const pendientes = vehiculos.filter((c) => c.avaluoEstado === "solicitado");
  const respondidas = vehiculos.filter((c) => c.avaluoEstado === "respondido");

  return (
    <div>
      <PageHeader title="Avalúos de vehículos" subtitle="Da tu retroalimentación sobre el valor real de los autos" />
      <AvaluosMecanico pendientes={pendientes} respondidas={respondidas} />
    </div>
  );
}
