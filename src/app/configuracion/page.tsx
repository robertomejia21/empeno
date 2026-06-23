import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/session";
import { PageHeader, Card, CardHeader } from "@/components/ui";
import {
  EMPRESA,
  UMA_DIARIA_2026,
  UMBRAL_IDENTIFICACION_MXN,
  UMBRAL_AVISO_MXN,
  PRECIO_ORO_24K_GRAMO,
  PRECIO_PLATA_GRAMO,
} from "@/lib/compliance";
import { tasaPorHistorial } from "@/lib/interes";
import { formatMXN } from "@/lib/format";

export default async function ConfiguracionPage() {
  const actual = await getUsuarioActual();
  if (!actual || !["admin", "gerente", "invitado"].includes(actual.rol)) redirect("/");

  const niveles = [0, 4, 6].map((n) => tasaPorHistorial(n));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Configuración" subtitle="Parámetros del sistema y datos de la empresa" />

      <div className="grid gap-6 md:grid-cols-2">
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
          <CardHeader title="Parámetros PLD (LFPIORPI)" />
          <dl className="space-y-3 p-5 text-sm">
            <Linea k="UMA diaria 2026" v={formatMXN(UMA_DIARIA_2026)} />
            <Linea k="Umbral de identificación" v={formatMXN(UMBRAL_IDENTIFICACION_MXN)} />
            <Linea k="Umbral de aviso (SAT/UIF)" v={formatMXN(UMBRAL_AVISO_MXN)} />
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

      <div className="mt-6 rounded-xl border border-info/20 bg-info-soft px-5 py-4 text-sm text-info">
        ℹ️ Estos parámetros están definidos en código (<code>src/lib/compliance.ts</code> e{" "}
        <code>src/lib/interes.ts</code>). El siguiente paso es hacerlos editables desde esta pantalla y
        guardarlos en Supabase para ajustarlos sin re-desplegar.
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
