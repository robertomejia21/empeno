import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** ¿Está Supabase configurado? Si no, la app usa el almacén en memoria. */
export const supabaseConfigured = Boolean(url && serviceKey);

let cached: SupabaseClient | null = null;

/**
 * Cliente Supabase para uso EXCLUSIVO en el servidor (Server Components y
 * Server Actions). Usa la service role key, que omite RLS. Nunca debe
 * exponerse al navegador.
 */
export function getServerSupabase(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error("Supabase no está configurado (faltan variables de entorno).");
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

/**
 * Cliente con la llave pública, solo para validar credenciales contra
 * Supabase Auth (signInWithPassword). No guarda sesión: la sesión de la app
 * sigue siendo nuestra cookie firmada.
 */
export function getAuthSupabase(): SupabaseClient {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase Auth no está configurado (faltan variables de entorno).");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
