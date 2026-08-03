import { crearProductoInteres, actualizarProductoInteres, eliminarProductoInteres } from "@/lib/actions";
import { Card, CardHeader } from "@/components/ui";
import type { ProductoInteres } from "@/lib/types";

const inputCls = "rounded-lg border border-border bg-surface px-2 py-1.5 text-sm";

export function ProductosInteresConfig({ productos }: { productos: ProductoInteres[] }) {
  return (
    <Card className="mt-6">
      <CardHeader title="Productos de interés (catálogo)" subtitle="Tasas por departamento/modalidad — se usan en el asistente" />

      <div className="overflow-x-auto px-5 pt-2">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2">Producto</th>
              <th className="py-2">Modalidad</th>
              <th className="py-2">Tipo</th>
              <th className="py-2">Periodo</th>
              <th className="py-2 text-right">Tasa %</th>
              <th className="py-2 text-center">Activo</th>
              <th className="py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-b border-border/60">
                <td className="py-2 font-medium text-foreground">{p.nombre}</td>
                <td className="py-2 text-muted">{p.modalidad ?? "—"}</td>
                <td className="py-2 text-muted capitalize">{p.tipo}</td>
                <td className="py-2 text-muted">{p.periodo} · {p.plazoPeriodos}</td>
                <td className="py-2" colSpan={3}>
                  <form action={actualizarProductoInteres.bind(null, p.id)} className="flex items-center justify-end gap-2">
                    <input name="tasa" type="number" step="0.01" defaultValue={p.tasa} className={`${inputCls} w-20 text-right`} />
                    <input name="orden" type="number" defaultValue={p.orden} className={`${inputCls} w-14 text-right`} title="Orden" />
                    <label className="flex items-center gap-1 text-xs text-muted">
                      <input type="checkbox" name="activo" defaultChecked={p.activo} className="h-4 w-4 accent-primary" /> activo
                    </label>
                    <button className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-medium hover:bg-surface-2">Guardar</button>
                  </form>
                </td>
                <td className="py-2 text-right">
                  <form action={eliminarProductoInteres.bind(null, p.id)}>
                    <button className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-danger hover:bg-surface-2">Quitar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={crearProductoInteres} className="m-5 grid gap-2 rounded-xl border border-border bg-surface-2/50 p-4 sm:grid-cols-3 lg:grid-cols-7">
        <input name="nombre" placeholder="Producto (VEHÍCULOS)" required className={inputCls} />
        <select name="modalidad" defaultValue="" className={inputCls}>
          <option value="">Sin modalidad</option>
          <option value="resguardo">Resguardo</option>
          <option value="gps">GPS</option>
        </select>
        <select name="tipo" defaultValue="tradicional" className={inputCls}>
          <option value="tradicional">Tradicional</option>
          <option value="fijo">Fijo</option>
        </select>
        <select name="periodo" defaultValue="mensual" className={inputCls}>
          <option value="mensual">Mensual</option>
          <option value="quincenal">Quincenal</option>
          <option value="semanal">Semanal</option>
        </select>
        <input name="tasa" type="number" step="0.01" placeholder="Tasa %" required className={inputCls} />
        <input name="plazoPeriodos" type="number" defaultValue={1} placeholder="Plazo" className={inputCls} />
        <button className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-fg hover:opacity-90">Agregar producto</button>
      </form>
    </Card>
  );
}
