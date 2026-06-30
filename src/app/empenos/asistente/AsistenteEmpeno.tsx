"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { crearEmpenoGuiado } from "@/lib/actions";
import { tasaPorHistorial, calcularVencimiento, prestamoSugerido } from "@/lib/interes";
import { formatMXN, formatFecha, formatFechaLarga, hoyISO } from "@/lib/format";
import { Card } from "@/components/ui";
import type { CategoriaPrenda, PeriodoInteres, TipoIdentificacion } from "@/lib/types";
import { PASOS } from "./pasos";
import { Stepper } from "./Stepper";

interface ClienteOpt {
  id: string;
  nombre: string;
  curp: string | null;
  telefono: string | null;
  previos: number;
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

const categorias: CategoriaPrenda[] = [
  "Vehículos", "Electrónica", "Herramientas", "Joyería",
  "Relojes", "Instrumentos", "Electrodomésticos", "Otro",
];

const tiposId: { value: TipoIdentificacion; label: string }[] = [
  { value: "INE", label: "INE / IFE" },
  { value: "Pasaporte", label: "Pasaporte" },
  { value: "Licencia", label: "Licencia de conducir" },
  { value: "Cédula", label: "Cédula profesional" },
  { value: "Otro", label: "Otro" },
];

export function AsistenteEmpeno({ clientes }: { clientes: ClienteOpt[] }) {
  const [paso, setPaso] = useState(1);

  // Paso 2 — cliente
  const [modoCliente, setModoCliente] = useState<"existente" | "nuevo">(
    clientes.length > 0 ? "existente" : "nuevo"
  );
  const [clienteId, setClienteId] = useState("");
  const [cn, setCn] = useState({
    nombre: "", apellidoPaterno: "", apellidoMaterno: "",
    curp: "", telefono: "", direccion: "", email: "",
    tipoIdentificacion: "INE" as TipoIdentificacion, numeroIdentificacion: "",
  });

  // Paso 3 — departamento
  const [categoria, setCategoria] = useState<CategoriaPrenda | "">("");

  // Paso 4 — bien y avalúo
  const [bien, setBien] = useState({
    descripcion: "", marca: "", submarca: "", modelo: "", color: "",
    serie: "", placas: "", metal: "", kilataje: "", gramos: "",
  });
  const [valorAvaluo, setValorAvaluo] = useState("");

  // Paso 5 — préstamo
  const [monto, setMonto] = useState("");

  // Paso 6 — intereses y cargos
  const [tasa, setTasa] = useState(10.8);
  const [almacenajePct, setAlmacenajePct] = useState(0);
  const [ivaPct, setIvaPct] = useState(0);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [comisionista, setComisionista] = useState("");
  const [periodo, setPeriodo] = useState<PeriodoInteres>("mensual");
  const [plazo, setPlazo] = useState(1);
  const [diasGracia, setDiasGracia] = useState(7);
  const [fechaInicio, setFechaInicio] = useState(hoyISO());

  // Paso 8 — resguardo
  const [ubicacion, setUbicacion] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [funcionamiento, setFuncionamiento] = useState(false);
  const [documentacion, setDocumentacion] = useState(false);

  // Verificación de auto (REPUVE / robo / documentación)
  const [repuveFolio, setRepuveFolio] = useState("");
  const [sinRobo, setSinRobo] = useState(false);
  const [docFactura, setDocFactura] = useState(false);
  const [docTarjeta, setDocTarjeta] = useState(false);
  const [docIdent, setDocIdent] = useState(false);

  // Finalización
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ empenoId: string; folio: string } | null>(null);

  const clienteSel = clientes.find((c) => c.id === clienteId);
  const previos = modoCliente === "existente" ? clienteSel?.previos ?? 0 : 0;
  const historial = tasaPorHistorial(previos);
  const esVehiculo = categoria === "Vehículos";
  const esJoyeria = categoria === "Joyería";
  const avaluoNum = parseFloat(valorAvaluo) || 0;
  const montoNum = parseFloat(monto) || 0;

  const vencimiento = useMemo(
    () => calcularVencimiento(fechaInicio, periodo, plazo),
    [fechaInicio, periodo, plazo]
  );

  // Al entrar al paso de intereses, sugerir tasa por historial
  function irAPaso(n: number) {
    if (n === 6) setTasa(historial.tasa);
    if (n === 5 && !monto && avaluoNum > 0) setMonto(String(prestamoSugerido(avaluoNum)));
    setPaso(n);
  }

