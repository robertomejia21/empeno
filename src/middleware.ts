import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verificarSesion, authHabilitada, puedeAcceder } from "@/lib/auth";

function conPathname(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sin AUTH_SECRET la app queda en modo demo abierto SÓLO en desarrollo.
  // En producción es fail-closed: solo las rutas públicas responden.
  if (!authHabilitada()) {
    if (process.env.NODE_ENV === "production") {
      const publica =
        pathname === "/inicio" || pathname === "/login" || pathname === "/tienda" || pathname.startsWith("/tienda/");
      if (!publica) return NextResponse.redirect(new URL("/inicio", req.url));
    }
    return conPathname(req);
  }

  // El cron se autentica por secreto propio, no por sesión.
  if (pathname.startsWith("/api/cron")) return conPathname(req);

  // Rutas públicas
  if (pathname === "/inicio" || pathname === "/tienda" || pathname.startsWith("/tienda/") || pathname === "/agendar-gps" || pathname === "/cotiza-vehiculo" || pathname === "/avances" || pathname === "/encuesta" || pathname.startsWith("/firmar/")) return conPathname(req);

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const sesion = await verificarSesion(token);

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

  // El mecánico sólo tiene acceso a los avalúos de vehículos.
  if (sesion.rol === "mecanico" && !pathname.startsWith("/avaluos")) {
    return NextResponse.redirect(new URL("/avaluos", req.url));
  }

  // Control de acceso por rol para páginas (las /api gestionan su propio acceso).
  if (!pathname.startsWith("/api") && !puedeAcceder(sesion.rol, pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return conPathname(req);
}

export const config = {
  // Proteger todo excepto estáticos y la API interna de Next
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
