"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Button, Field, SelectField } from "@/components/ui";
import { ROLES } from "@/lib/auth";
import type { Usuario } from "@/lib/types";

/** Botón "Editar" que abre el formulario del usuario en un modal (<dialog> nativo, fuera del scroll de la tabla). */
export function EditarUsuario({
  usuario,
  action,
}: {
  usuario: Pick<Usuario, "nombre" | "email" | "rol">;
  action: (form: FormData) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium transition hover:bg-surface-2"
      >
        Editar
      </button>

      <dialog
        ref={ref}
        // Clic en el fondo (fuera de la tarjeta) cierra el modal.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-surface p-0 text-left text-foreground shadow-elevated backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight">Editar usuario</h2>
            <p className="truncate text-sm text-muted">{usuario.email}</p>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <form action={action} className="space-y-4 p-5">
          <Field label="Nombre" name="nombre" defaultValue={usuario.nombre} required />
          <Field label="Correo" name="email" type="email" defaultValue={usuario.email} required />
          <SelectField label="Rol" name="rol" options={ROLES} defaultValue={usuario.rol} required />
          <Field label="Nueva contraseña" name="password" type="password" placeholder="Dejar en blanco para no cambiar" />
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variante="secondary" onClick={() => ref.current?.close()}>
              Cancelar
            </Button>
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
