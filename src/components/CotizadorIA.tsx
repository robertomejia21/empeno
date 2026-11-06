"use client";

// Burbuja flotante del asistente de cotización: el personal pregunta
// "¿cuánto por una bicicleta tal modelo?" y la IA responde con un rango
// basado en el historial de la sucursal. Visible en todas las pantallas internas.
import { useEffect, useRef, useState, useTransition } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { preguntarCotizador } from "@/lib/actions";

interface Mensaje {
  de: "yo" | "ia";
  texto: string;
}

const EJEMPLOS = ["¿Cuánto le presto a un Nissan Sentra 2015?", "Carro 2004, ocupa 25 mil", "iPhone 13 128 GB usado"];

export function CotizadorIA() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [pendiente, iniciar] = useTransition();
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, pendiente]);

  function enviar(pregunta: string) {
    const q = pregunta.trim();
    if (!q || pendiente) return;
    setMensajes((m) => [...m, { de: "yo", texto: q }]);
    setTexto("");
    iniciar(async () => {
      const r = await preguntarCotizador(q);
      setMensajes((m) => [...m, { de: "ia", texto: r.respuesta }]);
    });
  }

  return (
    <div className="no-print fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 z-40 sm:right-6">
      {abierto && (
        <div className="mb-3 flex h-[min(32rem,75vh)] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-primary-fg">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Asistente de cotización</p>
              <p className="text-xs opacity-85">Estimados con el historial de la sucursal</p>
            </div>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="rounded-lg p-1 hover:bg-white/15">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {mensajes.length === 0 && (
              <div className="space-y-2 text-muted">
                <p>Pregunta cuánto se puede prestar por un bien. Ejemplos:</p>
                {EJEMPLOS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => enviar(e)}
                    className="block w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-left text-xs text-foreground hover:bg-surface-2"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={m.de === "yo" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${
                    m.de === "yo" ? "bg-primary text-primary-fg" : "bg-surface-2 text-foreground"
                  }`}
                >
                  {m.texto}
                </p>
              </div>
            ))}
            {pendiente && (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Buscando en el historial…
              </p>
            )}
            <div ref={fin} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej. bicicleta Trek 2020"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-surface"
            />
            <button
              type="submit"
              disabled={pendiente || !texto.trim()}
              aria-label="Enviar"
              className="rounded-lg bg-primary px-3 text-primary-fg disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Asistente de cotización"
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-elevated transition hover:brightness-105"
      >
        {abierto ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
      </button>
    </div>
  );
}
