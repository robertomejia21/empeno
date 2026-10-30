import { listarEmpenos, listarMovimientos, listarClientes, listarPrendas } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { formatMXN, formatFecha, formatFechaLarga } from "@/lib/format";
import { Card, CardHeader, Badge } from "@/components/ui";
import { Dona } from "@/components/Charts";
import { Banknote, Eye, Handshake, PartyPopper, TriangleAlert, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata = { title: "Oficina Virtual — Turbo Presta El Dorado" };

export default async function OficinaVirtual() {
  const [empenos, movimientos, clientes, prendas] = await Promise.all([
    listarEmpenos(),
    listarMovimientos(),
    listarClientes(),
    listarPrendas(),
  ]);

  const activos = empenos.filter((e) => e.estado === "activo" || e.estado === "refrendado");
  const capital = activos.reduce((s, e) => s + e.montoPrestado, 0);
  const conCalc = activos.map((e) => ({ e, calc: calcularLiquidacion(e) }));
  const vencidos = conCalc.filter((x) => x.calc.vencido);
  const porVencer = conCalc
    .filter((x) => x.calc.vencido || x.calc.diasParaVencer <= 7)
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);
  const saldoCaja = movimientos.reduce((s, m) => s + (m.esEntrada ? m.monto : -m.monto), 0);

  const dona = [
    { etiqueta: "Vigentes", valor: conCalc.filter((x) => !x.calc.vencido).length, color: "var(--success)" },
    { etiqueta: "Vencidos", valor: vencidos.length, color: "var(--danger)" },
    { etiqueta: "En venta", valor: prendas.filter((p) => p.estado === "en_venta").length, color: "var(--warning)" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="shadow-card relative mb-7 overflow-hidden rounded-2xl bg-primary px-5 py-6 text-primary-fg sm:px-6 sm:py-7 md:px-8">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">
              {formatFechaLarga(new Date().toISOString())}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-[26px]">Oficina Virtual</h1>
            <p className="mt-1 text-sm text-white/80">Resumen general de la casa de empeño.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Eye className="h-3.5 w-3.5" aria-hidden /> Solo lectura
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Empeños activos" valor={activos.length.toString()} icono={Handshake} />
        <Stat label="Capital prestado" valor={formatMXN(capital)} icono={Wallet} />
        <Stat label="Saldo en caja" valor={formatMXN(saldoCaja)} icono={Banknote} tono={saldoCaja < 0 ? "danger" : "success"} />
        <Stat label="Vencidos" valor={vencidos.length.toString()} icono={TriangleAlert} tono={vencidos.length > 0 ? "danger" : "muted"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Por vencer (read-only, sin enlaces) */}
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader title="Por vencer y vencidos" subtitle="Empeños que requieren atención" />
          {porVencer.length === 0 ? (
            <p className="flex items-center justify-center gap-1.5 px-5 py-10 text-center text-sm text-muted">
              No hay empeños por vencer. <PartyPopper className="h-4 w-4 text-primary" aria-hidden />
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {porVencer.slice(0, 8).map(({ e, calc }) => (
                <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {e.folio} · {e.cliente.nombre} {e.cliente.apellidoPaterno}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {e.prenda.descripcion} · vence {formatFecha(e.fechaVencimiento)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatMXN(calc.totalDesempeno)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Cartera + inventario */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Cartera" />
            <div className="p-5">
              <Dona segmentos={dona} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Resumen" />
            <div className="space-y-3 px-5 py-4 text-sm">
              <Linea k="Clientes" v={clientes.length} />
              <Linea k="Prendas en inventario" v={prendas.length} />
              <Linea k="Empeñadas" v={prendas.filter((p) => p.estado === "empenada").length} />
              <Linea k="En venta" v={prendas.filter((p) => p.estado === "en_venta").length} />
            </div>
          </Card>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Vista de invitado · solo lectura. Para operar, inicia sesión con tu cuenta.
      </p>
    </div>
  );
}

function Stat({
  label, valor, icono, tono = "muted",
}: {
  label: string; valor: string; icono: LucideIcon; tono?: "muted" | "success" | "danger";
}) {
  const color = tono === "success" ? "text-success" : tono === "danger" ? "text-danger" : "text-foreground";
  const iconBg =
    tono === "success" ? "bg-success-soft text-success" : tono === "danger" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary";
  const Icono = icono;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[13px] font-medium text-muted">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${iconBg}`}>
          <Icono className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </span>
      </div>
      <p className={`mt-3 truncate text-xl font-bold leading-none tracking-tight tabular-nums sm:text-2xl 2xl:text-[28px] ${color}`}>{valor}</p>
    </Card>
  );
}

function Linea({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{k}</span>
      <Badge tono="muted">{v}</Badge>
    </div>
  );
}
