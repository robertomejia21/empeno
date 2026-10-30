import Link from "next/link";
import { listarEmpenos, listarMovimientos, listarClientes, listarPrendas, listarPagos, listarVentas } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { calcularReporteSemanal, rangoSemanaActual } from "@/lib/reporteSemanal";
import { ReporteSemanalCard } from "@/components/ReportePorModalidad";
import { resumenModalidades } from "@/lib/gps";
import { GpsModalidades } from "@/components/GpsModalidades";
import { formatMXN, formatFecha, formatFechaLarga } from "@/lib/format";
import { Card, CardHeader, Badge } from "@/components/ui";
import { estadoEmpenoBadge } from "@/components/badges";
import { BarrasIngresoEgreso, Dona, type BarraMes } from "@/components/Charts";
import {
  ArrowRight,
  Banknote,
  Handshake,
  PartyPopper,
  Receipt,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const accesos: { href: string; icon: LucideIcon; label: string; tono: string }[] = [
  { href: "/empenos/asistente", icon: Handshake, label: "Nuevo empeño", tono: "bg-primary-soft text-primary" },
  { href: "/cotizaciones", icon: Receipt, label: "Cotizar", tono: "bg-info-soft text-info" },
  { href: "/ventas", icon: ShoppingCart, label: "Punto de venta", tono: "bg-warning-soft text-warning" },
  { href: "/clientes/nuevo", icon: UserPlus, label: "Nuevo cliente", tono: "bg-success-soft text-success" },
];

export default async function Tablero() {
  const [empenos, movimientos, clientes, prendas, pagos, ventas] = await Promise.all([
    listarEmpenos(),
    listarMovimientos(),
    listarClientes(),
    listarPrendas(),
    listarPagos(),
    listarVentas(),
  ]);

  const semana = rangoSemanaActual();
  const reporteSemanal = calcularReporteSemanal(empenos, pagos, ventas, semana.desde, semana.hasta);
  const resumenGps = resumenModalidades(empenos);

  const activos = empenos.filter((e) => e.estado === "activo" || e.estado === "refrendado");
  const capitalPrestado = activos.reduce((s, e) => s + e.montoPrestado, 0);
  const conCalc = activos.map((e) => ({ e, calc: calcularLiquidacion(e) }));
  const aRecuperar = conCalc.reduce((s, x) => s + x.calc.totalDesempeno, 0);
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
    { etiqueta: "Vigentes", valor: conCalc.filter((x) => !x.calc.vencido).length, color: "var(--success)" },
    { etiqueta: "Vencidos", valor: vencidos.length, color: "var(--danger)" },
    { etiqueta: "En venta", valor: prendas.filter((p) => p.estado === "en_venta").length, color: "var(--warning)" },
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
      <div className="shadow-card relative mb-7 overflow-hidden rounded-2xl bg-primary px-5 py-6 text-primary-fg sm:px-6 sm:py-7 md:px-8">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-24 h-44 w-44 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-widest text-white/75">
            {formatFechaLarga(new Date().toISOString())}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-[28px]">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-white/85">Resumen de la operación de tu casa de empeño hoy.</p>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 2xl:gap-4">
        {accesos.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="shadow-soft group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card sm:px-4"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.tono}`}>
              <a.icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 truncate text-sm font-medium text-foreground">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Empeños activos" valor={activos.length.toString()} icono={Handshake} />
        <Stat label="Capital prestado" valor={formatMXN(capitalPrestado)} icono={Wallet} />
        <Stat label="A recuperar" valor={formatMXN(aRecuperar)} icono={TrendingUp} />
        <Stat label="Saldo en caja" valor={formatMXN(saldoCaja)} icono={Banknote} tono={saldoCaja < 0 ? "danger" : "success"} />
        <Stat label="Vencidos" valor={vencidos.length.toString()} icono={TriangleAlert} tono={vencidos.length > 0 ? "danger" : "muted"} />
      </div>

      {saldoCaja < 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <span className="font-semibold">La caja está en números rojos.</span>
          <span>
            Se ha prestado más de lo que ha entrado. Registra la apertura o una aportación en{" "}
            <Link href="/caja" className="font-semibold underline underline-offset-2">
              Caja
            </Link>
            {" "}para cuadrar el saldo.
          </span>
        </div>
      )}

      {/* Modalidad GPS vs Resguardo (vehículos) */}
      {resumenGps.totalVehiculos > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Vehículos por modalidad</h2>
            <Link href="/gps" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              Ver GPS y resguardo <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <GpsModalidades resumen={resumenGps} />
        </div>
      )}

      {/* Informe semanal */}
      <ReporteSemanalCard reporte={reporteSemanal} titulo="Informe semanal" descarga="/api/export/semanal" />

      {/* Gráficas */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader title="Ingresos vs egresos" subtitle="Últimos 6 meses" />
          <div className="p-4 sm:p-5">
            <BarrasIngresoEgreso datos={serie} />
          </div>
        </Card>
        <Card className="min-w-0">
          <CardHeader title="Cartera" subtitle="Distribución actual" />
          <div className="p-5">
            <Dona segmentos={dona} />
          </div>
        </Card>
      </div>

      {/* Por vencer + inventario */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader
            title="Por vencer y vencidos"
            subtitle="Empeños que requieren atención"
            action={
              <Link href="/recordatorios" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                Recordatorios <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          />
          {porVencer.length === 0 && vencidos.length === 0 ? (
            <p className="flex items-center justify-center gap-1.5 px-5 py-10 text-center text-sm text-muted">
              No hay empeños por vencer. <PartyPopper className="h-4 w-4 text-primary" aria-hidden />
            </p>
          ) : (
            <>
              {/* Separados en dos listas — antes se mezclaban en una sola y, con
                  muchos vencidos, los "por vencer" nunca alcanzaban a mostrarse. */}
              <ListaVencimiento titulo="Vencidos" tono="danger" items={vencidos} maximo={4} forzarVencido />
              <ListaVencimiento titulo="Por vencer (≤ 7 días)" tono="warning" items={porVencer} maximo={4} />
            </>
          )}
        </Card>

        <Card className="min-w-0">
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
        <Card className="min-w-0 lg:col-span-2">
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
                      <span className="hidden shrink-0 text-xs text-muted sm:inline">{c.empenos} empeño(s)</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatMXN(c.capital)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="min-w-0">
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
  label: string; valor: string; icono: LucideIcon; tono?: "muted" | "success" | "danger";
}) {
  const color = tono === "success" ? "text-success" : tono === "danger" ? "text-danger" : "text-foreground";
  const iconBg =
    tono === "success" ? "bg-success-soft text-success" : tono === "danger" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary";
  const Icono = icono;
  return (
    <Card className="p-4 transition hover:shadow-elevated sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[13px] font-medium text-muted">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${iconBg}`}>
          <Icono className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </span>
      </div>
      {/* Los importes largos (p. ej. saldos negativos) no caben a 28px en móvil. */}
      <p className={`mt-3 truncate text-xl font-bold leading-none tracking-tight tabular-nums sm:text-2xl 2xl:text-[28px] ${color}`}>
        {valor}
      </p>
    </Card>
  );
}

