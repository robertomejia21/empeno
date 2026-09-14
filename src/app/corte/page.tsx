import { listarMovimientos, listarCortes } from "@/lib/db/repo";
import { registrarMovimiento, registrarCorte } from "@/lib/actions";
import { formatMXN, formatFecha, formatFechaLarga, hoyISO } from "@/lib/format";
import { Card, CardHeader, PageHeader, Button, Field, SelectField, TextArea, ResumenChips } from "@/components/ui";

export default async function CortePage() {
  const [movs, cortes] = await Promise.all([listarMovimientos(), listarCortes()]);
  const hoy = hoyISO();

  // Las transferencias son movimiento bancario, no efectivo físico — no
  // cuentan para lo que debería haber en el cajón al contar.
  const esperado = movs
    .filter((m) => m.tipo !== "transferencia")
    .reduce((s, m) => s + (m.esEntrada ? m.monto : -m.monto), 0);
  const delDia = movs.filter((m) => m.fecha.slice(0, 10) === hoy);
  const entradasDia = delDia.filter((m) => m.esEntrada).reduce((s, m) => s + m.monto, 0);
  const salidasDia = delDia.filter((m) => !m.esEntrada).reduce((s, m) => s + m.monto, 0);
  const aperturaHoy = delDia.filter((m) => m.tipo === "apertura").reduce((s, m) => s + m.monto, 0);

  return (
    <div>
      <PageHeader title="Corte de caja" subtitle={`Cierre del día · ${formatFechaLarga(hoy)}`} />

      <ResumenChips
        items={[
          { label: "Efectivo esperado", valor: formatMXN(esperado), tono: esperado < 0 ? "danger" : "primary" },
          { label: "Entradas de hoy", valor: formatMXN(entradasDia), tono: "success" },
          { label: "Salidas de hoy", valor: formatMXN(salidasDia), tono: "danger" },
          { label: "Apertura de hoy", valor: formatMXN(aperturaHoy) },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Apertura rápida */}
        <Card>
          <CardHeader title="Apertura de caja" subtitle="Fondo inicial del día" />
          <form action={registrarMovimiento} className="space-y-3 p-5">
            <input type="hidden" name="tipo" value="apertura" />
            <input type="hidden" name="concepto" value="Apertura de caja" />
            <Field label="Monto inicial (MXN)" name="monto" type="number" step="0.01" required />
            <Button type="submit" variante="secondary" className="w-full">Registrar apertura</Button>
          </form>
        </Card>

        {/* Corte / cierre */}
        <Card className="lg:col-span-2">
          <CardHeader title="Realizar corte" subtitle="Cuenta el efectivo en caja y registra el cierre" />
          <form action={registrarCorte} className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-2 p-4 sm:col-span-2">
              <p className="text-xs text-muted">Efectivo esperado en caja</p>
              <p className="text-2xl font-bold text-foreground">{formatMXN(esperado)}</p>
              <p className="mt-1 text-xs text-muted">Acumulado de todas las entradas menos salidas.</p>
            </div>
            <Field label="Efectivo contado (MXN)" name="contado" type="number" step="0.01" required />
            <div className="sm:col-span-2">
              <TextArea label="Notas / observaciones" name="notas" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full">Registrar corte del día</Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Transferencias — entradas/salidas bancarias que no vienen de un
          empeño (ej. traspaso a la cuenta del negocio, retiro por transfer.) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Transferencia" subtitle="Movimiento bancario — no cuenta como efectivo" />
          <form action={registrarMovimiento} className="space-y-3 p-5">
            <input type="hidden" name="tipo" value="transferencia" />
            <SelectField
              label="Dirección"
              name="direccion"
              options={[
                { value: "entrada", label: "Entrada (recibida)" },
                { value: "salida", label: "Salida (enviada)" },
              ]}
              defaultValue="entrada"
              required
            />
            <Field label="Monto (MXN)" name="monto" type="number" step="0.01" required />
            <Field label="Concepto" name="concepto" placeholder="Ej. Transferencia a cuenta BBVA" required />
            <Field label="Referencia (opcional)" name="referencia" placeholder="No. de rastreo, folio…" />
            <Button type="submit" variante="secondary" className="w-full">Registrar transferencia</Button>
          </form>
        </Card>
      </div>

      {/* Historial */}
      <Card className="mt-6">
        <CardHeader title="Historial de cortes" subtitle={`${cortes.length} registros`} />
        {cortes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Aún no se han registrado cortes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Responsable</th>
                  <th className="px-5 py-3 text-right font-medium">Esperado</th>
                  <th className="px-5 py-3 text-right font-medium">Contado</th>
                  <th className="px-5 py-3 text-right font-medium">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cortes.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-2">
                    <td className="px-5 py-3 text-muted">{formatFecha(c.fecha)}</td>
                    <td className="px-5 py-3 text-foreground">{c.usuarioNombre ?? "—"}</td>
                    <td className="px-5 py-3 text-right text-foreground">{formatMXN(c.esperado)}</td>
                    <td className="px-5 py-3 text-right text-foreground">{formatMXN(c.contado)}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${c.diferencia === 0 ? "text-success" : c.diferencia > 0 ? "text-info" : "text-danger"}`}>
                      {c.diferencia > 0 ? "+" : ""}{formatMXN(c.diferencia)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
