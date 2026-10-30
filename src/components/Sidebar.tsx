"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { navGroups, type NavGroup } from "@/lib/nav";
import { puedeAcceder, ROL_LABEL } from "@/lib/auth";
import { cerrarSesion } from "@/lib/auth-actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MarcaIcono } from "@/components/Marca";
import type { RolUsuario } from "@/lib/types";

interface UsuarioProp {
  nombre: string;
  rol: RolUsuario;
  esSesionReal: boolean;
}

const KEY_GRUPOS = "nav-grupos-cerrados";
const KEY_RIEL = "nav-riel";

function gruposVisibles(rol: RolUsuario | undefined) {
  if (!rol) return navGroups;
  return navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => puedeAcceder(rol, i.href)) }))
    .filter((g) => g.items.length > 0);
}

/** El href más específico que coincide con la ruta (así /gps/citas no marca también /gps). */
function hrefActivo(pathname: string, grupos: NavGroup[]) {
  let mejor = "";
  for (const g of grupos) {
    for (const i of g.items) {
      const coincide = i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(i.href + "/");
      if (coincide && i.href.length > mejor.length) mejor = i.href;
    }
  }
  return mejor;
}

const EVENTO_LOCAL = "nav-local";

function suscribirLocal(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENTO_LOCAL, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENTO_LOCAL, cb);
  };
}

/** Preferencia del menú guardada en localStorage; en el servidor usa el valor por defecto. */
function usePreferencia<T>(key: string, porDefecto: T): [T, (valor: T) => void] {
  const crudo = useSyncExternalStore(
    suscribirLocal,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null
  );
  const valor = useMemo(() => {
    try {
      return crudo ? (JSON.parse(crudo) as T) : porDefecto;
    } catch {
      return porDefecto;
    }
    // porDefecto es un literal constante en cada llamada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crudo]);
  const guardar = (nuevo: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(nuevo));
    } catch {}
    window.dispatchEvent(new Event(EVENTO_LOCAL));
  };
  return [valor, guardar];
}

function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sidebar-border bg-white">
        <MarcaIcono className="h-6 w-6" />
      </span>
      {!compacta && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[15px] font-bold tracking-tight text-sidebar-fg">
            Turbo<span className="text-primary"> Presta</span>
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-muted">El Dorado</span>
        </span>
      )}
    </Link>
  );
}

function NavLista({
  grupos,
  riel = false,
  onNavegar,
}: {
  grupos: NavGroup[];
  riel?: boolean;
  onNavegar?: () => void;
}) {
  const pathname = usePathname();
  const activo = hrefActivo(pathname, grupos);
  const [cerrados, setCerrados] = usePreferencia<string[]>(KEY_GRUPOS, []);

  function alternar(titulo: string) {
    setCerrados(cerrados.includes(titulo) ? cerrados.filter((t) => t !== titulo) : [...cerrados, titulo]);
  }

  return (
    <nav className={`flex-1 overflow-y-auto py-3 ${riel ? "px-2" : "px-2.5"}`}>
      {grupos.map((grupo, gi) => {
        const abierto = riel || !cerrados.includes(grupo.titulo);
        return (
          <div key={grupo.titulo} className={gi > 0 ? (riel ? "mt-2 border-t border-sidebar-border pt-2" : "mt-1") : ""}>
            {!riel && (
              <button
                type="button"
                onClick={() => alternar(grupo.titulo)}
                aria-expanded={abierto}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted transition hover:text-sidebar-fg"
              >
                {grupo.titulo}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${abierto ? "" : "-rotate-90"}`}
                  aria-hidden
                />
              </button>
            )}
            {abierto && (
              <div className="space-y-px pb-1">
                {grupo.items.map((item) => {
                  const esActivo = item.href === activo;
                  const Icono = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavegar}
                      title={riel ? item.label : undefined}
                      aria-current={esActivo ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg text-[13px] transition ${
                        riel ? "h-9 justify-center" : "h-8 px-2.5"
                      } ${
                        esActivo
                          ? "bg-primary-soft font-semibold text-primary"
                          : "text-sidebar-muted hover:bg-sidebar-2 hover:text-sidebar-fg"
                      }`}
                    >
                      <Icono className="h-4 w-4 shrink-0" strokeWidth={esActivo ? 2.25 : 1.9} aria-hidden />
                      {!riel && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function PieUsuario({ usuario, riel = false }: { usuario: UsuarioProp | null; riel?: boolean }) {
  const inicial = (usuario?.nombre ?? "A").charAt(0);
  const avatar = (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold uppercase text-primary-fg">
      {inicial}
    </span>
  );
  const salir = usuario?.esSesionReal && (
    <form action={cerrarSesion}>
      <button
        type="submit"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted transition hover:bg-sidebar-2 hover:text-danger"
      >
        <LogOut className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );

  if (riel) {
    return (
      <div className="flex flex-col items-center gap-1.5 border-t border-sidebar-border py-3">
        <ThemeToggle className="!h-8 !w-8 !border-transparent !bg-transparent text-sidebar-muted hover:!bg-sidebar-2" />
        <span title={usuario?.nombre ?? "Administrador"}>{avatar}</span>
        {salir}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-t border-sidebar-border px-3 py-3">
      {avatar}
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-medium text-sidebar-fg">{usuario?.nombre ?? "Administrador"}</p>
        <p className="truncate text-[11px] text-sidebar-muted">{usuario ? ROL_LABEL[usuario.rol] : "Sesión demo"}</p>
      </div>
      <ThemeToggle className="!h-8 !w-8 !border-transparent !bg-transparent text-sidebar-muted hover:!bg-sidebar-2" />
      {salir}
    </div>
  );
}

export function Sidebar({ usuario }: { usuario: UsuarioProp | null }) {
  const grupos = gruposVisibles(usuario?.rol);
  const [riel, setRiel] = usePreferencia<boolean>(KEY_RIEL, false);

  function alternarRiel() {
    setRiel(!riel);
  }

  const BotonRiel = riel ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={`no-print sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex ${
        riel ? "w-[68px]" : "w-60"
      }`}
    >
      <div className={`flex h-14 items-center border-b border-sidebar-border ${riel ? "justify-center px-2" : "justify-between gap-2 px-3"}`}>
        {!riel && <Marca />}
        <button
          type="button"
          onClick={alternarRiel}
          aria-label={riel ? "Expandir menú" : "Contraer menú"}
          title={riel ? "Expandir menú" : "Contraer menú"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-muted transition hover:bg-sidebar-2 hover:text-sidebar-fg"
        >
          <BotonRiel className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <NavLista grupos={grupos} riel={riel} />
      <PieUsuario usuario={usuario} riel={riel} />
    </aside>
  );
}

export function MobileMenu({ usuario }: { usuario: UsuarioProp | null }) {
  const [abierto, setAbierto] = useState(false);
  const grupos = gruposVisibles(usuario?.rol);

  return (
    <>
      {/* Barra superior (solo móvil/tablet) */}
      <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar/90 px-4 backdrop-blur lg:hidden">
        <Marca />
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-fg transition hover:bg-sidebar-2"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {abierto && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setAbierto(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-sidebar shadow-elevated">
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
              <Marca />
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted transition hover:bg-sidebar-2 hover:text-sidebar-fg"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <NavLista grupos={grupos} onNavegar={() => setAbierto(false)} />
            <PieUsuario usuario={usuario} />
          </aside>
        </div>
      )}
    </>
  );
}
