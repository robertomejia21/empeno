import "server-only";
import { cookies } from "next/headers";
import type { RolUsuario } from "./types";
import { SESSION_COOKIE, verificarSesion, authHabilitada } from "./auth";

export interface UsuarioActual {
  uid: string;
  nombre: string;
  rol: RolUsuario;
  esSesionReal: boolean; // false cuando auth está deshabilitada (modo abierto)
}

/**
 * Devuelve el usuario actual. Si la autenticación está deshabilitada
 * (sin AUTH_SECRET), regresa un admin sintético (modo abierto/demo).
 */
export async function getUsuarioActual(): Promise<UsuarioActual | null> {
  if (!authHabilitada()) {
    return { uid: "demo", nombre: "Administrador (demo)", rol: "admin", esSesionReal: false };
  }
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const sesion = await verificarSesion(token);
  if (!sesion) return null;
  return { uid: sesion.uid, nombre: sesion.nombre, rol: sesion.rol, esSesionReal: true };
}
