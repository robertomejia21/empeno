import { listarEmpenos, listarMovimientos, listarPrendas, listarVentas, listarPagos } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { formatMXN, formatPorcentaje } from "@/lib/format";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { BarrasIngresoEgreso, Dona, type BarraMes } from "@/components/Charts";
import { PrintButton } from "@/components/actions-ui";
import { rangoMesActual, calcularReporteSemanal } from "@/lib/reporteSemanal";
import { ReporteSemanalCard } from "@/components/ReportePorModalidad";
import { normalizarBusqueda } from "@/lib/buscar";

const EXPORTS = [
  { tipo: "empenos", label: "Empeños" },
  { tipo: "caja", label: "Caja" },
  { tipo: "pagos", label: "Refrendos" },
  { tipo: "clientes", label: "Clientes" },
  { tipo: "prendas", label: "Inventario" },
];

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { desde: desdeParam, hasta: hastaParam } = await searchParams;
  const rangoPorDefecto = rangoMesActual();
  const desde = desdeParam || rangoPorDefecto.desde;
  const hasta = hastaParam || rangoPorDefecto.hasta;

  const [empenos, movimientos, prendas, ventas, pagos] = await Promise.all([
    listarEmpenos(),
    listarMovimientos(),
    listarPrendas(),
    listarVentas(),
    listarPagos(),
  ]);

  const reportePeriodo = calcularReporteSemanal(empenos, pagos, ventas, desde, hasta);

  // Vehículos en garantía: por modalidad (GPS / resguardo) y motocicletas en resguardo.
  const vehiculosActivos = prendas.filter((p) => p.categoria === "Vehículos" && p.estado === "empenada");
  const vehiculosGps = vehiculosActivos.filter((p) => p.modalidad === "gps").length;
  const vehiculosResguardo = vehiculosActivos.filter((p) => p.modalidad === "resguardo");
  const motosResguardo = vehiculosResguardo.filter((p) => normalizarBusqueda(p.tipoVehiculo ?? "").includes("moto")).length;

  // Inventario por categoría de artículo.
  const porCategoria = new Map<string, { n: number; monto: number }>();
  for (const p of prendas) {
    if (p.estado !== "empenada" && p.estado !== "en_venta") continue;
    const actual = porCategoria.get(p.categoria) ?? { n: 0, monto: 0 };
    actual.n += 1;
    actual.monto += p.valorAvaluo;
    porCategoria.set(p.categoria, actual);
  }

  const activos = empenos.filter((e) => e.estado === "activo" || e.estado === "refrendado");
  const carteraActiva = activos.reduce((s, e) => s + e.montoPrestado, 0);
  const interesDevengado = activos.reduce((s, e) => s + calcularLiquidacion(e).interesAcumulado, 0);

  const desempenados = empenos.filter((e) => e.estado === "desempenado").length;
  const rematados = empenos.filter((e) => e.estado === "rematado").length;
  const cerrados = desempenados + rematados;
  const tasaRecuperacion = cerrados > 0 ? (desempenados / cerrados) * 100 : 0;

  // Distribución por estado
  const estados = ["activo", "refrendado", "vencido", "desempenado", "en_remate", "rematado"] as const;
  const porEstado = estados.map((est) => {
    const lista =
      est === "vencido"
        ? activos.filter((e) => calcularLiquidacion(e).vencido)
        : empenos.filter((e) => e.estado === est);
    return { est, n: lista.length, monto: lista.reduce((s, e) => s + e.montoPrestado, 0) };
  });
  const maxEstado = Math.max(1, ...porEstado.map((x) => x.n));

  // Ingresos del periodo seleccionado, por tipo
  const delPeriodo = movimientos.filter((m) => {
    const f = m.fecha.slice(0, 10);
    return f >= desde && f <= hasta;
  });
  const ingresosMes = delPeriodo.filter((m) => m.esEntrada).reduce((s, m) => s + m.monto, 0);
  const egresosMes = delPeriodo.filter((m) => !m.esEntrada).reduce((s, m) => s + m.monto, 0);
  const ingresoInteres = delPeriodo
    .filter((m) => m.tipo === "refrendo" || m.tipo === "desempeno")
    .reduce((s, m) => s + m.monto, 0);

  // Inventario
  const valorEmpenado = prendas
    .filter((p) => p.estado === "empenada")
    .reduce((s, p) => s + p.valorAvaluo, 0);
  const valorEnVenta = prendas
    .filter((p) => p.estado === "en_venta")
    .reduce((s, p) => s + p.valorAvaluo, 0);
  const totalVendido = ventas.reduce((s, v) => s + v.precio, 0);

  // Serie mensual (últimos 6 meses) para la gráfica
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const hoy = new Date();
  const serieMeses: BarraMes[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const delMesN = movimientos.filter((m) => m.fecha.slice(0, 7) === clave);
    serieMeses.push({
      mes: MESES[d.getMonth()],
      ingresos: delMesN.filter((m) => m.esEntrada).reduce((s, m) => s + m.monto, 0),
      egresos: delMesN.filter((m) => !m.esEntrada).reduce((s, m) => s + m.monto, 0),
    });
  }

  const donaCartera = [
    { etiqueta: "Activos", valor: activos.filter((e) => !calcularLiquidacion(e).vencido).length, color: "#15803d" },
    { etiqueta: "Vencidos", valor: activos.filter((e) => calcularLiquidacion(e).vencido).length, color: "#b91c1c" },
    { etiqueta: "Desempeñados", valor: desempenados, color: "#78716c" },
    { etiqueta: "Rematados", valor: rematados, color: "#a16207" },
  ];

  const etiquetaEstado: Record<string, string> = {
    activo: "Activos",
    refrendado: "Refrendados",
    vencido: "Vencidos",
    desempenado: "Desempeñados",
    en_remate: "En remate",
    rematado: "Rematados",
  };

  return (
    <div>
      <PageHeader
        title="Reportes"
        subtitle="Indicadores clave de la operación"
        action={<PrintButton>🖨️ Imprimir / PDF</PrintButton>}
      />

      <div className="no-print mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
        <span className="text-sm font-medium text-muted">Descargar Excel/CSV:</span>
        {EXPORTS.map((x) => (
          <a
            key={x.tipo}
            href={`/api/export/${x.tipo}`}
            className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:bg-surface"
          >
            ⬇️ {x.label}
          </a>
        ))}
      </div>

      <form className="no-print mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Desde</span>
          <input
            type="date"
            name="desde"
            defaultValue={desde}
            className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Hasta</span>
          <input
            type="date"
            name="hasta"
            defaultValue={hasta}
            className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium hover:bg-surface"
        >
          Filtrar
        </button>
        <span className="text-xs text-muted">Aplica al flujo y al desglose por vehículos/artículos de abajo.</span>
      </form>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Cartera activa" valor={formatMXN(carteraActiva)} hint="capital prestado vigente" />
        <Kpi label="Interés devengado" valor={formatMXN(interesDevengado)} hint="sobre empeños activos" />
        <Kpi label="Tasa de recuperación" valor={formatPorcentaje(tasaRecuperacion)} hint={`${desempenados} de ${cerrados} cerrados`} />
        <Kpi label="Vendido (histórico)" valor={formatMXN(totalVendido)} hint={`${ventas.length} ventas`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Ingresos vs egresos" subtitle="Últimos 6 meses" />
          <div className="p-5">
            <BarrasIngresoEgreso datos={serieMeses} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Distribución de cartera" />
          <div className="p-5">
            <Dona segmentos={donaCartera} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Empeños por estado" />
          <div className="space-y-3 p-5">
            {porEstado.map(({ est, n, monto }) => (
              <div key={est}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted">{etiquetaEstado[est]}</span>
                  <span className="font-medium text-foreground">{n} · {formatMXN(monto)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="bg-gold-gradient h-full rounded-full"
                    style={{ width: `${(n / maxEstado) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Flujo del periodo" subtitle={`Del ${desde} al ${hasta}`} />
          <div className="space-y-4 p-5">
            <Linea etiqueta="Ingresos" valor={formatMXN(ingresosMes)} tono="success" />
            <Linea etiqueta="Egresos (préstamos/gastos)" valor={formatMXN(egresosMes)} tono="danger" />
            <Linea etiqueta="Ingreso por intereses (refrendo/desempeño)" valor={formatMXN(ingresoInteres)} />
            <div className="border-t border-border pt-4">
              <Linea
                etiqueta="Resultado neto del periodo"
                valor={formatMXN(ingresosMes - egresosMes)}
                tono={ingresosMes - egresosMes >= 0 ? "success" : "danger"}
                fuerte
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Valor de inventario" />
          <div className="space-y-4 p-5">
            <Linea etiqueta="Avalúo de prendas empeñadas" valor={formatMXN(valorEmpenado)} />
            <Linea etiqueta="Avalúo de prendas en venta" valor={formatMXN(valorEnVenta)} />
            <div className="border-t border-border pt-4">
              <Linea etiqueta="Total en garantía/inventario" valor={formatMXN(valorEmpenado + valorEnVenta)} fuerte />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Resumen de cartera" />
          <div className="space-y-4 p-5">
            <Linea etiqueta="Empeños activos" valor={String(activos.length)} />
            <Linea etiqueta="Desempeñados (recuperados)" valor={String(desempenados)} />
            <Linea etiqueta="Rematados (perdidos)" valor={String(rematados)} />
            <Linea etiqueta="Prendas en inventario" valor={String(prendas.length)} />
            <div className="border-t border-border pt-4">
              <Linea etiqueta="Vehículos con GPS" valor={String(vehiculosGps)} />
              <Linea etiqueta="Vehículos en resguardo" valor={String(vehiculosResguardo.length)} />
              <Linea etiqueta="Motocicletas en resguardo" valor={String(motosResguardo)} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Inventario por categoría" subtitle="Prendas empeñadas o en venta" />
          <div className="space-y-3 p-5">
            {[...porCategoria.entries()].map(([cat, { n, monto }]) => (
              <Linea key={cat} etiqueta={`${cat} (${n})`} valor={formatMXN(monto)} />
            ))}
          </div>
        </Card>
      </div>

      <ReporteSemanalCard
        reporte={reportePeriodo}
        titulo="Desglose por vehículos y artículos"
        descarga={`/api/export/mensual?desde=${desde}&hasta=${hasta}`}
      />
    </div>
  );
}

function Kpi({ label, valor, hint }: { label: string; valor: string; hint: string }) {
  return (
    <Card className="p-5">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-2 text-[22px] font-bold tracking-tight text-foreground">{valor}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  );
}

function Linea({
  etiqueta,
  valor,
  tono = "muted",
  fuerte,
}: {
  etiqueta: string;
  valor: string;
  tono?: "muted" | "success" | "danger";
  fuerte?: boolean;
}) {
  const color = tono === "success" ? "text-success" : tono === "danger" ? "text-danger" : "text-foreground";
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{etiqueta}</span>
      <span className={`${color} ${fuerte ? "text-base font-bold" : "font-medium"}`}>{valor}</span>
    </div>
  );
}
