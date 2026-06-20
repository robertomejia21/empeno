"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups, navItems } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-fg md:flex">
      {/* Marca */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <span className="bg-gold-gradient flex h-10 w-10 items-center justify-center rounded-xl text-lg shadow-soft">
          ⚖️
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-white">
            Empeño<span className="text-gold-gradient"> Suite</span>
          </p>
          <p className="text-[11px] uppercase tracking-widest text-sidebar-muted">
            Gestión premium
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {navGroups.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
              {grupo.titulo}
            </p>
            <div className="space-y-0.5">
              {grupo.items.map((item) => {
                const activo =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      activo
                        ? "bg-sidebar-2 font-semibold text-white"
                        : "text-sidebar-muted hover:bg-sidebar-2/60 hover:text-sidebar-fg"
                    }`}
                  >
                    {activo && (
                      <span className="bg-gold-gradient absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full" />
                    )}
                    <span className={`text-base transition ${activo ? "" : "opacity-80 group-hover:opacity-100"}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Usuario */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-2 px-3 py-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-sm font-bold text-sidebar">
            A
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-white">Administrador</p>
            <p className="truncate text-[11px] text-sidebar-muted">Sesión demo</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

const mobilePrincipales = ["/", "/empenos", "/prendas", "/clientes", "/caja"];

export function MobileNav() {
  const pathname = usePathname();
  const items = navItems.filter((i) => mobilePrincipales.includes(i.href));
  return (
    <nav className="no-print sticky bottom-0 z-10 flex justify-around border-t border-sidebar-border bg-sidebar py-1.5 md:hidden">
      {items.map((item) => {
        const activo =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] transition ${
              activo ? "text-gold" : "text-sidebar-muted"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
