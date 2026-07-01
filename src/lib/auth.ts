// Núcleo de autenticación edge-safe (sin node:crypto, sin next/headers).
// Firma/verifica la cookie de sesión con HMAC-SHA256 (Web Crypto).
import type { RolUsuario } from "./types";

export const SESSION_COOKIE = "empeno_session";
const DURACION_MS = 1000 * 60 * 60 * 12; // 12 horas

/** La autenticación solo se activa si existe AUTH_SECRET (red de seguridad). */
export function authHabilitada(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

export interface SesionPayload {
  uid: string;
  nombre: string;
  rol: RolUsuario;
  exp: number; // epoch ms
}

const enc = new TextEncoder();

function b64urlFromBytes(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function bytesFromB64url(str: string): Uint8Array {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "=".repeat((4 - (s.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET ?? "dev-secret";
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function firmarSesion(datos: Omit<SesionPayload, "exp">): Promise<string> {
  const payload: SesionPayload = { ...datos, exp: Date.now() + DURACION_MS };
  const body = b64urlFromBytes(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(body) as BufferSource);
  return `${body}.${b64urlFromBytes(new Uint8Array(sig))}`;
}

export async function verificarSesion(token: string | undefined): Promise<SesionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      bytesFromB64url(sig) as BufferSource,
      enc.encode(body) as BufferSource
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(bytesFromB64url(body))) as SesionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---- Roles y permisos ----

export const ROLES: { value: RolUsuario; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "cajero", label: "Cajero" },
  { value: "valuador", label: "Valuador" },
];

export const ROL_LABEL: Record<RolUsuario, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  cajero: "Cajero",
  valuador: "Valuador",
  invitado: "Invitado",
};

/** Rutas permitidas por rol. admin/gerente ven todo. */
const PERMISOS: Record<RolUsuario, string[] | "*"> = {
  admin: "*",
  gerente: "*",
  cajero: ["/", "/empenos", "/prendas", "/clientes", "/recordatorios", "/conversaciones", "/buscar", "/remates", "/ventas", "/compras", "/apartados", "/caja", "/corte", "/vencimientos", "/cobranza"],
  valuador: ["/", "/empenos", "/prendas", "/clientes", "/recordatorios", "/buscar", "/avaluo"],
  // Invitado (demo): ve TODO en solo lectura (las escrituras se bloquean aparte).
  invitado: "*",
};

export function puedeAcceder(rol: RolUsuario, href: string): boolean {
  // La Oficina Virtual es exclusiva del invitado (su tablero de inicio).
  if (href.startsWith("/oficina")) return rol === "invitado";
  // La gestión de usuarios es exclusiva de admin.
  if (href.startsWith("/usuarios")) return rol === "admin";
  const p = PERMISOS[rol];
  if (p === "*") return true;
  if (href === "/") return p.includes("/");
  return p.some((ruta) => ruta !== "/" && href.startsWith(ruta));
}

/** Solo admin gestiona usuarios y configuración del sistema. */
export function esAdmin(rol: RolUsuario): boolean {
  return rol === "admin";
}
