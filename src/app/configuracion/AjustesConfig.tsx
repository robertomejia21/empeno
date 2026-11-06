import {
  guardarAjustesDireccion,
  guardarAjustesPrestamo,
  guardarAjustesDesempeno,
  agregarDiaFestivo,
  eliminarDiaFestivo,
  cargarFestivosOficiales,
} from "@/lib/actions";
import { Card, CardHeader } from "@/components/ui";
import { formatMXN, formatFecha } from "@/lib/format";
import type { Ajustes } from "@/lib/ajustesBase";

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm disabled:opacity-60";
const btnCls = "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90";

function Campo({ label, children, ayuda }: { label: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
      {ayuda && <span className="block text-xs text-muted">{ayuda}</span>}
    </label>
  );
}

export function AjustesConfig({ ajustes, editable }: { ajustes: Ajustes; editable: boolean }) {
  const { direccion, prestamo, festivos, desempeno } = ajustes;
  const anioActual = new Date().getFullYear();
  const proximos = festivos.filter((f) => f.fecha >= `${anioActual}-01-01`);
  const pasados = festivos.length - proximos.length;

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader title="Dirección" subtitle="Recibe los reportes y las alertas de autorización" />
        <form action={guardarAjustesDireccion} className="space-y-3 p-5">
          <Campo label="Correo de Dirección">
            <input name="correo" type="email" defaultValue={direccion.correo} disabled={!editable} className={inputCls} />
          </Campo>
          <Campo label="WhatsApp de Dirección" ayuda="Con lada de país, ej. 5216861571095">
            <input name="whatsapp" inputMode="numeric" defaultValue={direccion.whatsapp} disabled={!editable} className={inputCls} />
          </Campo>
          {editable && <button className={btnCls}>Guardar</button>}
        </form>
      </Card>

      <Card>
        <CardHeader title="Préstamo sobre avalúo" subtitle="% sugerido en el asistente y en cotizaciones" />
        <form action={guardarAjustesPrestamo} className="space-y-3 p-5">
          <Campo label="Avalúo límite (MXN)" ayuda={`Hoy: ${formatMXN(prestamo.umbral)}`}>
            <input name="umbral" type="number" min={0} step="100" defaultValue={prestamo.umbral} disabled={!editable} className={inputCls} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="% hasta el límite">
              <input name="pctHastaUmbral" type="number" min={1} max={100} step="0.5" defaultValue={prestamo.pctHastaUmbral} disabled={!editable} className={inputCls} />
            </Campo>
            <Campo label="% arriba del límite">
              <input name="pctArribaUmbral" type="number" min={1} max={100} step="0.5" defaultValue={prestamo.pctArribaUmbral} disabled={!editable} className={inputCls} />
            </Campo>
          </div>
          <p className="text-xs text-muted">
            Ej.: avalúo de {formatMXN(prestamo.umbral)} → préstamo de{" "}
            {formatMXN((prestamo.umbral * prestamo.pctHastaUmbral) / 100)}; avalúo de{" "}
            {formatMXN(prestamo.umbral * 2)} → {formatMXN((prestamo.umbral * 2 * prestamo.pctArribaUmbral) / 100)}.
          </p>
          {editable && <button className={btnCls}>Guardar</button>}
        </form>
      </Card>

      <Card>
        <CardHeader title="Cobro al desempeñar" subtitle="Interés del mes en curso cuando el cliente liquida antes de tiempo" />
        <form action={guardarAjustesDesempeno} className="space-y-3 p-5">
          {(
            [
              ["proporcional", "Proporcional por días", "Solo los días transcurridos del mes (carátula PROFECO: tasa ÷ días del periodo × días transcurridos)."],
              ["gracia", "Gracia de días", "Si liquida en los primeros días de un mes nuevo no se cobra ese mes; después, el mes completo (como el sistema anterior)."],
              ["completo", "Mes completo", "Siempre se cobra el mes completo aunque liquide antes."],
            ] as const
          ).map(([valor, titulo, ayuda]) => (
            <label key={valor} className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40">
              <input type="radio" name="modo" value={valor} defaultChecked={desempeno.modo === valor} disabled={!editable} className="mt-0.5 accent-primary" />
              <span>
                <span className="font-medium text-foreground">{titulo}</span>
                <span className="block text-xs text-muted">{ayuda}</span>
              </span>
            </label>
          ))}
          <Campo label="Días de gracia (modo gracia)">
            <input name="diasGracia" type="number" min={0} max={15} defaultValue={desempeno.diasGracia} disabled={!editable} className={inputCls} />
          </Campo>
          {editable && <button className={btnCls}>Guardar</button>}
        </form>
      </Card>

      <Card className="md:col-span-2 xl:col-span-3">
        <CardHeader
          title="Días festivos (sucursal cerrada)"
          subtitle="Junto con los domingos, estos días no cuentan como día de retraso ni generan moratorios"
        />
        <div className="space-y-4 p-5">
          {proximos.length === 0 ? (
            <p className="text-sm text-muted">
              No hay días festivos dados de alta para {anioActual}. Por ahora solo se excluyen los domingos.
            </p>
          ) : (
            <ul className="divide-y divide-border/60 rounded-xl border border-border">
              {proximos.map((f) => (
                <li key={f.fecha} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                  <span>
                    <span className="font-medium text-foreground">{formatFecha(f.fecha)}</span>
                    <span className="ml-2 text-muted">{f.nombre}</span>
                  </span>
                  {editable && (
                    <form action={eliminarDiaFestivo.bind(null, f.fecha)}>
                      <button className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-danger hover:bg-surface-2">
                        Quitar
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          {pasados > 0 && (
            <p className="text-xs text-muted">{pasados} día(s) de años anteriores siguen guardados (aplican a empeños de esas fechas).</p>
          )}

          {editable && (
            <div className="grid gap-3 lg:grid-cols-2">
              <form action={agregarDiaFestivo} className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface-2/50 p-3">
                <div className="min-w-0 flex-1 basis-36">
                  <Campo label="Fecha">
                    <input name="fecha" type="date" required className={inputCls} />
                  </Campo>
                </div>
                <div className="min-w-0 flex-[2] basis-44">
                  <Campo label="Motivo">
                    <input name="nombre" placeholder="Ej. Jueves Santo" className={inputCls} />
                  </Campo>
                </div>
                <button className={btnCls}>Agregar</button>
              </form>

              <form action={cargarFestivosOficiales} className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface-2/50 p-3">
                <div className="min-w-0 flex-1 basis-28">
                  <Campo label="Año" ayuda="Agrega los días de descanso obligatorio (LFT); luego puedes quitar o sumar otros.">
                    <input name="anio" type="number" defaultValue={anioActual} min={2000} max={2100} className={inputCls} />
                  </Campo>
                </div>
                <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2">
                  Cargar festivos oficiales
                </button>
              </form>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
