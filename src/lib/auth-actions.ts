"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RolUsuario } from "./types";
import { SESSION_COOKIE, firmarSesion } from "./auth";
import { hashPassword, verifyPassword } from "./password";
import { getUsuarioActual } from "./session";
import { supabaseConfigured, getServerSupabase } from "./supabase/server";
import { registrarBitacora } from "./bitacora";

export async function iniciarSesion(form: FormData) {
  const email = ((form.get("email") as string) ?? "").trim().toLowerCase();
  const password = (form.get("password") as string) ?? "";
  const next = ((form.get("next") as string) ?? "/").trim() || "/";

  if (!supabaseConfigured) redirect("/login?error=config");

  const { data } = await getServerSupabase()
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .eq("activo", true)
    .maybeSingle();

  if (!data || !verifyPassword(password, data.password_hash)) {
    redirect("/login?error=1");
  }

  const token = await firmarSesion({ uid: data.id, nombre: data.nombre, rol: data.rol as RolUsuario });
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
