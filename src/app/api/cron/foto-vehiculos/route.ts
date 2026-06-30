import { enviarFotosVehiculosSemanal } from "@/lib/actions";

/**
 * Envía la foto de cada vehículo en resguardo a su propietario (semanal, miércoles).
 * Protegido por CRON_SECRET: GET /api/cron/foto-vehiculos?key=CRON_SECRET
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return new Response("No autorizado", { status: 401 });
  }
  const resultado = await enviarFotosVehiculosSemanal();
  return Response.json({ ok: true, ...resultado, fecha: new Date().toISOString() });
}
