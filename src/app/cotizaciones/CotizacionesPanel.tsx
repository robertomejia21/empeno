"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { crearCotizacion, marcarResultadoCotizacion, analizarVehiculo, subirDocumentoCotizacion, solicitarAvaluoMecanico } from "@/lib/actions";
import { normalizarImagen } from "@/lib/imagen";
import { prestamoSugerido } from "@/lib/interes";
import { formatMXN, formatFecha } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui";
import type { Cotizacion, ContactoCotizacion, CondicionArticulo, TipoCotizacion, CotizacionInput } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

const CONTACTOS: ContactoCotizacion[] = [
  "Sucursal", "WhatsApp", "Messenger", "Teléfono", "Llamada", "Instagram", "Facebook", "Recomendación", "Cliente", "Otro",
];
const CONDICIONES: { v: CondicionArticulo; l: string }[] = [
  { v: "excelente", l: "Excelente" }, { v: "bueno", l: "Bueno" }, { v: "regular", l: "Regular" }, { v: "malo", l: "Malo" },
];

const FORM_VACIO = {
  tipo: "vehiculo" as TipoCotizacion,
  contacto: "" as ContactoCotizacion | "",
  descripcion: "",
  marca: "", submarca: "", modelo: "", serie: "", placas: "", kilometraje: "",
  condicion: "bueno" as CondicionArticulo,
  prospectoNombre: "", prospectoTelefono: "",
  valorMercado: "", busquedaFacebook: "", montoSolicitado: "",
  porcentaje: "50", prestamoOfrecido: "",
  notas: "",
};

