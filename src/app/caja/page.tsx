import { listarMovimientos } from "@/lib/db/repo";
import { registrarMovimiento } from "@/lib/actions";
import { formatMXN, formatFechaHora, hoyISO } from "@/lib/format";
import { Card, CardHeader, PageHeader, Button, Field, SelectField } from "@/components/ui";
import { TipoMovBadge } from "@/components/badges-caja";

const tiposManual = [
  { value: "gasto", label: "Gasto" },
  { value: "deposito", label: "Depósito de efectivo" },
  { value: "retiro", label: "Retiro de efectivo" },
  { value: "apertura", label: "Apertura de caja" },
  { value: "venta", label: "Venta de prenda" },
  { value: "abono", label: "Abono" },
];

export default async function CajaPage() {
  const movimientos = await listarMovimientos();
  const hoy = hoyISO();
  const delDia = movimientos.filter((m) => m.fecha.slice(0, 10) === hoy);

  const entradasDia = delDia.filter((m) => m.esEntrada).reduce((s, m) => s + m.monto, 0);
  const salidasDia = delDia.filter((m) => !m.esEntrada).reduce((s, m) => s + m.monto, 0);
  const saldoTotal = movimientos.reduce(
    (s, m) => s + (m.esEntrada ? m.monto : -m.monto),
    0
  );

  return (
    <div>
      <PageHeader title="Caja" subtitle="Movimientos de efectivo y corte del día" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Saldo en caja" valor={formatMXN(saldoTotal)} tono={saldoTotal < 0 ? "danger" : "success"} />
        <Stat label="Entradas hoy" valor={formatMXN(entradasDia)} tono="success" />
        <Stat label="Salidas hoy" valor={formatMXN(salidasDia)} tono="danger" />
        <Stat label="Movimientos hoy" valor={delDia.length.toString()} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Movimientos del día" subtitle={`Corte de ${hoy}`} />
          {delDia.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Sin movimientos registrados hoy.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Hora</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Concepto</th>
                    <th className="px-5 py-3 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {delDia.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-2">
                      <td className="px-5 py-3 text-muted">
                        {formatFechaHora(m.fecha).split(" ").slice(-2).join(" ")}
                      </td>
                      <td className="px-5 py-3">
                        <TipoMovBadge tipo={m.tipo} />
                      </td>
                      <td className="px-5 py-3 text-foreground">{m.concepto}</td>
                      <td
                        className={`px-5 py-3 text-right font-semibold ${m.esEntrada ? "text-success" : "text-danger"}`}
                      >
                        {m.esEntrada ? "+" : "−"}
                        {formatMXN(m.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Registrar movimiento" subtitle="Entrada o salida manual" />
          <form action={registrarMovimiento} className="space-y-4 p-5">
            <SelectField label="Tipo" name="tipo" options={tiposManual} defaultValue="gasto" required />
            <Field label="Monto (MXN)" name="monto" type="number" step="0.01" required />
            <Field label="Concepto" name="concepto" required />
            <Field label="Referencia" name="referencia" placeholder="Folio, factura..." />
            <Button type="submit" className="w-full">
              Registrar
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  valor,
  tono = "muted",
}: {
  label: string;
  valor: string;
  tono?: "muted" | "success" | "danger";
}) {
  const color =
    tono === "success" ? "text-success" : tono === "danger" ? "text-danger" : "text-foreground";
  return (
    <Card className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{valor}</p>
    </Card>
  );
}
