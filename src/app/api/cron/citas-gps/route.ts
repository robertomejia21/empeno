import { enviarRecordatoriosCitasGps } from "@/lib/actions";
import { cronAutorizado } from "@/lib/cron";

/**
 * Recordatorios por WhatsApp de las citas de GPS del día siguiente.
 * Protegido por CRON_SECRET. Invocar con:
 *   GET /api/cron/citas-gps?key=CRON_SECRET
 */
export async function GET(req: Request) {
  if (!cronAutorizado(req)) return new Response("No autorizado", { status: 401 });
  const resultado = await enviarRecordatoriosCitasGps();
  return Response.json({ ok: true, ...resultado, fecha: new Date().toISOString() });
}