export function CotizacionesPanel({ cotizaciones }: { cotizaciones: Cotizacion[] }) {
  const router = useRouter();
  const [f, setF] = useState(FORM_VACIO);
  const [prestamoTocado, setPrestamoTocado] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [docMsg, setDocMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const set = <K extends keyof typeof FORM_VACIO>(k: K, v: (typeof FORM_VACIO)[K]) => setF((s) => ({ ...s, [k]: v }));

  const esVehiculo = f.tipo === "vehiculo";
  const valorNum = parseFloat(f.valorMercado) || 0;
  const pctNum = parseFloat(f.porcentaje) || 0;
  const sugerido = valorNum > 0 ? prestamoSugerido(valorNum, pctNum) : 0;
  const prestamoFinal = prestamoTocado ? parseFloat(f.prestamoOfrecido) || 0 : sugerido;

  async function onEscanear(file: File | undefined) {
    if (!file) return;
    setLeyendo(true);
    setDocMsg(null);
    try {
      const r = await analizarVehiculo(await normalizarImagen(file));
      if (!r.ok) {
        setDocMsg({ ok: false, texto: `${r.error} Captura los datos a mano.` });
        return;
      }
      const d = r.datos;
      const leidos = Object.values(d).filter(Boolean).length;
      setF((s) => ({
        ...s,
        marca: d.marca ?? s.marca,
        submarca: d.submarca ?? s.submarca,
        modelo: d.modelo ?? s.modelo,
        serie: d.niv ?? s.serie,
        placas: d.placas ?? s.placas,
        descripcion: s.descripcion || [d.marca, d.submarca, d.modelo].filter(Boolean).join(" "),
      }));
      setDocMsg(
        leidos === 0
          ? { ok: false, texto: "No se distinguió información. Toma la foto con buena luz." }
          : { ok: true, texto: `✓ ${leidos} dato(s) leídos del documento.` }
      );
    } catch {
      setDocMsg({ ok: false, texto: "Error al leer el documento. Intenta otra foto." });
    } finally {
      setLeyendo(false);
    }
  }

  async function guardar() {
    if (!f.descripcion.trim() || valorNum <= 0) return;
    setGuardando(true);
    try {
      const input: CotizacionInput = {
        tipo: f.tipo,
        categoria: esVehiculo ? "Vehículos" : "Otro",
        descripcion: f.descripcion.trim(),
        prospectoNombre: f.prospectoNombre || null,
        prospectoTelefono: f.prospectoTelefono || null,
        marca: f.marca || null,
        submarca: f.submarca || null,
        modelo: f.modelo || null,
        serie: f.serie || null,
        placas: f.placas || null,
        kilometraje: f.kilometraje ? parseFloat(f.kilometraje) : null,
        condicion: f.condicion,
        metal: null,
        kilataje: null,
        gramos: null,
        valorMercado: valorNum,
        valorEstimado: valorNum,
        montoSolicitado: f.montoSolicitado ? parseFloat(f.montoSolicitado) : null,
        busquedaFacebook: f.busquedaFacebook ? parseFloat(f.busquedaFacebook) : null,
        porcentajePrestamo: pctNum,
        prestamoOfrecido: prestamoFinal,
        contacto: f.contacto || null,
        fotos: [],
        notas: f.notas || null,
      };
      await crearCotizacion(input);
      setF(FORM_VACIO);
      setPrestamoTocado(false);
      setDocMsg(null);
      setAbierto(false);
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulario de nueva cotización */}
      <Card>
        <CardHeader
          title="Nueva cotización"
          subtitle="Cotiza un bien y registra el resultado para tu análisis de mercado"
          action={
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90"
            >
              {abierto ? "Cerrar" : "+ Cotizar"}
            </button>
          }
        />
        {abierto && (
          <div className="space-y-4 border-t border-border p-5">
            <div className="flex flex-wrap gap-2">
              <Tab activo={esVehiculo} onClick={() => set("tipo", "vehiculo")}>🚗 Vehículo</Tab>
              <Tab activo={!esVehiculo} onClick={() => set("tipo", "articulo")}>📦 Artículo</Tab>
            </div>

            {esVehiculo && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary-soft/40 p-3">
                <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg hover:opacity-90">
                  {leyendo ? "Leyendo…" : "📄 Escanear tarjeta / factura"}
                  <input type="file" accept="image/*" capture="environment" className="hidden" disabled={leyendo}
                    onChange={(e) => onEscanear(e.target.files?.[0])} />
                </label>
                {docMsg ? (
                  <p className={`w-full text-xs ${docMsg.ok ? "text-success" : "text-danger"}`}>{docMsg.texto}</p>
                ) : (
                  <p className="w-full text-xs text-muted">La IA lee marca, modelo, año, NIV y placas del documento.</p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Campo label="Descripción del bien" req value={f.descripcion} onChange={(v) => set("descripcion", v)}
                  placeholder={esVehiculo ? "Ej. Nissan Versa 2020" : "Ej. iPhone 13, Taladro Bosch…"} />
              </div>
              {esVehiculo ? (
                <>
                  <Campo label="Marca" value={f.marca} onChange={(v) => set("marca", v)} />
                  <Campo label="Submarca / línea" value={f.submarca} onChange={(v) => set("submarca", v)} />
                  <Campo label="Año" value={f.modelo} onChange={(v) => set("modelo", v)} placeholder="2020" />
                  <Campo label="Placas" value={f.placas} onChange={(v) => set("placas", v)} />
                  <Campo label="NIV / serie" value={f.serie} onChange={(v) => set("serie", v)} />
                  <Campo label="Kilometraje" type="number" value={f.kilometraje} onChange={(v) => set("kilometraje", v)} />
                </>
              ) : (
                <>
                  <Campo label="Marca" value={f.marca} onChange={(v) => set("marca", v)} />
                  <Campo label="Modelo" value={f.modelo} onChange={(v) => set("modelo", v)} />
                </>
              )}
              <div>
                <Label>Condición</Label>
                <select value={f.condicion} onChange={(e) => set("condicion", e.target.value as CondicionArticulo)} className={inputCls}>
                  {CONDICIONES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>
              <div>
                <Label>Contacto (canal)</Label>
                <select value={f.contacto} onChange={(e) => set("contacto", e.target.value as ContactoCotizacion)} className={inputCls}>
                  <option value="">— Selecciona —</option>
                  {CONTACTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Campo label="Nombre del prospecto" value={f.prospectoNombre} onChange={(v) => set("prospectoNombre", v)} />
              <Campo label="Teléfono" value={f.prospectoTelefono} onChange={(v) => set("prospectoTelefono", v)} />
            </div>

            <div className="grid gap-4 rounded-lg border border-border bg-surface-2/50 p-4 sm:grid-cols-2">
              <p className="sm:col-span-2 text-sm font-semibold text-foreground">💰 Valuación</p>
              <Campo label="Valor comercial (MXN)" req type="number" value={f.valorMercado} onChange={(v) => set("valorMercado", v)} />
              <Campo label="Búsqueda en Facebook (MXN)" type="number" value={f.busquedaFacebook} onChange={(v) => set("busquedaFacebook", v)}
                placeholder="Precio de referencia hallado" />
              <Campo label="Monto solicitado por el cliente (MXN)" type="number" value={f.montoSolicitado} onChange={(v) => set("montoSolicitado", v)} />
              <Campo label="% del préstamo sobre el valor" type="number" value={f.porcentaje} onChange={(v) => set("porcentaje", v)} />
              <div className="sm:col-span-2">
                <Label>Monto a prestar (MXN)</Label>
                <input type="number" className={inputCls}
                  value={prestamoTocado ? f.prestamoOfrecido : String(sugerido || "")}
                  onChange={(e) => { setPrestamoTocado(true); set("prestamoOfrecido", e.target.value); }} />
                {valorNum > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    Sugerido ({pctNum}% de {formatMXN(valorNum)}): <strong>{formatMXN(sugerido)}</strong>
                    {prestamoTocado && (
                      <button type="button" onClick={() => setPrestamoTocado(false)} className="ml-2 font-medium text-info hover:underline">
                        Usar sugerido
                      </button>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Notas / observaciones</Label>
              <textarea value={f.notas} onChange={(e) => set("notas", e.target.value)} rows={2} className={inputCls} />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={guardar}
                disabled={guardando || !f.descripcion.trim() || valorNum <= 0}
                className="rounded-lg bg-success px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {guardando ? "Guardando…" : "Guardar cotización"}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Reporte */}
      <TablaReporte
        titulo="Detalles del vehículo"
        icono="🚗"
        filas={cotizaciones.filter((c) => c.tipo === "vehiculo")}
        onResultado={(id, si, motivo) => marcarResultadoCotizacion(id, si, motivo).then(() => router.refresh())}
      />
      <TablaReporte
        titulo="Detalles del artículo"
        icono="📦"
        filas={cotizaciones.filter((c) => c.tipo !== "vehiculo")}
        onResultado={(id, si, motivo) => marcarResultadoCotizacion(id, si, motivo).then(() => router.refresh())}
      />
    </div>
  );
}

function TablaReporte({
  titulo, icono, filas, onResultado,
}: {
  titulo: string;
  icono: string;
  filas: Cotizacion[];
  onResultado: (id: string, si: boolean, motivo: string | null) => void;
}) {
  const totalOfrecido = useMemo(() => filas.reduce((s, c) => s + c.prestamoOfrecido, 0), [filas]);
  return (
    <Card>
      <CardHeader title={`${icono} ${titulo}`} subtitle={`${filas.length} cotización(es) · ofrecido ${formatMXN(totalOfrecido)}`} />
      {filas.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">Aún no hay cotizaciones registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2 font-medium">Bien</th>
                <th className="px-3 py-2 font-medium">Año</th>
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 text-right font-medium">Solicitado</th>
                <th className="px-3 py-2 text-right font-medium">A prestar</th>
                <th className="px-3 py-2 text-right font-medium">Facebook</th>
                <th className="px-3 py-2 font-medium">¿Se empeñó?</th>
                <th className="px-3 py-2 font-medium">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((c) => (
                <FilaCot key={c.id} c={c} onResultado={onResultado} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function FilaCot({ c, onResultado }: { c: Cotizacion; onResultado: (id: string, si: boolean, motivo: string | null) => void }) {
  const router = useRouter();
  const [motivando, setMotivando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [solicitando, setSolicitando] = useState(false);

  async function onSolicitarMecanico() {
    setSolicitando(true);
    try {
      await solicitarAvaluoMecanico(c.id);
      router.refresh();
    } finally {
      setSolicitando(false);
    }
  }

  async function onDoc(f: File | undefined) {
    if (!f) return;
    setSubiendo(true);
    try {
      await subirDocumentoCotizacion(c.id, await normalizarImagen(f, 1600));
      router.refresh();
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <tr className="border-b border-border/60 align-top">
      <td className="px-4 py-2.5">
        <p className="font-medium text-foreground">{c.descripcion}</p>
        <p className="text-xs text-muted">{c.folio}{c.prospectoNombre ? ` · ${c.prospectoNombre}` : ""}</p>
        {c.tipo === "vehiculo" && (
          <div className="mt-1 text-xs">
            {c.avaluoEstado === "respondido" ? (
              <span className="text-success">🔧 Mecánico: <strong>{c.avaluoMecanico != null ? formatMXN(c.avaluoMecanico) : "—"}</strong>{c.comentarioMecanico ? ` · ${c.comentarioMecanico}` : ""}</span>
            ) : c.avaluoEstado === "solicitado" ? (
              <span className="text-warning">⏳ Con el mecánico…</span>
            ) : (
              <button type="button" onClick={onSolicitarMecanico} disabled={solicitando} className="font-medium text-primary hover:underline disabled:opacity-50">
                {solicitando ? "Enviando…" : "🔧 Enviar al mecánico"}
              </button>
            )}
          </div>
        )}
        {c.seEmpeno === true && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {c.documentos.length > 0 && (
              <a href={c.documentos[c.documentos.length - 1]} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-info hover:underline">
                📎 {c.documentos.length} doc(s)
              </a>
            )}
            <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
              {subiendo ? "Subiendo…" : "+ Adjuntar documentación"}
              <input type="file" accept="image/*" className="hidden" disabled={subiendo} onChange={(e) => onDoc(e.target.files?.[0])} />
            </label>
          </div>
        )}
      </td>
      <td className="px-3 py-2.5 text-muted">{c.modelo ?? "—"}</td>
      <td className="px-3 py-2.5 text-muted">{formatFecha(c.creadoEn)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">{c.montoSolicitado ? formatMXN(c.montoSolicitado) : "—"}</td>
      <td className="px-3 py-2.5 text-right font-medium tabular-nums text-foreground">{formatMXN(c.prestamoOfrecido)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-muted">{c.busquedaFacebook ? formatMXN(c.busquedaFacebook) : "—"}</td>
      <td className="px-3 py-2.5">
        {c.seEmpeno === null ? (
          motivando ? (
            <div className="flex flex-col gap-1">
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo…"
                className="w-40 rounded border border-border bg-surface px-2 py-1 text-xs outline-none" />
              <div className="flex gap-1">
                <button onClick={() => onResultado(c.id, false, motivo || null)} className="rounded bg-danger px-2 py-0.5 text-xs font-medium text-white">Guardar</button>
                <button onClick={() => setMotivando(false)} className="rounded border border-border px-2 py-0.5 text-xs">Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1">
              <button onClick={() => onResultado(c.id, true, null)} className="rounded bg-success px-2 py-0.5 text-xs font-medium text-white hover:opacity-90">Sí</button>
              <button onClick={() => setMotivando(true)} className="rounded border border-border px-2 py-0.5 text-xs hover:bg-surface-2">No</button>
            </div>
          )
        ) : c.seEmpeno ? (
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">Sí</span>
        ) : (
          <span className="text-xs text-muted">No{c.motivoNo ? ` · ${c.motivoNo}` : ""}</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-muted">{c.contacto ?? "—"}</td>
    </tr>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium text-foreground">{children}</span>;
}

function Campo({
  label, value, onChange, req, type = "text", placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; req?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{label}{req && <span className="text-danger"> *</span>}</Label>
      <input type={type} step={type === "number" ? "0.01" : undefined} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  );
}

function Tab({ children, activo, onClick }: { children: React.ReactNode; activo: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activo ? "bg-primary text-primary-fg" : "border border-border bg-surface text-foreground hover:bg-surface-2"}`}>
      {children}
    </button>
  );
}
