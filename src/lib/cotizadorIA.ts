import "server-only";
// Asistente de cotización: responde "¿cuánto le presto por…?" con base en el
// historial real de la sucursal (empeños y cotizaciones) y la regla de préstamo
// de /configuracion. Siempre es un ESTIMADO hasta revisar el bien en persona.
import { listarEmpenos, listarCotizaciones, obtenerAjustes } from "@/lib/db/repo";
import { VALOR_VEHICULO_REFERENCIA } from "@/lib/valorVehiculoReferencia";
import { normalizarBusqueda } from "@/lib/buscar";
import { geminiHabilitado, preguntarTexto } from "@/lib/gemini";

interface Referencia {
  origen: "empeño" | "cotización";
  categoria: string;
  bien: string;
  anio: string;
  avaluo: number | null;
  prestamo: number | null;
  fecha: string;
  seEmpeno?: string;
}

async function referencias(): Promise<Referencia[]> {
  const [empenos, cotizaciones] = await Promise.all([listarEmpenos(), listarCotizaciones()]);
  const refs: Referencia[] = [];
  for (const e of empenos) {
    if (e.estado === "borrador" || e.estado === "cancelado") continue;
    const p = e.prenda;
    refs.push({
      origen: "empeño",
      categoria: p.categoria,
      bien: [p.descripcion, p.marca, p.submarca].filter(Boolean).join(" "),
      anio: p.modelo ?? "",
      avaluo: p.valorAvaluo || null,
      prestamo: e.montoPrestado,
      fecha: e.creadoEn.slice(0, 10),
    });
  }
  for (const c of cotizaciones) {
    refs.push({
      origen: "cotización",
      categoria: c.tipo === "vehiculo" ? "Vehículos" : "Artículo",
      bien: [c.descripcion, c.marca, c.submarca].filter(Boolean).join(" "),
      anio: c.modelo ?? "",
      avaluo: c.valorMercado || null,
      prestamo: c.prestamoOfrecido || null,
      fecha: c.creadoEn.slice(0, 10),
      seEmpeno: c.seEmpeno === null ? "pendiente" : c.seEmpeno ? "sí" : "no",
    });
  }
  return refs.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 400);
}

/** Respaldo sin IA: busca referencias con palabras y año parecidos. */
function similares(pregunta: string, refs: Referencia[]): Referencia[] {
  const palabras = normalizarBusqueda(pregunta)
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w));
  const anio = pregunta.match(/\b(19|20)\d{2}\b/)?.[0];
  return refs
    .map((r) => {
      const texto = normalizarBusqueda(`${r.bien} ${r.categoria}`);
      let puntos = palabras.filter((w) => texto.includes(w)).length;
      if (anio && r.anio.includes(anio)) puntos += 2;
      return { r, puntos };
    })
    .filter((x) => x.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 8)
    .map((x) => x.r);
}

const mxn = (n: number | null) =>
  n == null ? "—" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export async function responderCotizacion(pregunta: string): Promise<string> {
  const [refs, ajustes] = await Promise.all([referencias(), obtenerAjustes()]);
  const { prestamo } = ajustes;
  const regla = `Préstamo sugerido: ${prestamo.pctHastaUmbral}% del avalúo hasta ${mxn(prestamo.umbral)} y ${prestamo.pctArribaUmbral}% arriba de ese avalúo.`;

  const respaldo = () => {
    const sim = similares(pregunta, refs);
    if (sim.length === 0) return `No encontré empeños ni cotizaciones parecidas en el historial. ${regla}`;
    const prestamos = sim.map((r) => r.prestamo).filter((n): n is number => n != null);
    const rango = prestamos.length
      ? `Rango prestado en casos parecidos: ${mxn(Math.min(...prestamos))} a ${mxn(Math.max(...prestamos))}.`
      : "";
    return [
      rango,
      "Casos parecidos:",
      ...sim.map((r) => `• ${r.bien} ${r.anio} (${r.origen}, ${r.fecha}): avalúo ${mxn(r.avaluo)}, préstamo ${mxn(r.prestamo)}`),
      regla,
      "Es un estimado: el monto final depende de revisar el bien en persona.",
    ]
      .filter(Boolean)
      .join("\n");
  };
  if (!geminiHabilitado()) return respaldo();

  const tabla = refs
    .map((r) => `${r.origen}|${r.categoria}|${r.bien}|${r.anio}|${r.avaluo ?? ""}|${r.prestamo ?? ""}|${r.fecha}|${r.seEmpeno ?? ""}`)
    .join("\n");
  const guiaVehiculos = VALOR_VEHICULO_REFERENCIA.map(
    (g) => `${g.anioDesde}-${g.anioHasta}: valor ${g.valorDesde}-${g.valorHasta}, préstamo ${g.prestamoDesde}-${g.prestamoHasta}`
  ).join("\n");

  const prompt = `Eres el asistente de cotización de una casa de empeño en Mexicali (Turbo Presta El Dorado).
Responde en español, breve (máximo 8 líneas), para el personal de mostrador. Texto plano, sin tablas ni markdown.
Da un RANGO estimado de préstamo (y de avalúo si aplica) basado SOLO en el historial y las reglas de abajo.
No inventes precios fuera de lo que respalda el historial; si no hay casos parecidos dilo y sugiere avaluar en persona.
Cita 2 a 4 casos parecidos (bien, año, préstamo). Termina recordando que es un estimado hasta revisar el bien (daños, estado).
Reglas: ${regla} Vehículos: 2008-2014 se quedan en resguardo; 2015 en adelante con GPS.
Tasas: vehículos 10.8% mensual (8.64% con más de 3 empeños; 6.48% solo con autorización de Dirección); artículos 21.6% mensual.

Guía de referencia de vehículos por año (MXN):
${guiaVehiculos}

Historial (origen|categoría|bien|año|avalúo|préstamo|fecha|¿se empeñó?):
${tabla || "(sin historial todavía)"}

Pregunta del personal: ${pregunta}`;

  const r = await preguntarTexto(prompt);
  if (r.ok) return r.texto;
  console.warn("[cotizadorIA] IA no disponible, se usa la búsqueda en historial:", r.error);
  return `${respaldo()}\n\n(La IA no está disponible: ${r.error})`;
}
