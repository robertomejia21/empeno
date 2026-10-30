import Link from "next/link";
import { listarEmpenos, listarPrendasEnVenta } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { enviarARemate } from "@/lib/actions";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, EmptyState, SearchForm } from "@/components/ui";
import { ConfirmSubmit } from "@/components/actions-ui";
import { coincideTexto } from "@/lib/buscar";
import { ArrowRight, Gavel } from "lucide-react";

export default async function RematesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [empenos, enVenta] = await Promise.all([
    listarEmpenos(),
    listarPrendasEnVenta(),
  ]);

  const t = (q ?? "").trim();
  const vencidos = empenos
    .filter((e) => e.estado === "activo" || e.estado === "refrendado")
    .map((e) => ({ e, calc: calcularLiquidacion(e) }))
    .filter((x) => x.calc.vencido)
    .filter((x) =>
      t ? coincideTexto([x.e.folio, x.e.prenda.descripcion, x.e.cliente.nombre, x.e.cliente.apellidoPaterno], t) : true
    )
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);

  return (
    <div>
      <PageHeader
        title="Remates"
        subtitle="Empeños vencidos que pueden pasar a venta"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader
            title="Vencidos por rematar"
            subtitle={t ? `${vencidos.length} resultado(s) para "${q}"` : `${vencidos.length} empeños superaron el plazo y días de gracia`}
          />
          <div className="px-4 pt-4 sm:px-5">
            <SearchForm q={q} placeholder="Buscar por folio, cliente, prenda…" />
          </div>
          {vencidos.length === 0 ? (
            <EmptyState
              titulo={t ? "Sin resultados" : "Sin vencidos"}
              descripcion={t ? "No hay vencidos que coincidan con la búsqueda." : "No hay empeños vencidos pendientes de remate."}
            />
          ) : (
            <div className="divide-y divide-border">
              {vencidos.map(({ e, calc }) => (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1 basis-56">
                    <Link href={`/empenos/${e.id}`} className="wrap-break-word text-sm font-medium text-foreground hover:text-primary">
                      {e.folio} · {e.prenda.descripcion}
                    </Link>
                    <p className="text-xs text-muted">
                      {e.cliente.nombre} {e.cliente.apellidoPaterno} · venció{" "}
                      {formatFecha(e.fechaVencimiento)} · {Math.abs(calc.diasParaVencer)} días
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm tabular-nums text-muted">avalúo {formatMXN(e.prenda.valorAvaluo)}</span>
                    <form action={enviarARemate.bind(null, e.id)}>
                      <ConfirmSubmit
                        variante="warning"
                        confirmacion={`¿Enviar ${e.folio} a remate? La prenda pasará a estar en venta.`}
                      >
                        <Gavel className="h-4 w-4" aria-hidden />
                        Enviar a remate
                      </ConfirmSubmit>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="self-start">
          <CardHeader title="En venta" subtitle="Prendas listas para vender" />
          <div className="p-5">
            <p className="text-3xl font-bold text-primary">{enVenta.length}</p>
            <p className="mt-1 text-sm text-muted">prendas a la venta</p>
            <Link href="/ventas" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              Ir al punto de venta
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
