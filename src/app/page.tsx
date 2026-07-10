import Link from "next/link";
import { listarEmpenos, listarMovimientos, listarClientes, listarPrendas } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { formatMXN, formatFecha, formatFechaLarga } from "@/lib/format";
import { Card, CardHeader, Badge } from "@/components/ui";
import { estadoEmpenoBadge } from "@/components/badges";
import { BarrasIngresoEgreso, Dona, type BarraMes } from "@/components/Charts";

const accesos = [
  { href: "/empenos/asistente", icon: "🤝", label: "Nuevo empeño", tono: "bg-primary-soft text-primary" },
  { href: "/ventas", icon: "🛒", label: "Punto de venta", tono: "bg-info-soft text-info" },
  { href: "/prendas/nueva", icon: "💍", label: "Registrar prenda", tono: "bg-warning-soft text-warning" },
  { href: "/clientes/nuevo", icon: "👤", label: "Nuevo cliente", tono: "bg-success-soft text-success" },
];

export default async function Tablero() {
  const [empenos, movimientos, clientes, prendas] = await Promise.all([
    listarEmpenos(),
    listarMovimientos(),
    listarClientes(),
    listarPrendas(),
  ]);

  const activos = empenos.filter((e) => e.estado === "activo" || e.estado === "refrendado");
  const capitalPrestado = activos.reduce((s, e) => s + e.montoPrestado, 0);
  const conCalc = activos.map((e) => ({ e, calc: calcularLiquidacion(e) }));
  const vencidos = conCalc.filter((x) => x.calc.vencido);
  const porVencer = conCalc
    .filter((x) => !x.calc.vencido && x.calc.diasParaVencer <= 7)
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);
  const saldoCaja = movimientos.reduce((s, m) => s + (m.esEntrada ? m.monto : -m.monto), 0);

  // Serie mensual (6 meses)
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const hoy = new Date();
  const serie: BarraMes[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const mm = movimientos.filter((m) => m.fecha.slice(0, 7) === clave);
    serie.push({
      mes: MESES[d.getMonth()],
      ingresos: mm.filter((m) => m.esEntrada).reduce((s, m) => s + m.monto, 0),
      egresos: mm.filter((m) => !m.esEntrada).reduce((s, m) => s + m.monto, 0),
    });
  }

  const dona = [
    { etiqueta: "Vigentes", valor: conCalc.filter((x) => !x.calc.vencido).length, color: "#15803d" },
    { etiqueta: "Vencidos", valor: vencidos.length, color: "#b91c1c" },
    { etiqueta: "En venta", valor: prendas.filter((p) => p.estado === "en_venta").length, color: "#b45309" },
  ];

  // Cartera vencida y estadísticas
  const carteraVencida = vencidos.reduce((s, x) => s + x.calc.totalDesempeno, 0);
  const desempenados = empenos.filter((e) => e.estado === "desempenado").length;
  const rematados = empenos.filter((e) => e.estado === "rematado").length;
  const cerrados = desempenados + rematados;
  const tasaRecuperacion = cerrados > 0 ? Math.round((desempenados / cerrados) * 100) : 0;
  const claveMes = new Date().toISOString().slice(0, 7);
  const ingresosMes = movimientos.filter((m) => m.esEntrada && m.fecha.slice(0, 7) === claveMes).reduce((s, m) => s + m.monto, 0);
  const ticketPromedio = activos.length ? capitalPrestado / activos.length : 0;

  // Mejores clientes por capital prestado
  const porCliente = new Map<string, { nombre: string; capital: number; empenos: number }>();
  for (const e of empenos) {
    const k = e.clienteId;
    const cur = porCliente.get(k) ?? { nombre: `${e.cliente.nombre} ${e.cliente.apellidoPaterno}`, capital: 0, empenos: 0 };
    cur.capital += e.montoPrestado;
    cur.empenos += 1;
    porCliente.set(k, cur);
  }
  const mejoresClientes = [...porCliente.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.capital - a.capital)
    .slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gold-gradient gradiente-animado shadow-elevated relative mb-7 overflow-hidden rounded-2xl px-6 py-7 text-white md:px-8">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-24 h-44 w-44 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-widest text-white/70">
            {formatFechaLarga(new Date().toISOString())}
          </p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">Bienvenido de vuelta 👋</h1>
          <p className="mt-1 text-sm text-white/80">Resumen de la operación de tu casa de empeño hoy.</p>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {accesos.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="shadow-soft group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-base ${a.tono}`}>{a.icon}</span>
            <span className="text-sm font-medium text-foreground">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Empeños activos" valor={activos.length.toString()} icono="🤝" />
        <Stat label="Capital prestado" valor={formatMXN(capitalPrestado)} icono="💰" />
        <Stat label="Saldo en caja" valor={formatMXN(saldoCaja)} icono="💵" tono={saldoCaja < 0 ? "danger" : "success"} />
        <Stat label="Vencidos" valor={vencidos.length.toString()} icono="⚠️" tono={vencidos.length > 0 ? "danger" : "muted"} />
      </div>

      {/* Gráficas */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Ingresos vs egresos" subtitle="Últimos 6 meses" />
          <div className="p-5">
            <BarrasIngresoEgreso datos={serie} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Cartera" subtitle="Distribución actual" />
          <div className="p-5">
            <Dona segmentos={dona} />
          </div>
        </Card>
      </div>

      {/* Por vencer + inventario */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Por vencer y vencidos"
            subtitle="Empeños que requieren atención"
            action={<Link href="/recordatorios" className="text-sm font-medium text-primary">Recordatorios →</Link>}
          />
          {porVencer.length === 0 && vencidos.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No hay empeños por vencer. 🎉</p>
          ) : (
            <ul className="divide-y divide-border">
              {[...vencidos, ...porVencer].slice(0, 7).map(({ e, calc }) => (
                <li key={e.id}>
                  <Link href={`/empenos/${e.id}`} className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-surface-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {e.folio} · {e.cliente.nombre} {e.cliente.apellidoPaterno}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {e.prenda.descripcion} · vence {formatFecha(e.fechaVencimiento)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{formatMXN(calc.totalDesempeno)}</span>
                      {estadoEmpenoBadge(calc.vencido ? "vencido" : e.estado)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Inventario" />
          <div className="space-y-3.5 px-5 py-4">
            <ResumenLinea etiqueta="Clientes" valor={clientes.length} />
            <ResumenLinea etiqueta="Prendas en inventario" valor={prendas.length} />
            <ResumenLinea etiqueta="Empeñadas" valor={prendas.filter((p) => p.estado === "empenada").length} />
            <ResumenLinea etiqueta="En venta" valor={prendas.filter((p) => p.estado === "en_venta").length} />
            <ResumenLinea etiqueta="Apartadas" valor={prendas.filter((p) => p.estado === "apartada").length} />
          </div>
        </Card>
      </div>

      {/* Mejores clientes + estadísticas */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Mejores clientes" subtitle="Por capital prestado" />
          {mejoresClientes.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Aún no hay clientes con empeños.</p>
          ) : (
            <ul className="divide-y divide-border">
              {mejoresClientes.map((c, i) => (
                <li key={c.id}>
                  <Link href={`/clientes/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-surface-2">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>
                      <span className="truncate text-sm font-medium text-foreground">{c.nombre}</span>
                      <span className="shrink-0 text-xs text-muted">{c.empenos} empeño(s)</span>
                    </span>
                    <span className="text-sm font-semibold text-foreground">{formatMXN(c.capital)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Estadísticas" />
          <div className="space-y-4 p-5">
            <EstLinea etiqueta="Cartera vencida" valor={formatMXN(carteraVencida)} tono={carteraVencida > 0 ? "danger" : "muted"} />
            <EstLinea etiqueta="Tasa de recuperación" valor={`${tasaRecuperacion}%`} tono="success" />
            <EstLinea etiqueta="Ingresos del mes" valor={formatMXN(ingresosMes)} />
            <EstLinea etiqueta="Ticket promedio" valor={formatMXN(ticketPromedio)} />
            <EstLinea etiqueta="Desempeñados / Rematados" valor={`${desempenados} / ${rematados}`} />
          </div>
        </Card>
      </div>
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
    <Card className="p-5 transition hover:shadow-elevated">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${iconBg}`}>{icono}</span>
      </div>
      <p className={`mt-3 text-[28px] font-bold leading-none tracking-tight ${color}`}>{valor}</p>
    </Card>
  );
}

function EstLinea({ etiqueta, valor, tono = "muted" }: { etiqueta: string; valor: string; tono?: "muted" | "success" | "danger" }) {
  const color = tono === "success" ? "text-success" : tono === "danger" ? "text-danger" : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{etiqueta}</span>
      <span className={`font-semibold ${color}`}>{valor}</span>
    </div>
  );
}

function ResumenLinea({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{etiqueta}</span>
      <Badge tono="muted">{valor}</Badge>
    </div>
  );
}
