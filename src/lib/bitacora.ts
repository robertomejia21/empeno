import "server-only";
import { getStore, nuevoId } from "./db/store";
import { supabaseConfigured, getServerSupabase } from "./supabase/server";
import { getUsuarioActual } from "./session";

/** Registra una entrada en la bitácora de auditoría. */
export async function registrarBitacora(
  accion: string,
  usuarioNombre = "sistema",
  usuarioRol: string | null = null,
  detalle: string | null = null,
  referencia: string | null = null
) {
  try {
    if (supabaseConfigured) {
      await getServerSupabase().from("bitacora").insert({
        usuario_nombre: usuarioNombre,
        usuario_rol: usuarioRol,
        accion,
        detalle,
        referencia,
      });
    } else {
      getStore().bitacora.unshift({
        id: nuevoId("b"),
        fecha: new Date().toISOString(),
        usuarioNombre,
        usuarioRol,
        accion,
        detalle,
        referencia,
      });
    }
  } catch {
    // La auditoría nunca debe romper la operación principal.
  }
}

/** Registra una acción resolviendo automáticamente el usuario en sesión. */
export async function bitacoraAuto(accion: string, detalle: string | null = null, referencia: string | null = null) {
  const u = await getUsuarioActual();
  await registrarBitacora(accion, u?.nombre ?? "sistema", u?.rol ?? null, detalle, referencia);
}
