import { listarAutorizaciones } from "@/lib/db/repo";
import { getUsuarioActual } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { BandejaAutorizaciones } from "./BandejaAutorizaciones";

export default async function AutorizacionesPage() {
  const [autorizaciones, usuario] = await Promise.all([listarAutorizaciones(), getUsuarioActual()]);
  const puedeResolver = usuario?.rol === "admin" || usuario?.rol === "gerente";

  return (
    <div>
      <PageHeader
        title="Autorizaciones"
        subtitle="Aprobaciones de Dirección General (tasas especiales y excepciones)"
      />
      <BandejaAutorizaciones autorizaciones={autorizaciones} puedeResolver={puedeResolver} />
    </div>
  );
}
