import { listarEmpenos, listarMovimientos, listarPrendas, listarVentas } from "@/lib/db/repo";
import { calcularLiquidacion } from "@/lib/interes";
import { formatMXN, formatPorcentaje, hoyISO } from "@/lib/format";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { BarrasIngresoEgreso, Dona, type BarraMes } from "@/components/Charts";
import { PrintButton } from "@/components/actions-ui";

const EXPORTS = [
  { tipo: "empenos", label: "Empeños" },
  { tipo: "caja", label: "Caja" },
  { tipo: "pagos", label: "Refrendos" },
  { tipo: "clientes", label: "Clientes" },
  { tipo: "prendas", label: "Inventario" },
];

export default async function ReportesPage() {
  const [empenos, movimientos, prendas, ventas] = await Promise.all([
    listarEmpenos(),
    listarMovimientos(),
    listarPrendas(),
    listarVentas(),
  ]);

  const activos = empenos.filter((e) => e.estado === "activo" || e.estado === "refrendado");
  const carteraActiva = activos.reduce((s, e) => s + e.montoPrestado, 0);
  const interesDevengado = activos.reduce((s, e) => s + calcularLiquidacion(e).interesAcumulado, 0);

  const desempenados = empenos.filter((e) => e.estado === "desempenado").length;
  const rematados = empenos.filter((e) => e.estado === "rematado").length;
  const cerrados = desempenados + rematados;
  const tasaRecuperacion = cerrados > 0 ? (desempenados / cerrados) * 100 : 0;

  // Distribución por estado
  const estados = ["activo", "refrendado", "vencido", "desempenado", "en_remate", "rematado"] as const;
  const porEstado = estados.map((est) => ({
    est,
    n:
      est === "vencido"
        ? activos.filter((e) => calcularLiquidacion(e).vencido).length
        : empenos.filter((e) => e.estado === est).length,
  }));
  const maxEstado = Math.max(1, ...porEstado.map((x) => x.n));

  // Ingresos del mes por tipo
  const mes = hoyISO().slice(0, 7);
  const delMes = movimientos.filter((m) => m.fecha.slice(0, 7) === mes);
  const ingresosMes = delMes.filter((m) => m.esEntrada).reduce((s, m) => s + m.monto, 0);
  const egresosMes = delMes.filter((m) => !m.esEntrada).reduce((s, m) => s + m.monto, 0);
  const ingresoInteres = delMes
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
            {porEstado.map(({ est, n }) => (
              <div key={est}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted">{etiquetaEstado[est]}</span>
                  <span className="font-medium text-foreground">{n}</span>
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
          <CardHeader title={`Flujo del mes (${mes})`} />
          <div className="space-y-4 p-5">
            <Linea etiqueta="Ingresos" valor={formatMXN(ingresosMes)} tono="success" />
            <Linea etiqueta="Egresos (préstamos/gastos)" valor={formatMXN(egresosMes)} tono="danger" />
            <Linea etiqueta="Ingreso por intereses (refrendo/desempeño)" valor={formatMXN(ingresoInteres)} />
            <div className="border-t border-border pt-4">
              <Linea
                etiqueta="Resultado neto del mes"
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
          </div>
        </Card>
      </div>
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
