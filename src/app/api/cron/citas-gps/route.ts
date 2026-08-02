import { enviarRecordatoriosCitasGps } from "@/lib/actions";

/**
 * Recordatorios por WhatsApp de las citas de GPS del día siguiente.
 * Protegido por CRON_SECRET. Invocar con:
 *   GET /api/cron/citas-gps?key=CRON_SECRET
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return new Response("No autorizado", { status: 401 });
  }
  const resultado = await enviarRecordatoriosCitasGps();
  return Response.json({ ok: true, ...resultado, fecha: new Date().toISOString() });
}
