import { listarPrendasEnVenta, listarVentas, listarPrendas } from "@/lib/db/repo";
import { registrarVenta } from "@/lib/actions";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, EmptyState, Badge } from "@/components/ui";
import { ConfirmSubmit } from "@/components/actions-ui";

export default async function VentasPage() {
  const [enVenta, ventas, prendas] = await Promise.all([
    listarPrendasEnVenta(),
    listarVentas(),
    listarPrendas(),
  ]);

  const totalVendido = ventas.reduce((s, v) => s + v.precio, 0);
  const prendaDe = (id: string) => prendas.find((p) => p.id === id);

  return (
    <div>
      <PageHeader
        title="Punto de venta"
        subtitle={`${enVenta.length} prendas disponibles · ${formatMXN(totalVendido)} vendido histórico`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Prendas a la venta */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Prendas a la venta" subtitle="Selecciona el precio y registra la venta" />
            {enVenta.length === 0 ? (
              <EmptyState
                titulo="Sin prendas a la venta"
                descripcion="Las prendas aparecen aquí cuando un empeño vencido se envía a remate."
              />
            ) : (
              <div className="divide-y divide-border">
                {enVenta.map((p) => (
                  <form
                    key={p.id}
                    action={registrarVenta}
                    className="flex flex-wrap items-end justify-between gap-3 px-5 py-4"
                  >
                    <input type="hidden" name="prendaId" value={p.id} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {p.folio} · {p.descripcion}
                      </p>
                      <p className="text-xs text-muted">
                        {p.categoria} · avalúo {formatMXN(p.valorAvaluo)}
                      </p>
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-muted">Precio</span>
                        <input
                          name="precio"
                          type="number"
                          step="0.01"
                          required
                          defaultValue={p.valorAvaluo}
                          className="w-28 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm focus:border-primary-2 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-2/20"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-muted">Pago</span>
                        <select
                          name="metodoPago"
                          className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm focus:border-primary-2 focus:bg-surface focus:outline-none"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="tarjeta">Tarjeta</option>
                          <option value="transferencia">Transferencia</option>
                        </select>
                      </label>
                      <ConfirmSubmit confirmacion={`¿Registrar la venta de ${p.descripcion}?`}>
                        Vender
                      </ConfirmSubmit>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Ventas recientes */}
        <Card>
          <CardHeader title="Ventas recientes" />
          {ventas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Aún no hay ventas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {ventas.slice(0, 12).map((v) => {
                const p = prendaDe(v.prendaId);
                return (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {v.folio} · {p?.descripcion ?? "Prenda"}
                      </p>
                      <p className="text-xs text-muted">
                        {formatFecha(v.fecha)} · <Badge tono="muted">{v.metodoPago}</Badge>
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-success">{formatMXN(v.precio)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
