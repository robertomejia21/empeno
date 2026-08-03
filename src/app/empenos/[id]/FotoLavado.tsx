"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90">
        {estado === "subiendo" ? "Enviando…" : "📸 Foto del auto lavado → enviar al cliente"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={estado === "subiendo"}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      {estado === "ok" && <p className="mt-1 text-xs text-success">✓ Foto enviada al cliente por WhatsApp.</p>}
      {estado === "error" && <p className="mt-1 text-xs text-danger">No se pudo enviar (revisa WhatsApp y el teléfono del cliente).</p>}
      <p className="mt-2 text-xs text-muted">Cada sábado, sube la foto del vehículo lavado para enviarla al cliente.</p>
    </div>
  );
}
