"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg text-primary-fg">
          ⚖️
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">Empeño Suite</p>
          <p className="text-xs text-muted">Casa de empeño</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const activo =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                activo
                  ? "bg-primary-soft font-semibold text-primary"
                  : "text-foreground hover:bg-surface-2"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-xs text-muted">Sesión demo</p>
        <p className="text-sm font-medium text-foreground">Administrador</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="no-print sticky bottom-0 z-10 flex justify-around border-t border-border bg-surface py-1.5 md:hidden">
      {navItems.map((item) => {
        const activo =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs ${
              activo ? "text-primary" : "text-muted"
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
