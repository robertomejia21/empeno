"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RolUsuario } from "./types";
import { SESSION_COOKIE, firmarSesion } from "./auth";
import { hashPassword, verifyPassword } from "./password";
import { getUsuarioActual } from "./session";
import { supabaseConfigured, getServerSupabase, getAuthSupabase } from "./supabase/server";
import { registrarBitacora } from "./bitacora";

export async function iniciarSesion(form: FormData) {
  const email = ((form.get("email") as string) ?? "").trim().toLowerCase();
  const password = (form.get("password") as string) ?? "";
  const next = ((form.get("next") as string) ?? "/").trim() || "/";

  if (!supabaseConfigured) redirect("/login?error=config");

  const { data: fila } = await getServerSupabase()
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  // Un usuario dado de baja en la tabla no entra, aunque exista en Supabase Auth.
  if (fila && !fila.activo) redirect("/login?error=1");

  // 1) Supabase Auth. El rol sale de la tabla `usuarios` o, si no está ahí,
  //    de app_metadata.rol (solo editable con la service role, no por el usuario).
  const { data: auth } = await getAuthSupabase().auth.signInWithPassword({ email, password });
  let data: { id: string; nombre: string; rol: RolUsuario } | null = null;
  if (auth.user) {
    const rolMeta = auth.user.app_metadata?.rol as RolUsuario | undefined;
    const rol = (fila?.rol as RolUsuario | undefined) ?? rolMeta;
    if (!rol) redirect("/login?error=sinrol");
    data = {
      id: fila?.id ?? auth.user.id,
      nombre: fila?.nombre ?? (auth.user.user_metadata?.nombre as string | undefined) ?? email,
      rol,
    };
  } else if (fila?.password_hash && verifyPassword(password, fila.password_hash)) {
    // 2) Respaldo: usuarios antiguos con contraseña en la tabla `usuarios`.
    data = { id: fila.id, nombre: fila.nombre, rol: fila.rol as RolUsuario };
  }

  if (!data) redirect("/login?error=1");

  const token = await firmarSesion({ uid: data.id, nombre: data.nombre, rol: data.rol });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  await registrarBitacora("Inicio de sesión", data.nombre, data.rol, `Usuario ${email}`);
  redirect(next.startsWith("/") ? next : "/");
}

export async function entrarComoInvitado() {
  const token = await firmarSesion({ uid: "invitado", nombre: "Oficina Virtual", rol: "invitado" });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
  redirect("/oficina");
}

export async function cerrarSesion() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function crearUsuario(form: FormData) {
  const actual = await getUsuarioActual();
  if (!actual || actual.rol !== "admin") throw new Error("No autorizado");
  if (!supabaseConfigured) throw new Error("Supabase no configurado");

  const nombre = ((form.get("nombre") as string) ?? "").trim();
  const email = ((form.get("email") as string) ?? "").trim().toLowerCase();
  const rol = ((form.get("rol") as string) ?? "cajero") as RolUsuario;
  const password = (form.get("password") as string) ?? "";

  const { error } = await getServerSupabase().from("usuarios").insert({
    nombre,
    email,
    rol,
    password_hash: hashPassword(password),
  });
  if (error) throw error;
  await registrarBitacora("Alta de usuario", actual.nombre, actual.rol, `${nombre} (${rol})`);
  redirect("/usuarios");
}

/** Edita nombre, correo y rol de un usuario existente. La contraseña solo se actualiza si se captura una nueva. */
export async function editarUsuario(id: string, form: FormData) {
  const actual = await getUsuarioActual();
  if (!actual || actual.rol !== "admin") throw new Error("No autorizado");
  if (!supabaseConfigured) throw new Error("Supabase no configurado");

  const nombre = ((form.get("nombre") as string) ?? "").trim();
  const email = ((form.get("email") as string) ?? "").trim().toLowerCase();
  const rol = ((form.get("rol") as string) ?? "cajero") as RolUsuario;
  const password = (form.get("password") as string) ?? "";

  const datos: { nombre: string; email: string; rol: RolUsuario; password_hash?: string } = { nombre, email, rol };
  if (password) datos.password_hash = hashPassword(password);

  const { error } = await getServerSupabase().from("usuarios").update(datos).eq("id", id);
  if (error) throw error;
  await registrarBitacora("Edición de usuario", actual.nombre, actual.rol, `${nombre} (${rol})`);
  redirect("/usuarios");
}

export async function cambiarEstadoUsuario(id: string, activo: boolean) {
  const actual = await getUsuarioActual();
  if (!actual || actual.rol !== "admin") throw new Error("No autorizado");
  if (supabaseConfigured) {
    await getServerSupabase().from("usuarios").update({ activo }).eq("id", id);
  }
  redirect("/usuarios");
}
