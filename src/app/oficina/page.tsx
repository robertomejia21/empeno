import { listarEmpenos, listarMovimientos, listarClientes, listarPrendas } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { formatMXN, formatFecha, formatFechaLarga } from "@/lib/format";
import { Card, CardHeader, Badge } from "@/components/ui";
import { Dona } from "@/components/Charts";

export const metadata = { title: "Oficina Virtual — Empeño Suite" };

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
    { etiqueta: "Vigentes", valor: conCalc.filter((x) => !x.calc.vencido).length, color: "#15803d" },
    { etiqueta: "Vencidos", valor: vencidos.length, color: "#b91c1c" },
    { etiqueta: "En venta", valor: prendas.filter((p) => p.estado === "en_venta").length, color: "#b45309" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="bg-gold-gradient shadow-elevated relative mb-7 overflow-hidden rounded-2xl px-6 py-7 text-white md:px-8">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">
              {formatFechaLarga(new Date().toISOString())}
            </p>
            <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight">Oficina Virtual</h1>
            <p className="mt-1 text-sm text-white/80">Resumen general de la casa de empeño.</p>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            👁️ Solo lectura
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Empeños activos" valor={activos.length.toString()} icono="🤝" />
        <Stat label="Capital prestado" valor={formatMXN(capital)} icono="💰" />
        <Stat label="Saldo en caja" valor={formatMXN(saldoCaja)} icono="💵" tono={saldoCaja < 0 ? "danger" : "success"} />
        <Stat label="Vencidos" valor={vencidos.length.toString()} icono="⚠️" tono={vencidos.length > 0 ? "danger" : "muted"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Por vencer (read-only, sin enlaces) */}
        <Card className="lg:col-span-2">
          <CardHeader title="Por vencer y vencidos" subtitle="Empeños que requieren atención" />
          {porVencer.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No hay empeños por vencer. 🎉</p>
          ) : (
            <ul className="divide-y divide-border">
              {porVencer.slice(0, 8).map(({ e, calc }) => (
                <li key={e.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {e.folio} · {e.cliente.nombre} {e.cliente.apellidoPaterno}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {e.prenda.descripcion} · vence {formatFecha(e.fechaVencimiento)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatMXN(calc.totalDesempeno)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Cartera + inventario */}
        <div className="space-y-6">
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
  label: string; valor: string; icono: string; tono?: "muted" | "success" | "danger";
}) {
  const color = tono === "success" ? "text-success" : tono === "danger" ? "text-danger" : "text-foreground";
  const iconBg = tono === "success" ? "bg-success-soft" : tono === "danger" ? "bg-danger-soft" : "bg-primary-soft";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${iconBg}`}>{icono}</span>
      </div>
      <p className={`mt-3 text-[28px] font-bold leading-none tracking-tight ${color}`}>{valor}</p>
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
