import Link from "next/link";
import { listarEmpenos } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { enviarRecordatorioWhatsApp } from "@/lib/actions";
import { whatsappHabilitado } from "@/lib/whatsapp";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader, EmptyState, Badge, ResumenChips } from "@/components/ui";
import { ConfirmSubmit } from "@/components/actions-ui";

export default async function CobranzaPage() {
  const empenos = await listarEmpenos();
  const activos = empenos
    .filter((e) => e.estado === "activo" || e.estado === "refrendado")
    .map((e) => ({ e, calc: calcularLiquidacion(e) }))
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);

  const totalPorCobrar = activos.reduce((s, x) => s + x.calc.totalDesempeno, 0);
  const vencidas = activos.filter((x) => x.calc.vencido);
  const totalVencido = vencidas.reduce((s, x) => s + x.calc.totalDesempeno, 0);
  const interesPorCobrar = activos.reduce((s, x) => s + x.calc.totalRefrendo, 0);

  const waOn = whatsappHabilitado();

  return (
    <div>
      <PageHeader title="Cobranza" subtitle="Cuentas por cobrar y seguimiento de pagos" />

      <ResumenChips
        items={[
          { label: "Cartera por cobrar", valor: formatMXN(totalPorCobrar), tono: "primary" },
          { label: "Vencido", valor: formatMXN(totalVencido), tono: vencidas.length ? "danger" : "muted" },
          { label: "Interés por cobrar", valor: formatMXN(interesPorCobrar), tono: "success" },
          { label: "Cuentas vencidas", valor: `${vencidas.length} / ${activos.length}`, tono: vencidas.length ? "danger" : "muted" },
        ]}
      />

      {waOn && (
        <div className="mb-5 rounded-xl border border-success/20 bg-success-soft px-5 py-3 text-sm text-success">
          ✅ WhatsApp conectado: cobra y recuerda directamente desde aquí.
        </div>
      )}

      <Card>
        <CardHeader title="Cuentas por cobrar" subtitle="Ordenadas por urgencia (vencidas primero)" />
        {activos.length === 0 ? (
          <EmptyState titulo="Sin cuentas por cobrar" descripcion="No hay empeños activos pendientes de pago." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Folio</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Vence</th>
                  <th className="px-5 py-3 font-medium">Estatus</th>
                  <th className="px-5 py-3 text-right font-medium">Refrendo</th>
                  <th className="px-5 py-3 text-right font-medium">A liquidar</th>
                  <th className="px-5 py-3 text-right font-medium">Cobranza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activos.map(({ e, calc }) => {
                  const tel = e.cliente.telefono?.replace(/\D/g, "");
                  return (
                    <tr key={e.id} className="hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <Link href={`/empenos/${e.id}`} className="font-mono text-xs font-medium text-foreground hover:text-primary">
                          {e.folio}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-foreground">{e.cliente.nombre} {e.cliente.apellidoPaterno}</td>
                      <td className="px-5 py-3 text-muted">{formatFecha(e.fechaVencimiento)}</td>
                      <td className="px-5 py-3">
                        {calc.vencido ? (
                          <Badge tono="danger">{Math.abs(calc.diasParaVencer)} d. atraso</Badge>
                        ) : (
                          <Badge tono={calc.diasParaVencer <= 7 ? "warning" : "muted"}>
                            {calc.diasParaVencer} d. restantes
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-muted">{formatMXN(calc.totalRefrendo)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground">{formatMXN(calc.totalDesempeno)}</td>
                      <td className="px-5 py-3 text-right">
                        {!e.cliente.telefono ? (
                          <span className="text-xs text-muted">sin tel.</span>
                        ) : waOn ? (
                          <form action={enviarRecordatorioWhatsApp.bind(null, e.id)} className="inline">
                            <ConfirmSubmit confirmacion={`¿Enviar aviso de cobranza por WhatsApp a ${e.cliente.nombre}?`}>
                              WhatsApp
                            </ConfirmSubmit>
                          </form>
                        ) : (
                          <a
                            href={`https://wa.me/52${tel}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                          >
                            WhatsApp
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
