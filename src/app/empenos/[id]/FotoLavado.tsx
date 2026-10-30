"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, CircleCheck, Loader2 } from "lucide-react";
import { subirYEnviarFotoLavado } from "@/lib/actions";
import { normalizarImagen } from "@/lib/imagen";

export function FotoLavado({ empenoId }: { empenoId: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"idle" | "subiendo" | "ok" | "error">("idle");

  async function onFile(f: File | undefined) {
    if (!f) return;
    setEstado("subiendo");
    try {
      const r = await subirYEnviarFotoLavado(empenoId, await normalizarImagen(f, 1600));
      setEstado(r?.ok ? "ok" : "error");
      router.refresh();
    } catch {
      setEstado("error");
    }
  }

  return (
    <div>
      <label className="inline-flex max-w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg shadow-soft transition hover:brightness-105">
        {estado === "subiendo" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Enviando…
          </>
        ) : (
          <>
            <Camera className="h-4 w-4 shrink-0" aria-hidden /> Foto del auto lavado
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden /> enviar al cliente
          </>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={estado === "subiendo"}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      {estado === "ok" && <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-success">
          <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Foto enviada al cliente por WhatsApp.
        </p>}
      {estado === "error" && <p className="mt-1 text-xs text-danger">No se pudo enviar (revisa WhatsApp y el teléfono del cliente).</p>}
      <p className="mt-2 text-xs text-muted">Cada sábado, sube la foto del vehículo lavado para enviarla al cliente.</p>
    </div>
  );
}
