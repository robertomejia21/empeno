"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Eraser, PenLine } from "lucide-react";
import { guardarFirmaEmpeno } from "@/lib/actions";

export function FirmaContrato({
  empenoId,
  yaFirmado,
  publico = false,
}: {
  empenoId: string;
  yaFirmado: boolean;
  /** true en el enlace público /firmar — oculta borrar una firma ya capturada. */
  publico?: boolean;
}) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
          <CircleCheck className="h-4 w-4 shrink-0" aria-hidden /> El contrato ya fue firmado por el cliente.
        </p>
        {!publico && (
          <button
            type="button"
            onClick={() => guardarFirmaEmpeno(empenoId, "").then(() => router.refresh())}
            className="text-xs font-medium text-danger hover:underline"
          >
            Borrar firma y volver a firmar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        <PenLine className="h-4 w-4 text-muted" aria-hidden /> Firma del consumidor
      </p>
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-xl border-2 border-dashed border-border bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={limpiar} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2">
          <Eraser className="h-4 w-4" aria-hidden /> Limpiar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={vacio || guardando}
          className="inline-flex items-center gap-1.5 rounded-lg bg-success px-5 py-2 text-sm font-medium text-white shadow-soft transition hover:brightness-105 disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar firma"}
        </button>
      </div>
      <p className="text-xs text-muted">El cliente firma con el dedo o el mouse; queda como respaldo electrónico del contrato.</p>
    </div>
  );
}
