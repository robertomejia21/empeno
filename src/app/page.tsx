import Link from "next/link";
import { listarEmpenos, listarMovimientos, listarClientes, listarPrendas } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { formatMXN, formatFecha, formatFechaLarga } from "@/lib/format";
import { Card, CardHeader, Badge, LinkButton } from "@/components/ui";
import { estadoEmpenoBadge } from "@/components/badges";

export default async function Tablero() {
  const [empenos, movimientos, clientes, prendas] = await Promise.all([
    listarEmpenos(),
    listarMovimientos(),
    listarClientes(),
    listarPrendas(),
  ]);

  const activos = empenos.filter(
    (e) => e.estado === "activo" || e.estado === "refrendado"
  );
  const capitalPrestado = activos.reduce((s, e) => s + e.montoPrestado, 0);

  const conCalc = activos.map((e) => ({ e, calc: calcularLiquidacion(e) }));
  const vencidos = conCalc.filter((x) => x.calc.vencido);
  const porVencer = conCalc
    .filter((x) => !x.calc.vencido && x.calc.diasParaVencer <= 7)
    .sort((a, b) => a.calc.diasParaVencer - b.calc.diasParaVencer);

  const saldoCaja = movimientos.reduce(
    (s, m) => s + (m.esEntrada ? m.monto : -m.monto),
    0
  );

  const prendasEnVenta = prendas.filter((p) => p.estado === "en_venta").length;

  return (
    <div>
      {/* Hero premium */}
      <div className="bg-gold-gradient shadow-elevated relative mb-7 overflow-hidden rounded-2xl px-6 py-7 text-white md:px-8">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-24 h-44 w-44 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">
              {formatFechaLarga(new Date().toISOString())}
            </p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">
              Bienvenido de vuelta 👋
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Resumen de la operación de tu casa de empeño hoy.
            </p>
          </div>
          <Link
            href="/empenos/asistente"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-soft transition hover:bg-white/90"
          >
            + Nuevo empeño
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Empeños activos" valor={activos.length.toString()} icono="🤝" />
        <Stat label="Capital prestado" valor={formatMXN(capitalPrestado)} icono="💰" />
        <Stat
          label="Saldo en caja"
          valor={formatMXN(saldoCaja)}
          icono="💵"
          tono={saldoCaja < 0 ? "danger" : "success"}
        />
        <Stat
          label="Vencidos"
          valor={vencidos.length.toString()}
          icono="⚠️"
          tono={vencidos.length > 0 ? "danger" : "muted"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Por vencer (próximos 7 días)"
            subtitle="Empeños que requieren refrendo o desempeño pronto"
            action={
              <Link href="/empenos" className="text-sm font-medium text-primary">
                Ver todos →
              </Link>
            }
          />
          {porVencer.length === 0 && vencidos.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              No hay empeños por vencer. 🎉
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {[...vencidos, ...porVencer].slice(0, 8).map(({ e, calc }) => (
                <li key={e.id}>
                  <Link
                    href={`/empenos/${e.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {e.folio} · {e.cliente.nombre} {e.cliente.apellidoPaterno}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {e.prenda.descripcion} · vence {formatFecha(e.fechaVencimiento)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        {formatMXN(calc.totalDesempeno)}
                      </span>
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
          <div className="space-y-4 px-5 py-4">
            <ResumenLinea etiqueta="Clientes registrados" valor={clientes.length} />
            <ResumenLinea etiqueta="Prendas en inventario" valor={prendas.length} />
            <ResumenLinea
              etiqueta="Prendas empeñadas"
              valor={prendas.filter((p) => p.estado === "empenada").length}
            />
            <ResumenLinea etiqueta="Prendas en venta" valor={prendasEnVenta} />
            <div className="border-t border-border pt-4">
              <LinkButton href="/prendas/nueva" variante="secondary" className="w-full">
                + Registrar prenda
              </LinkButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  valor,
  icono,
  tono = "muted",
}: {
  label: string;
  valor: string;
  icono: string;
  tono?: "muted" | "success" | "danger";
}) {
  const color =
    tono === "success"
      ? "text-success"
      : tono === "danger"
        ? "text-danger"
        : "text-foreground";
  const iconBg =
    tono === "success"
      ? "bg-success-soft"
      : tono === "danger"
        ? "bg-danger-soft"
        : "bg-primary-soft";
  return (
    <Card className="p-5 transition hover:shadow-elevated">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${iconBg}`}>
          {icono}
        </span>
      </div>
      <p className={`mt-3 text-[28px] font-bold leading-none tracking-tight ${color}`}>
        {valor}
      </p>
    </Card>
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