function EstLinea({ etiqueta, valor, tono = "muted" }: { etiqueta: string; valor: string; tono?: "muted" | "success" | "danger" }) {
  const color = tono === "success" ? "text-success" : tono === "danger" ? "text-danger" : "text-foreground";
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="min-w-0 text-muted">{etiqueta}</span>
      <span className={`shrink-0 font-semibold tabular-nums ${color}`}>{valor}</span>
    </div>
  );
}

type EmpenoConCalc = { e: Awaited<ReturnType<typeof listarEmpenos>>[number]; calc: ReturnType<typeof calcularLiquidacion> };

function ListaVencimiento({
  titulo,
  tono,
  items,
  maximo,
  forzarVencido,
}: {
  titulo: string;
  tono: "danger" | "warning";
  items: EmpenoConCalc[];
  maximo: number;
  forzarVencido?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 px-5 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{titulo}</span>
        <Badge tono={tono}>{items.length}</Badge>
      </div>
      <ul className="divide-y divide-border">
        {items.slice(0, maximo).map(({ e, calc }) => (
          <li key={e.id}>
            <Link href={`/empenos/${e.id}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 transition hover:bg-surface-2 sm:flex-nowrap sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {e.folio} · {e.cliente.nombre} {e.cliente.apellidoPaterno}
                </p>
                <p className="truncate text-xs text-muted">
                  {e.prenda.descripcion} · vence {formatFecha(e.fechaVencimiento)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold tabular-nums text-foreground">{formatMXN(calc.totalDesempeno)}</span>
                {estadoEmpenoBadge(forzarVencido || calc.vencido ? "vencido" : e.estado)}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {items.length > maximo && (
        <Link href="/recordatorios" className="flex items-center gap-1 px-5 py-2 text-xs font-medium text-primary hover:underline">
          Ver los {items.length - maximo} restantes <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
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
