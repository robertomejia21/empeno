"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function Escaner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [estado, setEstado] = useState<"idle" | "scanning" | "unsupported" | "error">("idle");
  const [manual, setManual] = useState("");

  useEffect(() => {
    let detenido = false;
    let stream: MediaStream | null = null;
    const win = window as any;

    if (typeof win.BarcodeDetector === "undefined") {
      setEstado("unsupported");
      return;
    }
    const detector = new win.BarcodeDetector({ formats: ["qr_code"] });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (detenido) return;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setEstado("scanning");
        const tick = async () => {
          if (detenido) return;
          try {
            const codes = await detector.detect(v);
            if (codes.length && codes[0].rawValue) {
              manejar(codes[0].rawValue);
              return;
            }
          } catch {
            /* frame sin código */
          }
          requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setEstado("error");
      }
    })();

    return () => {
      detenido = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function manejar(valor: string) {
    try {
      const u = new URL(valor);
      if (u.origin === window.location.origin) {
        router.push(u.pathname);
        return;
      }
    } catch {
      /* no es URL */
    }
    router.push(`/buscar?q=${encodeURIComponent(valor)}`);
  }

  function buscarManual() {
    const q = manual.trim();
    if (q) router.push(`/buscar?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="space-y-4">
      {estado !== "unsupported" && estado !== "error" && (
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-black">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/70" />
          {estado === "idle" && (
            <p className="absolute inset-x-0 bottom-3 text-center text-xs text-white/80">Solicitando cámara…</p>
          )}
        </div>
      )}

      {estado === "scanning" && (
        <p className="text-center text-sm text-muted">Apunta la cámara al código QR de la prenda.</p>
      )}
      {(estado === "unsupported" || estado === "error") && (
        <p className="rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          {estado === "unsupported"
            ? "Este navegador no permite escanear con la cámara. Escanea el QR con la cámara del teléfono (abre la ficha directo) o busca el folio abajo."
            : "No se pudo acceder a la cámara. Revisa los permisos o busca el folio abajo."}
        </p>
      )}

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-2 text-sm font-medium text-foreground">Buscar por folio</p>
        <div className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscarManual()}
            placeholder="Ej. PR-0001"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button type="button" onClick={buscarManual} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90">
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}
