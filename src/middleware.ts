import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verificarSesion, authHabilitada } from "@/lib/auth";

function conPathname(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(req: NextRequest) {
  // Red de seguridad: sin AUTH_SECRET, la app queda abierta (modo demo).
  if (!authHabilitada()) return conPathname(req);

  const { pathname } = req.nextUrl;

  // El cron se autentica por secreto propio, no por sesión.
  if (pathname.startsWith("/api/cron")) return conPathname(req);

  // Landing pública
  if (pathname === "/inicio") return conPathname(req);

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const sesion = await verificarSesion(token);

  // Invitado (sin contraseña): solo puede ver la Oficina Virtual.
  if (sesion?.rol === "invitado") {
    if (pathname.startsWith("/oficina")) return conPathname(req);
    return NextResponse.redirect(new URL("/oficina", req.url));
  }

  // Página de login: si ya hay sesión, mandar al tablero
  if (pathname === "/login") {
    if (sesion) return NextResponse.redirect(new URL("/", req.url));
    return conPathname(req);
  }

  if (!sesion) {
    // Visitantes a la raíz ven la landing; el resto, el login.
    const url = new URL(pathname === "/" ? "/inicio" : "/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return conPathname(req);
}

export const config = {
  // Proteger todo excepto estáticos y la API interna de Next
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
