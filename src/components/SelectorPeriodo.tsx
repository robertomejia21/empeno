"use client";

import { Suspense, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { atajosPeriodo } from "@/lib/reporteSemanal";

export interface DescargaPeriodo {
  label: string;
  /** URL base de la descarga; se le agregan ?desde=&hasta= del periodo elegido. */
  href: string;
  tipo?: "excel" | "pdf";
}

const CTRL =
  "rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-primary-2 focus:bg-surface focus:ring-2 focus:ring-primary-2/20";

/**
 * Selector de periodo: Esta semana · Semana pasada · Este mes · Mes pasado ·
 * (Todo) · Personalizado (de tal a tal día).
 *
 * - `descargas`: botones que descargan el archivo del periodo elegido.
 * - `navegar`: si se indica, el periodo se refleja en la URL (?desde=&hasta=)
 *   para que la página del servidor vuelva a calcular sus tablas.
 */
export function SelectorPeriodo(props: Parameters<typeof SelectorPeriodoInterno>[0]) {
  // useSearchParams exige un límite de Suspense.
  return (
    <Suspense fallback={null}>
      <SelectorPeriodoInterno {...props} />
    </Suspense>
  );
}

function SelectorPeriodoInterno({
  desde: desdeInicial = "",
  hasta: hastaInicial = "",
  incluirTodo = false,
  descargas = [],
  navegar,
  etiqueta = "Periodo",
  className = "",
}: {
  desde?: string;
  hasta?: string;
  incluirTodo?: boolean;
  descargas?: DescargaPeriodo[];
  navegar?: { paramDesde: string; paramHasta: string };
  etiqueta?: string;
  className?: string;
}) {
  const atajos = useMemo(() => atajosPeriodo(), []);
  const claveInicial = (() => {
    if (!desdeInicial && !hastaInicial) return incluirTodo ? "todo" : atajos[0].clave;
    const a = atajos.find((x) => x.desde === desdeInicial && x.hasta === hastaInicial);
    return a ? a.clave : "personalizado";
  })();
  const inicial = atajos.find((x) => x.clave === claveInicial);

  const [clave, setClave] = useState(claveInicial);
  const [desde, setDesde] = useState(desdeInicial || inicial?.desde || "");
  const [hasta, setHasta] = useState(hastaInicial || inicial?.hasta || "");
  const [pendiente, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const aplicar = (d: string, h: string) => {
    if (!navegar) return;
    const sp = new URLSearchParams(searchParams.toString());
    if (d) sp.set(navegar.paramDesde, d); else sp.delete(navegar.paramDesde);
    if (h) sp.set(navegar.paramHasta, h); else sp.delete(navegar.paramHasta);
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const cambiarClave = (k: string) => {
    setClave(k);
    if (k === "todo") {
      setDesde(""); setHasta(""); aplicar("", "");
    } else if (k !== "personalizado") {
      const a = atajos.find((x) => x.clave === k)!;
      setDesde(a.desde); setHasta(a.hasta); aplicar(a.desde, a.hasta);
    }
  };

  const cambiarFecha = (d: string, h: string) => {
    setDesde(d); setHasta(h);
    if (d && h && d <= h) aplicar(d, h);
  };

  const rangoInvalido = clave === "personalizado" && (!desde || !hasta || desde > hasta);
  const urlDescarga = (base: string) => {
    if (clave === "todo" || (!desde && !hasta)) return base;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}desde=${desde}&hasta=${hasta}`;
  };

  return (
    <div className={`flex flex-wrap items-end gap-2 ${className}`}>
      <label className="flex flex-col gap-1">
        <span className="flex items-center gap-1 text-xs font-medium text-muted">
          <CalendarRange className="h-3.5 w-3.5" aria-hidden /> {etiqueta}
          {pendiente && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
        </span>
        <select value={clave} onChange={(e) => cambiarClave(e.target.value)} className={CTRL}>
          {atajos.map((a) => (
            <option key={a.clave} value={a.clave}>{a.label}</option>
          ))}
          {incluirTodo && <option value="todo">Todo</option>}
          <option value="personalizado">Personalizado (de… a…)</option>
        </select>
      </label>
      {clave === "personalizado" && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Del</span>
            <input type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiarFecha(e.target.value, hasta)} className={CTRL} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Al</span>
            <input type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiarFecha(desde, e.target.value)} className={CTRL} />
          </label>
        </>
      )}
      {descargas.map((d) => {
        const Icono = d.tipo === "pdf" ? FileText : d.tipo === "excel" ? FileSpreadsheet : Download;
        const cls =
          "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-soft transition hover:bg-surface-2";
        return rangoInvalido ? (
          <span key={d.label} className={`${cls} cursor-not-allowed opacity-50`} title="Elige un rango de fechas válido">
            <Icono className="h-4 w-4" aria-hidden /> {d.label}
          </span>
        ) : (
          <a key={d.label} href={urlDescarga(d.href)} className={cls}>
            <Icono className="h-4 w-4" aria-hidden /> {d.label}
          </a>
        );
      })}
    </div>
  );
}
