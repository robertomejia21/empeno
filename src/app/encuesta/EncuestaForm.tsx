"use client";

import { useState } from "react";
import { guardarEncuesta } from "@/lib/actions";
import type { EncuestaInput } from "@/lib/types";

type BoolKey =
  | "amable" | "tiempoAdecuado" | "resolvioDudas" | "ofrecioAlternativas"
  | "profesionalismoSatisfecho" | "comunicacionFacil" | "horarioSatisfecho";

const SI_NO: { key: BoolKey; q: string }[] = [
  { key: "amable", q: "¿Nuestro personal le atendió de manera amable y respetuosa?" },
  { key: "tiempoAdecuado", q: "¿Considera que el tiempo de atención fue adecuado?" },
  { key: "resolvioDudas", q: "¿El personal resolvió sus dudas o necesidades de manera clara y completa?" },
  { key: "ofrecioAlternativas", q: "¿El personal le ofreció soluciones o alternativas cuando fue necesario?" },
];

const ESCALA: { key: BoolKey; q: string; si: string; no: string }[] = [
  { key: "profesionalismoSatisfecho", q: "¿Qué tan satisfecho quedó con el conocimiento y profesionalismo del personal?", si: "Satisfecho", no: "Insatisfecho" },
  { key: "comunicacionFacil", q: "¿Qué tan fácil le resultó comunicarse con nosotros?", si: "Fácil", no: "Difícil" },
  { key: "horarioSatisfecho", q: "¿Qué tan satisfecho está con el horario y disponibilidad del servicio?", si: "Satisfecho", no: "Insatisfecho" },
];

const VACIO: EncuestaInput = {
  amable: null, tiempoAdecuado: null, resolvioDudas: null, ofrecioAlternativas: null,
  profesionalismoSatisfecho: null, comunicacionFacil: null, horarioSatisfecho: null,
  calificacion: null, comentario: null,
};

export function EncuestaForm() {
  const [r, setR] = useState<EncuestaInput>(VACIO);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = (k: BoolKey, v: boolean) => setR((s) => ({ ...s, [k]: v }));

  const completa =
    SI_NO.every((x) => r[x.key] !== null) &&
    ESCALA.every((x) => r[x.key] !== null) &&
    r.calificacion !== null;

  async function enviar() {
    if (!completa) {
      setMsg("Por favor responde todas las preguntas marcadas con *.");
      return;
    }
    setEnviando(true);
    setMsg(null);
    try {
      await guardarEncuesta({ ...r, comentario: comentario.trim() || null });
      setListo(true);
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl">🙏</div>
        <h2 className="text-lg font-semibold text-foreground">¡Gracias por tu opinión!</h2>
        <p className="mt-2 text-sm text-muted">Tu respuesta nos ayuda a mejorar nuestro servicio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {SI_NO.map((x, i) => (
        <Pregunta key={x.key} n={i + 1} texto={x.q}>
          <Opciones valor={r[x.key]} onSi={() => set(x.key, true)} onNo={() => set(x.key, false)} siLabel="Sí" noLabel="No" />
        </Pregunta>
      ))}
      {ESCALA.map((x, i) => (
        <Pregunta key={x.key} n={SI_NO.length + i + 1} texto={x.q}>
          <Opciones valor={r[x.key]} onSi={() => set(x.key, true)} onNo={() => set(x.key, false)} siLabel={x.si} noLabel={x.no} />
        </Pregunta>
      ))}

      <Pregunta n={SI_NO.length + ESCALA.length + 1} texto="¿Cómo calificaría la atención que recibió por parte de nuestro personal? (1 = muy malo, 5 = excelente)">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setR((s) => ({ ...s, calificacion: v }))}
              className={`h-11 w-11 rounded-lg border-2 text-sm font-bold transition ${
                r.calificacion === v ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-foreground hover:bg-surface-2"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </Pregunta>

      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">Comentarios (opcional)</p>
        <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>

      {msg && <p className="text-sm text-danger">{msg}</p>}
      <button type="button" onClick={enviar} disabled={enviando}
        className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-fg hover:opacity-90 disabled:opacity-50">
        {enviando ? "Enviando…" : "Enviar encuesta"}
      </button>
    </div>
  );
}

function Pregunta({ n, texto, children }: { n: number; texto: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-2.5 text-sm font-medium text-foreground">
        {n}. {texto} <span className="text-danger">*</span>
      </p>
      {children}
    </div>
  );
}

function Opciones({
  valor, onSi, onNo, siLabel, noLabel,
}: {
  valor: boolean | null;
  onSi: () => void;
  onNo: () => void;
  siLabel: string;
  noLabel: string;
}) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={onSi}
        className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${valor === true ? "border-success bg-success-soft text-success" : "border-border bg-surface hover:bg-surface-2"}`}>
        {siLabel}
      </button>
      <button type="button" onClick={onNo}
        className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${valor === false ? "border-danger bg-danger-soft text-danger" : "border-border bg-surface hover:bg-surface-2"}`}>
        {noLabel}
      </button>
    </div>
  );
}
