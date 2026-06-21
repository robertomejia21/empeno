"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMontado(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("tema", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      title={dark ? "Modo claro" : "Modo oscuro"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-base transition hover:bg-surface-2 ${className}`}
    >
      {montado ? (dark ? "☀️" : "🌙") : "🌙"}
    </button>
  );
}
