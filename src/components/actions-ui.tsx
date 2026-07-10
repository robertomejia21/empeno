"use client";

import { useFormStatus } from "react-dom";

export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
    >
      {children}
    </button>
  );
}

/** Botón de envío con confirmación y estado de carga, para Server Actions. */
export function ConfirmSubmit({
  children,
  confirmacion,
  variante = "primary",
  className = "",
}: {
  children: React.ReactNode;
  confirmacion: string;
  variante?: "primary" | "danger" | "secondary";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const clases =
    variante === "danger"
      ? "bg-danger text-white hover:opacity-90"
      : variante === "secondary"
        ? "border border-border bg-surface text-foreground hover:bg-surface-2"
        : "bg-primary text-primary-fg hover:opacity-90";
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(confirmacion)) e.preventDefault();
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${clases} ${className}`}
    >
      {pending ? "Procesando…" : children}
    </button>
  );
}
