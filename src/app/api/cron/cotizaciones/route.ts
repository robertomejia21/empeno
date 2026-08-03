import { caducarCotizaciones } from "@/lib/actions";

/**
 * Cotizaciones sin acción en 24 h → "no proceden" (vencida).
 * Protegido por CRON_SECRET. Invocar con:
 *   GET /api/cron/cotizaciones?key=CRON_SECRET
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return new Response("No autorizado", { status: 401 });
  }
  const resultado = await caducarCotizaciones();
  return Response.json({ ok: true, ...resultado, fecha: new Date().toISOString() });
}
