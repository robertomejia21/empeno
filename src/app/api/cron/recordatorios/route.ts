import { enviarRecordatoriosPendientes } from "@/lib/actions";
import { cronAutorizado } from "@/lib/cron";

/**
 * Envía recordatorios por WhatsApp a empeños vencidos o por vencer (≤3 días).
 * Protegido por CRON_SECRET. Invocar con:
 *   GET /api/cron/recordatorios?key=CRON_SECRET
 */
export async function GET(req: Request) {
  if (!cronAutorizado(req)) return new Response("No autorizado", { status: 401 });
  const resultado = await enviarRecordatoriosPendientes();
  return Response.json({ ok: true, ...resultado, fecha: new Date().toISOString() });
}
