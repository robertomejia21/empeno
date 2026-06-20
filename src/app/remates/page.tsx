import Link from "next/link";
import { listarEmpenos, listarPrendasEnVenta } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { enviarARemate } from "@/lib/actions";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, EmptyState } from "@/components/ui";
import { ConfirmSubmit } from "@/components/actions-ui";

export default async function RematesPage() {
  const [empenos, enVenta] = await Promise.all([
    listarEmpenos(),
    listarPrendasEnVenta(),
  ]);

  const vencidos = empenos
    .filter((e) => e.estado === "activo" || e.estado === "refrendado")
    .map((e) => ({ e, calc: calcularLiquidacion(e) }))
    .filter((x) => x.calc.vencido)
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);

  return (
    <div>
      <PageHeader
        title="Remates"
        subtitle="Empeños vencidos que pueden pasar a venta"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Vencidos por rematar"
            subtitle={`${vencidos.length} empeños superaron el plazo y días de gracia`}
          />
          {vencidos.length === 0 ? (
            <EmptyState
              titulo="Sin vencidos"
              descripcion="No hay empeños vencidos pendientes de remate. 🎉"
            />
          ) : (
            <div className="divide-y divide-border">
              {vencidos.map(({ e, calc }) => (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/empenos/${e.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                      {e.folio} · {e.prenda.descripcion}
                    </Link>
                    <p className="text-xs text-muted">
                      {e.cliente.nombre} {e.cliente.apellidoPaterno} · venció{" "}
                      {formatFecha(e.fechaVencimiento)} · {Math.abs(calc.diasParaVencer)} días
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted">avalúo {formatMXN(e.prenda.valorAvaluo)}</span>
                    <form action={enviarARemate.bind(null, e.id)}>
                      <ConfirmSubmit
                        variante="danger"
                        confirmacion={`¿Enviar ${e.folio} a remate? La prenda pasará a estar en venta.`}
                      >
                        Enviar a remate
                      </ConfirmSubmit>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="En venta" subtitle="Prendas listas para vender" />
          <div className="p-5">
            <p className="text-3xl font-bold text-primary">{enVenta.length}</p>
            <p className="mt-1 text-sm text-muted">prendas a la venta</p>
            <Link href="/ventas" className="mt-4 inline-block text-sm font-medium text-primary">
              Ir al punto de venta →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
