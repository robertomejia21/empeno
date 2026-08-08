import { enviarFotosVehiculosSemanal } from "@/lib/actions";
import { cronAutorizado } from "@/lib/cron";

/**
 * Envía la foto de cada vehículo en resguardo a su propietario (semanal, sábado).
 * Protegido por CRON_SECRET: GET /api/cron/foto-vehiculos?key=CRON_SECRET
 */
export async function GET(req: Request) {
  if (!cronAutorizado(req)) return new Response("No autorizado", { status: 401 });
  const resultado = await enviarFotosVehiculosSemanal();
  return Response.json({ ok: true, ...resultado, fecha: new Date().toISOString() });
}
