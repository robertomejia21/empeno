"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { crearEmpenoGuiado, analizarINE, analizarVehiculo, subirFotoCliente, subirArchivoPrenda } from "@/lib/actions";
import { tasaPorHistorial, calcularVencimiento, prestamoSugerido, requiereAutorizacionTasa } from "@/lib/interes";
import { formatMXN, formatFecha, formatFechaLarga, hoyISO } from "@/lib/format";
import { normalizarImagen, leerArchivo } from "@/lib/imagen";
import { CAMPOS_VEHICULO_VACIOS } from "@/lib/prenda";
import { MapaResguardo } from "@/components/MapaResguardo";
import { Card } from "@/components/ui";
import type { CategoriaPrenda, PeriodoInteres, TipoIdentificacion, ProductoInteres } from "@/lib/types";
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

export function AsistenteEmpeno({ clientes, productos }: { clientes: ClienteOpt[]; productos: ProductoInteres[] }) {
  const [paso, setPaso] = useState(1);

  // Paso 2 — cliente
  const [modoCliente, setModoCliente] = useState<"existente" | "nuevo">(
    clientes.length > 0 ? "existente" : "nuevo"
  );
  const [clienteId, setClienteId] = useState("");
  const [busqCliente, setBusqCliente] = useState("");
  const [cn, setCn] = useState({
    nombre: "", apellidoPaterno: "", apellidoMaterno: "",
    curp: "", telefono: "", direccion: "", email: "",
    fechaNacimiento: "",
    tipoIdentificacion: "INE" as TipoIdentificacion, numeroIdentificacion: "",
  });
  const [fotoCliente, setFotoCliente] = useState<string | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [ineMsg, setIneMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [leyendoDoc, setLeyendoDoc] = useState(false);
  const [docMsg, setDocMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function onEscanearINE(f: File | undefined) {
    if (!f) return;
    setEscaneando(true);
    setIneMsg(null);
    try {
      const r = await analizarINE(await normalizarImagen(f));
      if (!r.ok) {
        setIneMsg({ ok: false, texto: `${r.error} Puedes capturar los datos a mano.` });
        return;
      }
      const d = r.datos;
      const leidos = Object.values(d).filter(Boolean).length;
      setCn((c) => ({
        ...c,
        nombre: d.nombre ?? c.nombre,
        apellidoPaterno: d.apellidoPaterno ?? c.apellidoPaterno,
        apellidoMaterno: d.apellidoMaterno ?? c.apellidoMaterno,
        curp: d.curp ?? c.curp,
        direccion: d.domicilio ?? c.direccion,
        fechaNacimiento: d.fechaNacimiento ?? c.fechaNacimiento,
        numeroIdentificacion: d.claveElector ?? c.numeroIdentificacion,
        tipoIdentificacion: "INE",
      }));
      setIneMsg(
        leidos === 0
          ? { ok: false, texto: "No se distinguió ningún dato. Toma la foto de frente y con buena luz." }
          : { ok: true, texto: `✓ ${leidos} campo(s) autollenados desde la INE. Revísalos antes de continuar.` }
      );
    } catch {
      setIneMsg({ ok: false, texto: "Error al procesar la INE. Intenta con otra foto." });
    } finally {
      setEscaneando(false);
    }
  }

  async function onFotoCliente(f: File | undefined) {
    if (!f) return;
    setSubiendoFoto(true);
    try {
      const url = await subirFotoCliente(await normalizarImagen(f, 800));
      if (url) setFotoCliente(url);
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function onEscanearVehiculo(f: File | undefined) {
    if (!f) return;
    setLeyendoDoc(true);
    setDocMsg(null);
    try {
      const r = await analizarVehiculo(await normalizarImagen(f));
      if (!r.ok) {
        setDocMsg({ ok: false, texto: `${r.error} Puedes capturar los datos a mano.` });
        return;
      }
      const d = r.datos;
      const leidos = Object.values(d).filter(Boolean).length;
      setBien((b) => ({
        ...b,
        marca: d.marca ?? b.marca,
        submarca: d.submarca ?? b.submarca,
        modelo: d.modelo ?? b.modelo,
        color: d.color ?? b.color,
        placas: d.placas ?? b.placas,
        serie: d.niv ?? b.serie,
      }));
      setVeh((v) => ({
        ...v,
        tipoVehiculo: d.tipoVehiculo ?? v.tipoVehiculo,
        numeroMotor: d.numeroMotor ?? v.numeroMotor,
        transmision: d.transmision ?? v.transmision,
        numeroFactura: d.numeroFactura ?? v.numeroFactura,
        emisorFactura: d.emisorFactura ?? v.emisorFactura,
      }));
      setDocMsg(
        leidos === 0
          ? { ok: false, texto: "No se distinguió ningún dato. Toma la foto de frente y con buena luz." }
          : { ok: true, texto: `✓ ${leidos} campo(s) autollenados del documento. Revísalos antes de continuar.` }
      );
    } catch {
      setDocMsg({ ok: false, texto: "Error al procesar el documento. Intenta con otra foto." });
    } finally {
      setLeyendoDoc(false);
    }
  }

  // Paso 3 — departamento
  const [categoria, setCategoria] = useState<CategoriaPrenda | "">("");

  // Paso 4 — bien y avalúo
  const [bien, setBien] = useState({
    descripcion: "", marca: "", submarca: "", modelo: "", color: "",
    serie: "", placas: "", metal: "", kilataje: "", gramos: "",
  });
  const [valorAvaluo, setValorAvaluo] = useState("");
  // Paso 4 — comentarios del bien (daños, faltantes, estado)
  const [comentariosBien, setComentariosBien] = useState("");

  // Paso 4 — ficha del vehículo
  const [veh, setVeh] = useState({
    tipoVehiculo: "", transmision: "", numeroMotor: "", kilometraje: "",
    cilindros: "", claveVehicular: "", nivelGasolina: "",
    numeroFactura: "", emisorFactura: "", valorFactura: "", fechaFactura: "",
    aseguradora: "", poliza: "", danios: "", gpsUbicacion: "",
    seguroMensual: "", pensionMensual: "", gpsMensual: "",
  });

  // Modalidad del vehículo (GPS o Resguardo)
  const [modalidad, setModalidad] = useState<"gps" | "resguardo">("resguardo");

  // Paso 5 — préstamo
  const [monto, setMonto] = useState("");
  const [montoTocado, setMontoTocado] = useState(false);

  // Paso 6 — intereses y cargos
  const [tasa, setTasa] = useState(10.8);
  const [productoSelId, setProductoSelId] = useState<string | null>(null);
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
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  async function onSubirArchivos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setSubiendoFotos(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const dataUrl = f.type === "application/pdf" ? await leerArchivo(f) : await normalizarImagen(f, 1600);
        const url = await subirArchivoPrenda(dataUrl);
        if (url) urls.push(url);
      }
      setFotos((prev) => [...prev, ...urls]);
    } finally {
      setSubiendoFotos(false);
    }
  }
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
  const tasaEspecial = requiereAutorizacionTasa(tasa);

  const clientesFiltrados = useMemo(() => {
    const q = busqCliente.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.curp ?? "").toLowerCase().includes(q) ||
        (c.telefono ?? "").toLowerCase().includes(q)
    );
  }, [busqCliente, clientes]);

  const vencimiento = useMemo(
    () => calcularVencimiento(fechaInicio, periodo, plazo),
    [fechaInicio, periodo, plazo]
  );

  // Al entrar al paso de intereses, sugerir tasa por historial
  function irAPaso(n: number) {
    if (n === 6) setTasa(historial.tasa);
    if (n === 5 && !montoTocado && avaluoNum > 0) setMonto(String(prestamoSugerido(avaluoNum)));
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
                fechaNacimiento: cn.fechaNacimiento || null,
                tipoIdentificacion: cn.tipoIdentificacion,
                numeroIdentificacion: cn.numeroIdentificacion,
                foto: fotoCliente,
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
          ...(esVehiculo
            ? {
                tipoVehiculo: veh.tipoVehiculo || null,
                transmision: veh.transmision || null,
                numeroMotor: veh.numeroMotor || null,
                kilometraje: veh.kilometraje ? parseFloat(veh.kilometraje) : null,
                cilindros: veh.cilindros || null,
                claveVehicular: veh.claveVehicular || null,
                nivelGasolina: veh.nivelGasolina || null,
                numeroFactura: veh.numeroFactura || null,
                emisorFactura: veh.emisorFactura || null,
                valorFactura: veh.valorFactura ? parseFloat(veh.valorFactura) : null,
                fechaFactura: veh.fechaFactura || null,
                aseguradora: veh.aseguradora || null,
                poliza: veh.poliza || null,
                danios: veh.danios || null,
                gpsUbicacion: veh.gpsUbicacion || null,
                seguroMensual: veh.seguroMensual ? parseFloat(veh.seguroMensual) : null,
                pensionMensual: veh.pensionMensual ? parseFloat(veh.pensionMensual) : null,
                gpsMensual: veh.gpsMensual ? parseFloat(veh.gpsMensual) : null,
              }
            : CAMPOS_VEHICULO_VACIOS),
          verificado: esVehiculo ? autoVerificado : true,
          repuveFolio: esVehiculo ? repuveFolio || null : null,
          modalidad: esVehiculo ? modalidad : null,
          notas: [comentariosBien, condiciones].filter(Boolean).join("\n") || null,
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
        notas: tasaEspecial ? `Tasa especial ${tasa}% — pendiente de autorización` : null,
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
                <Label>Buscar cliente</Label>
                <input
                  value={busqCliente}
                  onChange={(e) => setBusqCliente(e.target.value)}
                  placeholder="Nombre, apellido, CURP o teléfono…"
                  className={inputCls}
                />
                <div className="mt-2 max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border">
                  {clientesFiltrados.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-muted">Sin coincidencias.</p>
                  ) : (
                    clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setClienteId(c.id)}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition ${
                          clienteId === c.id ? "bg-primary-soft text-primary" : "hover:bg-surface-2"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{c.nombre}</span>
                          <span className="block truncate text-xs text-muted">CURP: {c.curp ?? "—"} · Tel: {c.telefono ?? "—"}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted">{c.previos} empeño(s)</span>
                      </button>
                    ))
                  )}
                </div>
                {clienteSel && <p className="mt-2 text-xs text-success">✓ Seleccionado: {clienteSel.nombre}</p>}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Escaneo de INE + foto del cliente */}
                <div className="sm:col-span-2 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary-soft/40 p-3">
                  <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg hover:opacity-90">
                    {escaneando ? "Leyendo INE…" : "🪪 Escanear INE"}
                    <input type="file" accept="image/*" capture="environment" className="hidden" disabled={escaneando}
                      onChange={(e) => onEscanearINE(e.target.files?.[0])} />
                  </label>
                  <label className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2">
                    {subiendoFoto ? "Subiendo…" : fotoCliente ? "✓ Foto tomada" : "📸 Foto del cliente"}
                    <input type="file" accept="image/*" capture="user" className="hidden" disabled={subiendoFoto}
                      onChange={(e) => onFotoCliente(e.target.files?.[0])} />
                  </label>
                  {fotoCliente && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={fotoCliente} alt="Cliente" className="h-12 w-12 rounded-full object-cover" />
                  )}
                  {ineMsg ? (
                    <p className={`w-full text-xs ${ineMsg.ok ? "text-success" : "text-danger"}`}>{ineMsg.texto}</p>
                  ) : (
                    <p className="w-full text-xs text-muted">La INE autollena los campos con IA; la foto identifica al cliente cuando llegue.</p>
                  )}
                </div>
                <Campo label="Nombre(s)" req value={cn.nombre} onChange={(v) => setCn({ ...cn, nombre: v })} />
                <Campo label="Apellido paterno" req value={cn.apellidoPaterno} onChange={(v) => setCn({ ...cn, apellidoPaterno: v })} />
                <Campo label="Apellido materno" value={cn.apellidoMaterno} onChange={(v) => setCn({ ...cn, apellidoMaterno: v })} />
                <Campo label="CURP" value={cn.curp} onChange={(v) => setCn({ ...cn, curp: v })} />
                <Campo label="Teléfono" value={cn.telefono} onChange={(v) => setCn({ ...cn, telefono: v })} />
                <div>
                  <Label>Fecha de nacimiento</Label>
                  <input
                    type="date"
                    value={cn.fechaNacimiento}
                    onChange={(e) => setCn({ ...cn, fechaNacimiento: e.target.value })}
                    className={inputCls}
                  />
                </div>
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
              <>
                {/* Escaneo del documento del vehículo (tarjeta de circulación / factura) */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary-soft/40 p-3">
                  <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg hover:opacity-90">
                    {leyendoDoc ? "Leyendo documento…" : "📄 Escanear tarjeta / factura"}
                    <input type="file" accept="image/*" capture="environment" className="hidden" disabled={leyendoDoc}
                      onChange={(e) => onEscanearVehiculo(e.target.files?.[0])} />
                  </label>
                  {docMsg ? (
                    <p className={`w-full text-xs ${docMsg.ok ? "text-success" : "text-danger"}`}>{docMsg.texto}</p>
                  ) : (
                    <p className="w-full text-xs text-muted">Sube la tarjeta de circulación o la factura y la IA llena marca, modelo, NIV, placas y motor.</p>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-surface-2/50 p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Modalidad del vehículo</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setModalidad("resguardo")}
                      className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition ${modalidad === "resguardo" ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface hover:bg-surface-2"}`}
                    >
                      🏢 Resguardo
                      <span className="block text-[11px] font-normal text-muted">Queda en nuestra bóveda/patio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalidad("gps")}
                      className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition ${modalidad === "gps" ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface hover:bg-surface-2"}`}
                    >
                      📡 GPS
                      <span className="block text-[11px] font-normal text-muted">El cliente lo conserva con GPS</span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Tipo de vehículo" value={veh.tipoVehiculo} onChange={(v) => setVeh({ ...veh, tipoVehiculo: v })} placeholder="Sedán / Pick-up / SUV" />
                  <Campo label="Marca" value={bien.marca} onChange={(v) => setBien({ ...bien, marca: v })} placeholder="Nissan" />
                  <Campo label="Submarca / línea" value={bien.submarca} onChange={(v) => setBien({ ...bien, submarca: v })} placeholder="Versa" />
                  <Campo label="Modelo (año)" value={bien.modelo} onChange={(v) => setBien({ ...bien, modelo: v })} placeholder="2020" />
                  <Campo label="Color" value={bien.color} onChange={(v) => setBien({ ...bien, color: v })} />
                  <Campo label="Transmisión" value={veh.transmision} onChange={(v) => setVeh({ ...veh, transmision: v })} placeholder="Estándar / Automática" />
                  <Campo label="Número de serie (NIV)" value={bien.serie} onChange={(v) => setBien({ ...bien, serie: v })} />
                  <Campo label="Número de motor" value={veh.numeroMotor} onChange={(v) => setVeh({ ...veh, numeroMotor: v })} />
                  <Campo label="Kilometraje" type="number" value={veh.kilometraje} onChange={(v) => setVeh({ ...veh, kilometraje: v })} />
                  <Campo label="Cilindros" value={veh.cilindros} onChange={(v) => setVeh({ ...veh, cilindros: v })} placeholder="4" />
                  <Campo label="Placas" value={bien.placas} onChange={(v) => setBien({ ...bien, placas: v })} />
                  <Campo label="Clave vehicular" value={veh.claveVehicular} onChange={(v) => setVeh({ ...veh, claveVehicular: v })} />
                  <Campo label="Nivel de gasolina" value={veh.nivelGasolina} onChange={(v) => setVeh({ ...veh, nivelGasolina: v })} placeholder="1/2 tanque" />
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-surface-2/50 p-4">
                  <p className="text-sm font-semibold text-foreground">🧾 Factura</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="No. de factura" value={veh.numeroFactura} onChange={(v) => setVeh({ ...veh, numeroFactura: v })} />
                    <Campo label="Emisor de la factura" value={veh.emisorFactura} onChange={(v) => setVeh({ ...veh, emisorFactura: v })} />
                    <Campo label="Valor de factura (MXN)" type="number" value={veh.valorFactura} onChange={(v) => setVeh({ ...veh, valorFactura: v })} />
                    <div>
                      <Label>Fecha de factura</Label>
                      <input type="date" value={veh.fechaFactura} onChange={(e) => setVeh({ ...veh, fechaFactura: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-surface-2/50 p-4">
                  <p className="text-sm font-semibold text-foreground">🛡️ Seguro, pensión y GPS</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Aseguradora" value={veh.aseguradora} onChange={(v) => setVeh({ ...veh, aseguradora: v })} />
                    <Campo label="Póliza" value={veh.poliza} onChange={(v) => setVeh({ ...veh, poliza: v })} />
                    <Campo label="Seguro mensual (MXN)" type="number" value={veh.seguroMensual} onChange={(v) => setVeh({ ...veh, seguroMensual: v })} />
                    <Campo label="Pensión mensual (MXN)" type="number" value={veh.pensionMensual} onChange={(v) => setVeh({ ...veh, pensionMensual: v })} />
                    <Campo label="GPS mensual (MXN)" type="number" value={veh.gpsMensual} onChange={(v) => setVeh({ ...veh, gpsMensual: v })} />
                    <Campo label="Ubicación del GPS" value={veh.gpsUbicacion} onChange={(v) => setVeh({ ...veh, gpsUbicacion: v })} placeholder="Coordenadas o liga de Maps" />
                  </div>
                  {veh.gpsUbicacion && (
                    <a
                      href={/^https?:\/\//.test(veh.gpsUbicacion)
                        ? veh.gpsUbicacion
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(veh.gpsUbicacion)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-sm font-medium text-info underline-offset-2 hover:underline"
                    >
                      📍 Ver ubicación en el mapa →
                    </a>
                  )}
                </div>

                <div>
                  <Label>Daños visibles</Label>
                  <textarea value={veh.danios} onChange={(e) => setVeh({ ...veh, danios: e.target.value })} rows={2}
                    placeholder="Ej. Rayón en puerta trasera derecha, parabrisas estrellado" className={inputCls} />
                </div>
              </>
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

            <div>
              <Label>{esVehiculo ? "Comentarios sobre el automóvil" : "Comentarios del bien"}</Label>
              <textarea
                value={comentariosBien}
                onChange={(e) => setComentariosBien(e.target.value)}
                rows={3}
                placeholder={esVehiculo
                  ? "Estado general, fallas mecánicas, accesorios incluidos, observaciones…"
                  : "¿Está dañado? Golpes, rayones, piezas faltantes, si enciende o no…"}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-muted">
                Queda registrado en el expediente del bien y en su ficha.
              </p>
            </div>

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
            <Campo label="Monto autorizado del préstamo (MXN)" req type="number" value={monto} onChange={(v) => { setMonto(v); setMontoTocado(true); }} />
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
              {productos.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-medium text-muted">Producto de interés (catálogo)</p>
                  <div className="flex flex-wrap gap-2">
                    {productos.map((p) => {
                      const activo = productoSelId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setProductoSelId(p.id); setTasa(p.tasa); setPeriodo(p.periodo); setPlazo(p.plazoPeriodos); }}
                          className={`rounded-lg border px-3 py-1.5 text-left text-sm transition ${
                            activo ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-surface"
                          }`}
                        >
                          <span className="block font-medium">{p.nombre}{p.modalidad ? ` · ${p.modalidad}` : ""}</span>
                          <span className="block text-xs text-muted">{p.tasa}% {p.periodo}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {tasaEspecial && (
              <div className="rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm text-warning">
                🔒 <strong>Tasa especial ({tasa}%)</strong> — requiere autorización de Dirección General. Al finalizar, el
                empeño quedará en <strong>borrador</strong> y se enviará la solicitud al supervisor por WhatsApp; se
                activará cuando la autoricen.
              </div>
            )}

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
                  <option value="diario">Diario (1 día)</option>
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
              <Label>Fotos y documentación del artículo / vehículo</Label>
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                capture="environment"
                disabled={subiendoFotos}
                onChange={(e) => onSubirArchivos(e.target.files)}
                className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
              />
              {subiendoFotos && <p className="mt-1 text-xs text-muted">Subiendo…</p>}
              {fotos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {fotos.map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-info hover:bg-surface">
                      📎 archivo {i + 1}
                    </a>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-muted">
                Sube fotos del bien y su documentación (factura, tarjeta de circulación, INE…). Se guardan en el expediente.
              </p>
            </div>
            <MapaResguardo onChange={setUbicacion} />
            <div>
              <Label>Condiciones físicas / observaciones</Label>
              <textarea value={condiciones} onChange={(e) => setCondiciones(e.target.value)} rows={3} className={inputCls} />
            </div>
            {esVehiculo && (
              <div className="space-y-3 rounded-lg border border-warning/30 bg-warning-soft p-4">
                <p className="text-sm font-semibold text-warning">🚗 Verificación obligatoria del vehículo</p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://www2.repuve.gob.mx:8443/ciudadania/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => { if (bien.serie) navigator.clipboard?.writeText(bien.serie).catch(() => {}); }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-info px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    🔎 Abrir REPUVE {bien.serie ? "(NIV copiado)" : ""} →
                  </a>
                  {bien.serie && (
                    <span className="text-xs text-muted">NIV: <span className="font-mono">{bien.serie}</span></span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Se abre el portal oficial y el NIV se copia al portapapeles: pégalo, resuelve el captcha y guarda el resultado.
                  Sube la captura/PDF del resultado en las fotos del vehículo y anota el folio.
                </p>
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
