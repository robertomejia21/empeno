import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/session";
import { listarProductosInteres, obtenerAjustes } from "@/lib/db/repo";
import { AjustesConfig } from "./AjustesConfig";
import { PageHeader, Card, CardHeader } from "@/components/ui";
import { ProductosInteresConfig } from "./ProductosInteresConfig";
import {
  EMPRESA,
  UMA_DIARIA_2026,
  UMBRAL_IDENTIFICACION_MXN,
  UMBRAL_AVISO_MXN,
  ACTIVIDADES_PLD,
  umaAMXN,
  PRECIO_ORO_24K_GRAMO,
  PRECIO_PLATA_GRAMO,
} from "@/lib/compliance";
import { tasaPorHistorial } from "@/lib/interes";
import { formatMXN } from "@/lib/format";

export default async function ConfiguracionPage() {
  const actual = await getUsuarioActual();
  if (!actual || !["admin", "gerente", "invitado"].includes(actual.rol)) redirect("/");

  const niveles = [0, 4, 6].map((n) => tasaPorHistorial(n));
  const [productos, ajustes] = await Promise.all([listarProductosInteres(), obtenerAjustes()]);

  return (
    <div>
      <PageHeader title="Configuración" subtitle="Parámetros del sistema y datos de la empresa" />

      <AjustesConfig ajustes={ajustes} editable={actual.rol === "admin"} />

      <div className="mt-6 grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
        <Card>
          <CardHeader title="Datos de la empresa" />
          <dl className="space-y-3 p-5 text-sm">
            <Linea k="Nombre comercial" v={EMPRESA.nombre} />
            <Linea k="Razón social" v={EMPRESA.razonSocial} />
            <Linea k="RFC" v={EMPRESA.rfc} />
            <Linea k="Registro PROFECO (RPCE)" v={EMPRESA.registroProfeco} />
            <Linea k="Norma aplicable" v={EMPRESA.nom} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Tasas de interés por historial" subtitle="Mensual, según nº de empeños" />
          <div className="space-y-3 p-5">
            {niveles.map((nv) => (
              <div key={nv.nivel} className="flex items-center justify-between text-sm">
                <span className="text-muted">{nv.nivel}</span>
                <span className="font-semibold text-primary">{nv.tasa}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Parámetros PLD (Manual 2026)" subtitle={`UMA diaria ${formatMXN(UMA_DIARIA_2026)}`} />
          <dl className="space-y-3 p-5 text-sm">
            <Linea k="Préstamos — aviso" v={formatMXN(umaAMXN(ACTIVIDADES_PLD.prestamo.avisoUMA))} />
            <Linea k="Joyería/metales — identificación" v={formatMXN(UMBRAL_IDENTIFICACION_MXN)} />
            <Linea k="Joyería/metales — aviso" v={formatMXN(UMBRAL_AVISO_MXN)} />
            <Linea k="Venta de vehículos — aviso" v={formatMXN(umaAMXN(ACTIVIDADES_PLD.vehiculo.avisoUMA))} />
            <Linea k="Vehículos — sin efectivo desde" v={formatMXN(umaAMXN(ACTIVIDADES_PLD.vehiculo.efectivoMaxUMA ?? 0))} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Precios de metales (referencia)" />
          <dl className="space-y-3 p-5 text-sm">
            <Linea k="Oro 24k (MXN/gramo)" v={formatMXN(PRECIO_ORO_24K_GRAMO)} />
            <Linea k="Plata (MXN/gramo)" v={formatMXN(PRECIO_PLATA_GRAMO)} />
          </dl>
        </Card>
      </div>

      {actual.rol === "admin" ? (
        <ProductosInteresConfig productos={productos} />
      ) : (
        <Card className="mt-6">
          <CardHeader
            title="Productos de interés (catálogo)"
            subtitle="Esta sección es exclusiva de Dirección General"
          />
          <p className="px-5 pb-5 text-sm text-muted">
            Las tasas que usa el asistente de empeño solo las edita Dirección General.
          </p>
        </Card>
      )}

      <div className="mt-6 rounded-xl border border-info/20 bg-info-soft px-5 py-4 text-sm text-info">
        ℹ️ Dirección, % de préstamo y días festivos se guardan en Supabase (tabla <code>ajustes</code>) y
        solo los edita Dirección General. Los parámetros PLD y precios de metales siguen definidos en
        código (<code>src/lib/compliance.ts</code>).
      </div>
    </div>
  );
}

function Linea({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium text-foreground">{v}</dd>
    </div>
  );
}
