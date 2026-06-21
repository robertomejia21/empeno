import { enviarRecordatoriosPendientes } from "@/lib/actions";

/**
 * Envía recordatorios por WhatsApp a empeños vencidos o por vencer (≤3 días).
 * Protegido por CRON_SECRET. Invocar con:
 *   GET /api/cron/recordatorios?key=CRON_SECRET
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return new Response("No autorizado", { status: 401 });
  }
  const resultado = await enviarRecordatoriosPendientes();
  return Response.json({ ok: true, ...resultado, fecha: new Date().toISOString() });
}
