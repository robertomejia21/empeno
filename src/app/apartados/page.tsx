import {
  listarApartados,
  listarClientes,
  listarPrendas,
  listarPrendasEnVenta,
} from "@/lib/db/repo";
import { crearApartado, abonarApartado, cancelarApartado } from "@/lib/actions";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, Button, Field, SelectField, Badge, EmptyState } from "@/components/ui";
import { ConfirmSubmit } from "@/components/actions-ui";

export default async function ApartadosPage() {
  const [apartados, clientes, prendas, enVenta] = await Promise.all([
    listarApartados(),
    listarClientes(),
    listarPrendas(),
    listarPrendasEnVenta(),
  ]);

  const clienteDe = (id: string) => clientes.find((c) => c.id === id);
  const prendaDe = (id: string) => prendas.find((p) => p.id === id);

  const opcionesPrenda = enVenta.map((p) => ({
    value: p.id,
    label: `${p.folio} · ${p.descripcion} (${formatMXN(p.valorAvaluo)})`,
  }));
  const opcionesCliente = clientes.map((c) => ({
    value: c.id,
    label: `${c.nombre} ${c.apellidoPaterno}`,
  }));

  const activos = apartados.filter((a) => a.estado === "activo");

  return (
    <div>
      <PageHeader title="Apartados" subtitle={`${activos.length} activos · ${apartados.length} en total`} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Nuevo apartado */}
        <Card className="lg:col-span-1">
          <CardHeader title="Nuevo apartado" subtitle="Reserva con enganche" />
          {enVenta.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              No hay prendas en venta para apartar.
            </p>
          ) : clientes.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Registra un cliente primero.</p>
          ) : (
            <form action={crearApartado} className="space-y-4 p-5">
              <SelectField label="Prenda" name="prendaId" options={opcionesPrenda} required />
              <SelectField label="Cliente" name="clienteId" options={opcionesCliente} required />
              <Field label="Precio total (MXN)" name="precioTotal" type="number" step="0.01" required />
              <Field label="Enganche (MXN)" name="enganche" type="number" step="0.01" />
              <Button type="submit" className="w-full">Crear apartado</Button>
            </form>
          )}
        </Card>

        {/* Lista de apartados */}
        <div className="space-y-4 lg:col-span-2">
          {apartados.length === 0 ? (
            <Card>
              <EmptyState titulo="Sin apartados" descripcion="Crea un apartado reservando una prenda en venta." />
            </Card>
          ) : (
            apartados.map((a) => {
              const saldo = Math.max(0, a.precioTotal - a.abonado);
              const pct = Math.min(100, Math.round((a.abonado / a.precioTotal) * 100));
              const cli = clienteDe(a.clienteId);
              return (
                <Card key={a.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {a.folio} · {prendaDe(a.prendaId)?.descripcion ?? "Prenda"}
                      </p>
                      <p className="text-xs text-muted">
                        {cli ? `${cli.nombre} ${cli.apellidoPaterno}` : "Cliente"} · {formatFecha(a.fecha)}
                      </p>
                    </div>
                    <Badge tono={a.estado === "liquidado" ? "success" : a.estado === "cancelado" ? "muted" : "info"}>
                      {a.estado}
                    </Badge>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>Abonado {formatMXN(a.abonado)}</span>
                      <span>Total {formatMXN(a.precioTotal)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                      <div className="bg-gold-gradient h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-medium text-foreground">
                      Saldo: {formatMXN(saldo)} ({pct}%)
                    </p>
                  </div>

                  {a.estado === "activo" && (
                    <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
                      <form action={abonarApartado.bind(null, a.id)} className="flex items-end gap-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-[11px] text-muted">Abono</span>
                          <input
                            name="monto"
                            type="number"
                            step="0.01"
                            required
                            defaultValue={saldo}
                            className="w-28 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm focus:border-primary-2 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-2/20"
                          />
                        </label>
                        <ConfirmSubmit confirmacion="¿Registrar este abono?">Abonar</ConfirmSubmit>
                      </form>
                      <form action={cancelarApartado.bind(null, a.id)}>
                        <ConfirmSubmit variante="secondary" confirmacion="¿Cancelar el apartado? La prenda vuelve a estar en venta.">
                          Cancelar
                        </ConfirmSubmit>
                      </form>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
