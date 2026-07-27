"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarFirmaEmpeno } from "@/lib/actions";

export function FirmaContrato({ empenoId, yaFirmado }: { empenoId: string; yaFirmado: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const dibujando = useRef(false);
  const [vacio, setVacio] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111111";
    }
  }, []);

  function coord(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function start(e: React.PointerEvent) {
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = coord(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    dibujando.current = true;
    setVacio(false);
  }
  function move(e: React.PointerEvent) {
    if (!dibujando.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = coord(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function end() {
    dibujando.current = false;
  }
  function limpiar() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setVacio(true);
  }
  async function guardar() {
    if (vacio) return;
    setGuardando(true);
    try {
      const dataUrl = canvasRef.current!.toDataURL("image/png");
      await guardarFirmaEmpeno(empenoId, dataUrl);
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  if (yaFirmado) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-success">✓ El contrato ya fue firmado por el cliente.</p>
        <button
          type="button"
          onClick={() => guardarFirmaEmpeno(empenoId, "").then(() => router.refresh())}
          className="text-xs font-medium text-danger hover:underline"
        >
          Borrar firma y volver a firmar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Firma del consumidor</p>
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-lg border-2 border-dashed border-border bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="flex gap-2">
        <button type="button" onClick={limpiar} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2">
          Limpiar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={vacio || guardando}
          className="rounded-lg bg-success px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar firma"}
        </button>
      </div>
      <p className="text-xs text-muted">El cliente firma con el dedo o el mouse; queda como respaldo electrónico del contrato.</p>
    </div>
  );
}
