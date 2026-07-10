import Link from "next/link";
import { listarPrendasEnVenta, listarVentas, listarPrendas } from "@/lib/db/repo";
import { registrarVenta } from "@/lib/actions";
import { formatMXN, formatFecha, hoyISO } from "@/lib/format";
import { Card, CardHeader, PageHeader, EmptyState, Badge } from "@/components/ui";
import { ConfirmSubmit } from "@/components/actions-ui";

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-sm outline-none transition focus:border-primary-2 focus:bg-surface focus:ring-2 focus:ring-primary-2/20";

export default async function VentasPage() {
  const [enVenta, ventas, prendas] = await Promise.all([
    listarPrendasEnVenta(),
    listarVentas(),
    listarPrendas(),
  ]);

  const prendaDe = (id: string) => prendas.find((p) => p.id === id);
  const totalVendido = ventas.reduce((s, v) => s + v.precio, 0);
  const hoy = hoyISO();
  const ventasHoy = ventas.filter((v) => (v.fecha ?? "").slice(0, 10) === hoy);
  const montoHoy = ventasHoy.reduce((s, v) => s + v.precio, 0);

  return (
    <div>
      <PageHeader
        title="Punto de venta"
        subtitle="Registra la venta de artículos en remate"
      />

      {/* Resumen */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ResumenPOS etiqueta="Disponibles" valor={enVenta.length.toString()} icono="🏷️" />
        <ResumenPOS etiqueta="Vendido hoy" valor={formatMXN(montoHoy)} icono="🧾" tono="primary" />
        <ResumenPOS etiqueta="Ventas hoy" valor={ventasHoy.length.toString()} icono="✅" />
        <ResumenPOS etiqueta="Vendido histórico" valor={formatMXN(totalVendido)} icono="💰" tono="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Catálogo de artículos a la venta */}
        <div className="lg:col-span-2">
          {enVenta.length === 0 ? (
            <Card>
              <EmptyState
                titulo="Sin artículos a la venta"
                descripcion="Los artículos aparecen aquí cuando un empeño vencido se envía a remate."
              />
            </Card>
          ) : (
            <>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-foreground">Artículos a la venta</h2>
                <span className="text-xs text-muted">{enVenta.length} disponible(s)</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {enVenta.map((p) => (
                  <form
                    key={p.id}
                    action={registrarVenta}
                    className="shadow-card group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-elevated"
                  >
                    <input type="hidden" name="prendaId" value={p.id} />

                    {/* Foto */}
                    <Link href={`/prendas/${p.id}`} className="relative block aspect-square overflow-hidden bg-surface-2">
                      {p.fotos[0] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.fotos[0]} alt={p.descripcion} className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-4xl text-muted">📦</span>
                      )}
                      <span className="absolute left-2 top-2">
                        <Badge tono="muted">{p.categoria}</Badge>
                      </span>
                    </Link>

                    {/* Datos + venta */}
                    <div className="flex flex-1 flex-col p-4">
                      <p className="line-clamp-2 text-sm font-semibold text-foreground">{p.descripcion}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {p.folio} · avalúo {formatMXN(p.valorAvaluo)}
                      </p>

                      <div className="mt-3 space-y-2">
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-medium text-muted">Precio de venta</span>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                            <input
                              name="precio"
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              defaultValue={p.valorAvaluo}
                              className={`${inputCls} pl-6 text-base font-semibold text-foreground`}
                            />
                          </div>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-medium text-muted">Método de pago</span>
                          <select name="metodoPago" className={inputCls}>
                            <option value="efectivo">💵 Efectivo</option>
                            <option value="tarjeta">💳 Tarjeta</option>
                            <option value="transferencia">🏦 Transferencia</option>
                          </select>
                        </label>
                      </div>

                      <div className="mt-3">
                        <ConfirmSubmit
                          confirmacion={`¿Registrar la venta de ${p.descripcion}?`}
                          className="w-full"
                        >
                          🛒 Vender
                        </ConfirmSubmit>
                      </div>
                    </div>
                  </form>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Ventas recientes */}
        <Card className="self-start">
          <CardHeader title="Ventas recientes" subtitle={`${ventas.length} en total`} />
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
                        {v.folio} · {p?.descripcion ?? "Artículo"}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                        {formatFecha(v.fecha)} <Badge tono="muted">{v.metodoPago}</Badge>
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-success">{formatMXN(v.precio)}</span>
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

function ResumenPOS({
  etiqueta, valor, icono, tono = "muted",
}: {
  etiqueta: string; valor: string; icono: string; tono?: "muted" | "primary" | "success";
}) {
  const color = tono === "primary" ? "text-primary" : tono === "success" ? "text-success" : "text-foreground";
  const iconBg = tono === "primary" ? "bg-primary-soft" : tono === "success" ? "bg-success-soft" : "bg-surface-2";
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[13px] font-medium text-muted">{etiqueta}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm ${iconBg}`}>{icono}</span>
      </div>
      <p className={`mt-2 text-xl font-bold leading-none tracking-tight tabular-nums sm:text-2xl ${color}`}>{valor}</p>
    </Card>
  );
}