  function puedeAvanzar(): boolean {
    switch (paso) {
      case 2:
        return modoCliente === "existente"
          ? !!clienteId
          : !!(cn.nombre && cn.apellidoPaterno && cn.numeroIdentificacion);
      case 3:
        return !!categoria;
      case 4:
        return !!bien.descripcion && avaluoNum > 0;
      case 5:
        return montoNum > 0;
      case 6:
        return tasa > 0 && plazo >= 1;
      default:
        return true;
    }
  }

  const autoVerificado = sinRobo && docFactura && docTarjeta && docIdent;

  async function finalizar() {
    if (esVehiculo && !autoVerificado) {
      setError("Para vehículos debes verificar REPUVE (sin reporte de robo) y la documentación completa.");
      setPaso(8);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const res = await crearEmpenoGuiado({
        clienteExistenteId: modoCliente === "existente" ? clienteId : null,
        clienteNuevo:
          modoCliente === "nuevo"
            ? {
                nombre: cn.nombre,
                apellidoPaterno: cn.apellidoPaterno,
                apellidoMaterno: cn.apellidoMaterno,
                curp: cn.curp || null,
                telefono: cn.telefono || null,
                direccion: cn.direccion || null,
                email: cn.email || null,
                tipoIdentificacion: cn.tipoIdentificacion,
                numeroIdentificacion: cn.numeroIdentificacion,
              }
            : null,
        prenda: {
          categoria: categoria as CategoriaPrenda,
          descripcion: bien.descripcion,
          marca: bien.marca || null,
          submarca: bien.submarca || null,
          modelo: bien.modelo || null,
          color: bien.color || null,
          serie: bien.serie || null,
          placas: bien.placas || null,
          metal: bien.metal || null,
          kilataje: bien.kilataje || null,
          gramos: bien.gramos ? parseFloat(bien.gramos) : null,
          valorAvaluo: avaluoNum,
          ubicacionResguardo: ubicacion || null,
          fotos,
          funcionamientoValidado: funcionamiento,
          documentacionValidada: documentacion,
          seguro: null,
          gps: esVehiculo ? "Por verificar" : null,
          garantia: esVehiculo ? bien.descripcion : null,
          verificado: esVehiculo ? autoVerificado : true,
          repuveFolio: esVehiculo ? repuveFolio || null : null,
          notas: condiciones || null,
        },
        montoPrestado: montoNum,
        tasaInteres: tasa,
        almacenajePct,
        ivaPct,
        metodoPago: metodoPago as "efectivo" | "tarjeta" | "transferencia" | "cheque",
        comisionista: comisionista || null,
        centroCosto: null,
        periodo,
        plazoPeriodos: plazo,
        diasGracia,
        fechaInicio,
        notas: null,
      });
      setResultado(res);
      setPaso(9);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  const nombreCliente =
    modoCliente === "existente"
      ? clienteSel?.nombre ?? "—"
      : `${cn.nombre} ${cn.apellidoPaterno} ${cn.apellidoMaterno}`.trim();

  return (
    <div>
      {paso < 9 && <Stepper actual={paso} />}

      <Card className="p-6">
        {/* ---------- PASO 1: Inicio ---------- */}
        {paso === 1 && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-3xl">
              🧾
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Inicio de operación
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Recepción del bien prendario por parte del cliente. Este asistente te
              guiará por los <strong>9 pasos</strong> para formalizar el empeño:
              registro del cliente, captura del artículo, asignación del préstamo e
              intereses, generación del contrato y resguardo.
            </p>
            <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-2 text-left text-xs text-muted">
              {PASOS.slice(1).map((p) => (
                <div key={p.n} className="flex items-center gap-1.5">
                  <span style={{ color: p.color }}>●</span>
                  {p.titulo}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- PASO 2: Cliente ---------- */}
        {paso === 2 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Toggle
                activo={modoCliente === "existente"}
                onClick={() => setModoCliente("existente")}
                disabled={clientes.length === 0}
              >
                Cliente existente
              </Toggle>
              <Toggle activo={modoCliente === "nuevo"} onClick={() => setModoCliente("nuevo")}>
                Cliente nuevo
              </Toggle>
            </div>

            {modoCliente === "existente" ? (
              <div>
                <Label>Selecciona el cliente</Label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Selecciona —</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.previos} empeños)
                    </option>
                  ))}
                </select>
                {clienteSel && (
                  <p className="mt-2 text-xs text-muted">
                    CURP: {clienteSel.curp ?? "—"} · Tel: {clienteSel.telefono ?? "—"}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Nombre(s)" req value={cn.nombre} onChange={(v) => setCn({ ...cn, nombre: v })} />
                <Campo label="Apellido paterno" req value={cn.apellidoPaterno} onChange={(v) => setCn({ ...cn, apellidoPaterno: v })} />
                <Campo label="Apellido materno" value={cn.apellidoMaterno} onChange={(v) => setCn({ ...cn, apellidoMaterno: v })} />
                <Campo label="CURP" value={cn.curp} onChange={(v) => setCn({ ...cn, curp: v })} />
                <Campo label="Teléfono" value={cn.telefono} onChange={(v) => setCn({ ...cn, telefono: v })} />
                <div>
                  <Label>Tipo de identificación</Label>
                  <select
                    value={cn.tipoIdentificacion}
                    onChange={(e) => setCn({ ...cn, tipoIdentificacion: e.target.value as TipoIdentificacion })}
                    className={inputCls}
                  >
                    {tiposId.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <Campo label="Número de identificación" req value={cn.numeroIdentificacion} onChange={(v) => setCn({ ...cn, numeroIdentificacion: v })} />
                <div className="sm:col-span-2">
                  <Campo label="Dirección" value={cn.direccion} onChange={(v) => setCn({ ...cn, direccion: v })} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- PASO 3: Departamento ---------- */}
        {paso === 3 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(c)}
                className={`rounded-xl border-2 p-4 text-center text-sm font-medium transition ${
                  categoria === c
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-surface text-foreground hover:bg-surface-2"
                }`}
              >
                <span className="block text-2xl">{iconoCat(c)}</span>
                <span className="mt-1 block">{c}</span>
              </button>
            ))}
          </div>
        )}

        {/* ---------- PASO 4: Datos del bien ---------- */}
        {paso === 4 && (
          <div className="space-y-4">
            <Campo label="Descripción del bien" req value={bien.descripcion} onChange={(v) => setBien({ ...bien, descripcion: v })}
              placeholder={esVehiculo ? "Ej. Automóvil sedán 4 puertas" : "Ej. Anillo de oro 14k"} />

            {esVehiculo ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Marca" value={bien.marca} onChange={(v) => setBien({ ...bien, marca: v })} placeholder="Nissan" />
                <Campo label="Submarca / línea" value={bien.submarca} onChange={(v) => setBien({ ...bien, submarca: v })} placeholder="Versa" />
                <Campo label="Modelo (año)" value={bien.modelo} onChange={(v) => setBien({ ...bien, modelo: v })} placeholder="2020" />
                <Campo label="Color" value={bien.color} onChange={(v) => setBien({ ...bien, color: v })} />
                <Campo label="Número de serie (NIV)" value={bien.serie} onChange={(v) => setBien({ ...bien, serie: v })} />
                <Campo label="Placas" value={bien.placas} onChange={(v) => setBien({ ...bien, placas: v })} />
              </div>
            ) : esJoyeria ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Metal" value={bien.metal} onChange={(v) => setBien({ ...bien, metal: v })} placeholder="Oro" />
                <Campo label="Kilataje" value={bien.kilataje} onChange={(v) => setBien({ ...bien, kilataje: v })} placeholder="14k" />
                <Campo label="Gramos" type="number" value={bien.gramos} onChange={(v) => setBien({ ...bien, gramos: v })} />
                <Campo label="Color" value={bien.color} onChange={(v) => setBien({ ...bien, color: v })} />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Marca" value={bien.marca} onChange={(v) => setBien({ ...bien, marca: v })} />
                <Campo label="Modelo" value={bien.modelo} onChange={(v) => setBien({ ...bien, modelo: v })} />
                <Campo label="Número de serie" value={bien.serie} onChange={(v) => setBien({ ...bien, serie: v })} />
                <Campo label="Color" value={bien.color} onChange={(v) => setBien({ ...bien, color: v })} />
              </div>
            )}

            <Campo label="Valor de avalúo (MXN)" req type="number" value={valorAvaluo} onChange={setValorAvaluo} />
            {avaluoNum > 0 && (
              <p className="text-xs text-muted">
                Préstamo sugerido (50%): <strong>{formatMXN(prestamoSugerido(avaluoNum))}</strong>
              </p>
            )}
          </div>
        )}

        {/* ---------- PASO 5: Préstamo ---------- */}
        {paso === 5 && (
          <div className="space-y-4">
            <Campo label="Monto autorizado del préstamo (MXN)" req type="number" value={monto} onChange={setMonto} />
            <div className="rounded-lg bg-info-soft px-4 py-3 text-sm text-info">
              💵 Al finalizar se registrará automáticamente la <strong>salida de efectivo</strong> de{" "}
              {formatMXN(montoNum)} en el módulo de Caja (apartado de aportación y retiro).
            </div>
            {avaluoNum > 0 && montoNum > avaluoNum && (
              <div className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning">
                ⚠️ El monto supera el valor de avalúo ({formatMXN(avaluoNum)}). Verifica el préstamo.
              </div>
            )}
          </div>
        )}

        {/* ---------- PASO 6: Intereses ---------- */}
        {paso === 6 && (
          <div className="space-y-4">
            <div className="rounded-lg bg-surface-2 p-4">
              <p className="text-sm text-muted">Cliente: <strong className="text-foreground">{nombreCliente}</strong> · {previos} empeños previos</p>
              <p className="mt-1 text-sm">
                Nivel: <strong>{historial.nivel}</strong> → tasa sugerida{" "}
                <strong className="text-primary">{historial.tasa}%</strong>
                {historial.requiereAutorizacion && (
                  <span className="text-warning"> (requiere autorización de Gerencia)</span>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[10.8, 8.64, 6.48].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTasa(t)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      tasa === t ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-surface"
                    }`}
                  >
                    {t}%
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Interés (% por periodo)" req type="number" value={String(tasa)} onChange={(v) => setTasa(parseFloat(v) || 0)} />
              <Campo label="Almacenaje (% por periodo)" type="number" value={String(almacenajePct)} onChange={(v) => setAlmacenajePct(parseFloat(v) || 0)} />
              <Campo label="IVA (%)" type="number" value={String(ivaPct)} onChange={(v) => setIvaPct(parseFloat(v) || 0)} />
              <div>
                <Label>Método de pago</Label>
                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className={inputCls}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              <div>
                <Label>Periodo</Label>
                <select value={periodo} onChange={(e) => setPeriodo(e.target.value as PeriodoInteres)} className={inputCls}>
                  <option value="mensual">Mensual (30 días)</option>
                  <option value="quincenal">Quincenal (15 días)</option>
                  <option value="semanal">Semanal (7 días)</option>
                </select>
              </div>
              <Campo label="Plazo (periodos)" type="number" value={String(plazo)} onChange={(v) => setPlazo(parseInt(v) || 1)} />
              <Campo label="Días de gracia" type="number" value={String(diasGracia)} onChange={(v) => setDiasGracia(parseInt(v) || 0)} />
              <div>
                <Label>Fecha de inicio</Label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={inputCls} />
              </div>
              <Campo label="Comisionista (opcional)" value={comisionista} onChange={setComisionista} />
            </div>
          </div>
        )}

        {/* ---------- PASO 7: Contrato (revisión) ---------- */}
        {paso === 7 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Revisa las condiciones. Al finalizar, el sistema generará el contrato
              prendario que podrás imprimir y entregar al cliente.
            </p>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              <Rev k="Cliente" v={nombreCliente} />
              <Rev k="Departamento" v={categoria || "—"} />
              <Rev k="Bien" v={bien.descripcion} />
              <Rev k="Avalúo" v={formatMXN(avaluoNum)} />
              <Rev k="Préstamo" v={formatMXN(montoNum)} />
              <Rev k="Interés" v={`${tasa}% ${periodo}`} />
              <Rev k="Interés por periodo" v={formatMXN(montoNum * (tasa / 100))} />
              <Rev k="A liquidar (1er periodo)" v={formatMXN(montoNum + montoNum * (tasa / 100))} />
              <Rev k="Inicio" v={formatFecha(fechaInicio)} />
              <Rev k="Vencimiento" v={formatFecha(vencimiento)} />
            </div>
          </div>
        )}

        {/* ---------- PASO 8: Resguardo ---------- */}
        {paso === 8 && (
          <div className="space-y-4">
            <div>
              <Label>Fotografías del artículo / vehículo</Label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setFotos(Array.from(e.target.files ?? []).map((f) => f.name))
                }
                className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
              />
              {fotos.length > 0 && (
                <p className="mt-1 text-xs text-success">✓ {fotos.length} archivo(s): {fotos.join(", ")}</p>
              )}
              <p className="mt-1 text-xs text-muted">
                (En esta demo se guardan los nombres; con Supabase Storage se subirán las imágenes.)
              </p>
            </div>
            <Campo label="Ubicación de resguardo" value={ubicacion} onChange={setUbicacion} placeholder="Ej. Bóveda - Caja 3 / Estacionamiento B" />
            <div>
              <Label>Condiciones físicas / observaciones</Label>
              <textarea value={condiciones} onChange={(e) => setCondiciones(e.target.value)} rows={3} className={inputCls} />
            </div>
            {esVehiculo && (
              <div className="space-y-3 rounded-lg border border-warning/30 bg-warning-soft p-4">
                <p className="text-sm font-semibold text-warning">🚗 Verificación obligatoria del vehículo</p>
                <a
                  href="https://www2.repuve.gob.mx:8443/ciudadania/consulta/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-info underline-offset-2 hover:underline"
                >
                  🔎 Consultar en REPUVE (robo / situación legal) →
                </a>
                <Campo label="Folio de consulta REPUVE" value={repuveFolio} onChange={setRepuveFolio} placeholder="Folio o referencia de la consulta" />
                <div className="space-y-2 border-t border-warning/20 pt-2">
                  <Check label="REPUVE consultado: SIN reporte de robo" checked={sinRobo} onChange={setSinRobo} />
                  <Check label="Factura original verificada" checked={docFactura} onChange={setDocFactura} />
                  <Check label="Tarjeta de circulación vigente" checked={docTarjeta} onChange={setDocTarjeta} />
                  <Check label="Identificación del propietario coincide" checked={docIdent} onChange={setDocIdent} />
                  <Check label="Funcionamiento validado" checked={funcionamiento} onChange={setFuncionamiento} />
                  <Check label="Documentación resguardada" checked={documentacion} onChange={setDocumentacion} />
                </div>
                {!autoVerificado && (
                  <p className="text-xs text-warning">Marca REPUVE sin robo + factura + tarjeta + identificación para poder registrar.</p>
                )}
              </div>
            )}
            {error && <p className="text-sm text-danger">⚠️ {error}</p>}
          </div>
        )}

        {/* ---------- PASO 9: Vigencia / éxito ---------- */}
        {paso === 9 && resultado && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-3xl">
              ✅
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Empeño {resultado.folio} registrado
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              El contrato prendario fue generado. La vigencia es de <strong>30 días naturales</strong>;
              vence el <strong>{formatFechaLarga(vencimiento)}</strong>. El refrendo o pago deberá
              realizarse dentro del plazo.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={`/empenos/${resultado.empenoId}`}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-fg hover:opacity-90"
              >
                Ver empeño e imprimir contrato →
              </Link>
              <Link
                href="/empenos/asistente"
                className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:bg-surface-2"
              >
                Registrar otro empeño
              </Link>
            </div>
          </div>
        )}

        {/* ---------- Navegación ---------- */}
        {paso < 9 && (
          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            {paso > 1 ? (
              <button
                type="button"
                onClick={() => setPaso(paso - 1)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
              >
                ← Atrás
              </button>
            ) : (
              <Link
                href="/empenos"
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
              >
                Cancelar
              </Link>
            )}

            {paso < 8 ? (
              <button
                type="button"
                disabled={!puedeAvanzar()}
                onClick={() => irAPaso(paso + 1)}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-40"
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                disabled={guardando}
                onClick={finalizar}
                className="rounded-lg bg-success px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {guardando ? "Generando contrato…" : "Finalizar y generar contrato"}
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- Subcomponentes ----

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium text-foreground">{children}</span>;
}

function Campo({
  label, value, onChange, req, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  req?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>
        {label}
        {req && <span className="text-danger"> *</span>}
      </Label>
      <input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}

function Toggle({
  children, activo, onClick, disabled,
}: {
  children: React.ReactNode;
  activo: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
        activo ? "bg-primary text-primary-fg" : "border border-border bg-surface text-foreground hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

function Check({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}

function Rev({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-surface px-4 py-2.5">
      <p className="text-xs text-muted">{k}</p>
      <p className="text-sm font-medium text-foreground">{v}</p>
    </div>
  );
}

function iconoCat(c: CategoriaPrenda): string {
  const m: Record<CategoriaPrenda, string> = {
    Vehículos: "🚗", Electrónica: "💻", Herramientas: "🔧", Joyería: "💍",
    Relojes: "⌚", Instrumentos: "🎸", Electrodomésticos: "🔌", Otro: "📦",
  };
  return m[c];
}
