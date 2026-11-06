import Link from "next/link";
import { listarEmpenos, listarClientes, listarVentas, listarCompras, listarPrendas } from "@/lib/db/repo";
import {
  ACTIVIDADES_PLD,
  UMA_DIARIA_2026,
  UMA_VIGENCIA,
  MESES_ACUMULACION,
  PCT_ALERTA_PREVIA_AVISO,
  umaAMXN,
  evaluarOperacionPLD,
  acumuladoCliente,
  construirOperacionesPLD,
  type ActividadPLD,
} from "@/lib/compliance";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, Badge } from "@/components/ui";
import { CircleCheck } from "lucide-react";

export const metadata = { title: "Cumplimiento PLD" };

const ORDEN_NIVEL = { efectivo_prohibido: 0, aviso: 1, cerca_aviso: 2, identificacion: 3, ok: 4 } as const;

export default async function CumplimientoPage() {
  const [empenos, clientes, ventas, compras, prendas] = await Promise.all([
    listarEmpenos(),
    listarClientes(),
    listarVentas(),
    listarCompras(),
    listarPrendas(),
  ]);

  const categoria = new Map(prendas.map((p) => [p.id, p.categoria]));
  const clientePorId = new Map(clientes.map((c) => [c.id, c]));
  const ops = construirOperacionesPLD({ empenos, ventas, compras, categoriaPrenda: (id) => categoria.get(id) });

  // Expediente completo = CURP + identificación oficial (el préstamo exige identificar SIEMPRE).
  const expedienteCompleto = (clienteId: string | null) => {
    const c = clienteId ? clientePorId.get(clienteId) : null;
    return Boolean(c && c.curp && c.numeroIdentificacion);
  };

  const evaluadas = ops.map((o) => {
    const acumulado = acumuladoCliente(ops, o.clienteId, o.actividad, o.fecha);
    const ev = evaluarOperacionPLD(o.actividad, o.monto, acumulado, o.efectivo);
    const sinExpediente = ev.requiereIdentificacion && !expedienteCompleto(o.clienteId);
    return { o, ev, acumulado, sinExpediente };
  });

  const atencion = evaluadas
    .filter((x) => x.ev.nivel === "aviso" || x.ev.nivel === "cerca_aviso" || x.ev.nivel === "efectivo_prohibido" || x.ev.nivel === "identificacion" || x.sinExpediente)
    .sort((a, b) => ORDEN_NIVEL[a.ev.nivel] - ORDEN_NIVEL[b.ev.nivel] || b.o.fecha.localeCompare(a.o.fecha));

  const kycIncompleto = clientes.filter((c) => !c.curp || !c.numeroIdentificacion);
  const nombreCliente = (id: string | null) => {
    const c = id ? clientePorId.get(id) : null;
    return c ? `${c.nombre} ${c.apellidoPaterno}`.trim() : "Sin cliente";
  };

  return (
    <div>
      <PageHeader
        title="Cumplimiento PLD"
        subtitle="Manual PLD Integrado 2026 · LFPIORPI art. 17 fracc. IV, VI y VIII"
      />

      {/* Umbrales por actividad */}
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(ACTIVIDADES_PLD) as ActividadPLD[]).map((k) => {
          const r = ACTIVIDADES_PLD[k];
          return (
            <Card key={k} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{r.nombre}</p>
                <Badge tono="muted">Fracc. {r.fraccion}</Badge>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Identificación</dt>
                  <dd className="font-semibold text-foreground">
                    {r.identificacionUMA === null ? "Siempre" : `${formatMXN(umaAMXN(r.identificacionUMA))}`}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Aviso UIF/SAT</dt>
                  <dd className="font-semibold text-danger">{formatMXN(umaAMXN(r.avisoUMA))}</dd>
                </div>
                {r.efectivoMaxUMA !== null && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Sin efectivo desde</dt>
                    <dd className="font-semibold text-warning">{formatMXN(umaAMXN(r.efectivoMaxUMA))}</dd>
                  </div>
                )}
              </dl>
            </Card>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        UMA diaria {formatMXN(UMA_DIARIA_2026)} (vigente del {UMA_VIGENCIA}). Para el Aviso se acumulan las operaciones
        del mismo cliente y actividad en {MESES_ACUMULACION} meses móviles; se alerta al llegar al{" "}
        {PCT_ALERTA_PREVIA_AVISO}% del umbral. Avisos a más tardar el día 17 del mes siguiente; Aviso en 24 h ante
        coincidencias con listas o sospecha fundada.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader
            title="Operaciones que requieren atención"
            subtitle={`${atencion.length} con alerta · ${ops.length} operaciones vulnerables`}
          />
          {atencion.length === 0 ? (
            <p className="flex items-center justify-center gap-2 px-5 py-8 text-center text-sm text-muted">
              <CircleCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
              Ninguna operación requiere atención.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {atencion.map(({ o, ev, acumulado, sinExpediente }) => (
                <Link
                  key={`${o.tipo}-${o.folio}`}
                  href={o.href}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {o.tipo} {o.folio} · {nombreCliente(o.clienteId)}
                    </p>
                    <p className="text-xs text-muted">
                      {formatFecha(o.fecha)} · {formatMXN(o.monto)}
                      {acumulado > o.monto && ` · acumulado ${MESES_ACUMULACION} meses: ${formatMXN(acumulado)}`}
                      {o.efectivo && " · efectivo"}
                    </p>
                  </div>
                  <span className="flex shrink-0 flex-wrap gap-1">
                    {ev.nivel !== "ok" && (
                      <Badge tono={ev.nivel === "identificacion" ? "warning" : ev.nivel === "cerca_aviso" ? "warning" : "danger"}>
                        {ev.etiqueta}
                      </Badge>
                    )}
                    {sinExpediente && <Badge tono="danger">Expediente incompleto</Badge>}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Expedientes de clientes" subtitle="En préstamos la identificación es obligatoria siempre" />
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
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-success">
                <CircleCheck className="h-4 w-4 shrink-0" aria-hidden />
                Todos los expedientes están completos.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Señales de alerta a vigilar" subtitle="Manual PLD, sección XVI — se documentan y analizan con el Encargado de Cumplimiento" />
        <ul className="grid gap-x-6 gap-y-1 p-5 text-sm text-muted sm:grid-cols-2">
          {[
            "Numerosas operaciones pequeñas o intentos de dividir operaciones",
            "Evita entregar identificación o documentos de baja calidad",
            "Uso frecuente de terceros / actúa por cuenta de otra persona",
            "Empeño repetitivo de bienes de alto valor",
            "Desinterés por recuperar la prenda o por el monto del préstamo",
            "Vehículos con documentación inconsistente o NIV que no coincide",
            "Pignorante que desconoce características básicas del bien",
            "Uso de efectivo en circunstancias inusuales",
            "Operaciones con PEP o personas en listas (UIF, ONU)",
            "Precio de venta muy distinto del valor comercial sin explicación",
          ].map((t) => (
            <li key={t}>• {t}</li>
          ))}
        </ul>
      </Card>

      <p className="mt-6 text-xs text-muted">
        Pendiente de criterio legal (manual, sección VIII): si los umbrales se calculan sin IVA y si la restricción de
        efectivo aplica sobre el monto total pagado. Esta vista es una guía operativa; las decisiones las documenta el
        Representante Encargado de Cumplimiento.
      </p>
    </div>
  );
}
