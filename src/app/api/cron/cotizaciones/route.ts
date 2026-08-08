import { caducarCotizaciones } from "@/lib/actions";
import { cronAutorizado } from "@/lib/cron";

/**
 * Cotizaciones sin acción en 24 h → "no proceden" (vencida).
 * Protegido por CRON_SECRET. Invocar con:
 *   GET /api/cron/cotizaciones?key=CRON_SECRET
 */
export async function GET(req: Request) {
  if (!cronAutorizado(req)) return new Response("No autorizado", { status: 401 });
  const resultado = await caducarCotizaciones();
  return Response.json({ ok: true, ...resultado, fecha: new Date().toISOString() });
}
