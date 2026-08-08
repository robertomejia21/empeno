/**
 * Autoriza una invocación de cron. Acepta el header estándar de Vercel Cron
 * `Authorization: Bearer <CRON_SECRET>` o, como respaldo, `?key=<CRON_SECRET>`.
 * Falla cerrado si CRON_SECRET no está configurado.
 */
export function cronAutorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("key") === secret;
}
