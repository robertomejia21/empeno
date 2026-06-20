import Link from "next/link";
import { listarEmpenos, listarClientes, listarVentas } from "@/lib/db/repo";
import {
  evaluarPLD,
  UMA_DIARIA_2026,
  UMBRAL_IDENTIFICACION_UMA,
  UMBRAL_AVISO_UMA,
  UMBRAL_IDENTIFICACION_MXN,
  UMBRAL_AVISO_MXN,
} from "@/lib/compliance";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge } from "@/components/ui";

export default async function CumplimientoPage() {
  const [empenos, clientes, ventas] = await Promise.all([
    listarEmpenos(),
    listarClientes(),
    listarVentas(),
  ]);

  // Operaciones a evaluar: empeños (préstamo) y ventas (precio)
  type Op = { tipo: string; folio: string; monto: number; fecha: string; href: string };
  const ops: Op[] = [
    ...empenos.map((e) => ({
      tipo: "Empeño",
      folio: e.folio,
      monto: e.montoPrestado,
      fecha: e.fechaInicio,
      href: `/empenos/${e.id}`,
    })),
    ...ventas.map((v) => ({
      tipo: "Venta",
      folio: v.folio,
      monto: v.precio,
      fecha: v.fecha,
      href: "/ventas",
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const reportables = ops.filter((o) => evaluarPLD(o.monto).nivel !== "ok");

  // KYC: clientes con expediente incompleto
  const kycIncompleto = clientes.filter((c) => !c.curp || !c.numeroIdentificacion);

  return (
    <div>
      <PageHeader
        title="Cumplimiento PLD"
        subtitle="Prevención de Lavado de Dinero · LFPIORPI / UIF (México)"
      />

      {/* Umbrales */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Umbral de identificación</p>
            <Badge tono="warning">{UMBRAL_IDENTIFICACION_UMA} UMA</Badge>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatMXN(UMBRAL_IDENTIFICACION_MXN)}</p>
          <p className="mt-1 text-xs text-muted">A partir de este monto se integra expediente KYC del cliente.</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Umbral de aviso (SAT/UIF)</p>
            <Badge tono="danger">{UMBRAL_AVISO_UMA} UMA</Badge>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatMXN(UMBRAL_AVISO_MXN)}</p>
          <p className="mt-1 text-xs text-muted">Operaciones en efectivo iguales o mayores se reportan a la autoridad.</p>
        </Card>
      </div>
      <p className="mt-2 text-xs text-muted">
        Base de cálculo: UMA diaria 2026 = {formatMXN(UMA_DIARIA_2026)}. Avisos mensuales (día 17), informes en
        ceros y avisos en 24 h ante coincidencias con listas UIF.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Operaciones reportables */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Operaciones que requieren atención"
            subtitle={`${reportables.length} sobre umbral · ${ops.length} operaciones totales`}
          />
          {reportables.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Ninguna operación supera los umbrales LFPIORPI. ✅
            </p>
          ) : (
            <div className="divide-y divide-border">
              {reportables.map((o) => {
                const ev = evaluarPLD(o.monto);
                return (
                  <Link
                    key={o.folio}
                    href={o.href}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {o.tipo} {o.folio}
                      </p>
                      <p className="text-xs text-muted">{formatFecha(o.fecha)} · {formatMXN(o.monto)}</p>
                    </div>
                    <Badge tono={ev.nivel === "aviso" ? "danger" : "warning"}>{ev.etiqueta}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* KYC */}
        <Card>
          <CardHeader title="Expedientes KYC" />
          <div className="p-5">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{clientes.length - kycIncompleto.length}</p>
              <p className="text-sm text-muted">/ {clientes.length} completos</p>
            </div>
            {kycIncompleto.length > 0 ? (
              <>
                <p className="mt-3 text-xs font-medium text-warning">
                  {kycIncompleto.length} con datos faltantes (CURP / identificación):
                </p>
                <ul className="mt-2 space-y-1">
                  {kycIncompleto.slice(0, 8).map((c) => (
                    <li key={c.id}>
                      <Link href={`/clientes/${c.id}`} className="text-sm text-primary hover:underline">
                        {c.nombre} {c.apellidoPaterno}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-sm text-success">Todos los expedientes están completos. ✅</p>
            )}
          </div>
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted">
        Nota: esta vista es una guía operativa. Los umbrales y obligaciones deben validarse con tu oficial de
        cumplimiento y la normativa vigente (LFPIORPI, NOM-179-SCFI, disposiciones de la UIF/SAT y PROFECO).
      </p>
    </div>
  );
}
