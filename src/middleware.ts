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
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const sesion = await verificarSesion(token);

  // Página de login: si ya hay sesión, mandar al tablero
  if (pathname === "/login") {
    if (sesion) return NextResponse.redirect(new URL("/", req.url));
    return conPathname(req);
  }

  if (!sesion) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return conPathname(req);
}

export const config = {
  // Proteger todo excepto estáticos y la API interna de Next
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
