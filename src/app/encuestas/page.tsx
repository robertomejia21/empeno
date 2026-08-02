import { redirect } from "next/navigation";
import { listarEncuestas } from "@/lib/db/repo";
import { getUsuarioActual } from "@/lib/session";
import { formatFecha } from "@/lib/format";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import type { Encuesta } from "@/lib/types";

const PREGUNTAS: { key: keyof Encuesta; label: string; positivo: string }[] = [
  { key: "amable", label: "Atención amable y respetuosa", positivo: "Sí" },
  { key: "tiempoAdecuado", label: "Tiempo de atención adecuado", positivo: "Sí" },
  { key: "resolvioDudas", label: "Resolvió dudas con claridad", positivo: "Sí" },
  { key: "ofrecioAlternativas", label: "Ofreció soluciones/alternativas", positivo: "Sí" },
  { key: "profesionalismoSatisfecho", label: "Satisfecho con el profesionalismo", positivo: "Satisfecho" },
  { key: "comunicacionFacil", label: "Fácil comunicarse", positivo: "Fácil" },
  { key: "horarioSatisfecho", label: "Satisfecho con horario/disponibilidad", positivo: "Satisfecho" },
];

function pctPositivo(encuestas: Encuesta[], key: keyof Encuesta): { pct: number; n: number } {
  const conValor = encuestas.filter((e) => e[key] !== null);
  const positivos = conValor.filter((e) => e[key] === true).length;
  return { pct: conValor.length ? Math.round((positivos / conValor.length) * 100) : 0, n: conValor.length };
}

export default async function EncuestasPage() {
  const usuario = await getUsuarioActual();
  if (!usuario || !["admin", "gerente", "invitado"].includes(usuario.rol)) redirect("/");

  const encuestas = await listarEncuestas();
  const total = encuestas.length;
  const conCalif = encuestas.filter((e) => e.calificacion != null);
  const promedio = conCalif.length ? conCalif.reduce((s, e) => s + (e.calificacion ?? 0), 0) / conCalif.length : 0;
  const comentarios = encuestas.filter((e) => e.comentario);

  return (
    <div>
      <PageHeader title="Encuestas de satisfacción" subtitle={`${total} respuesta(s)`} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Respuestas" valor={String(total)} />
        <Kpi label="Calificación promedio" valor={`${promedio.toFixed(1)} / 5`} />
        <Kpi label="Con comentario" valor={String(comentarios.length)} />
        <Kpi label="Muy satisfechos (5)" valor={String(conCalif.filter((e) => e.calificacion === 5).length)} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Resultados por pregunta" subtitle="% de respuestas positivas" />
        <div className="space-y-3 p-5">
          {PREGUNTAS.map((p) => {
            const { pct, n } = pctPositivo(encuestas, p.key);
            return (
              <div key={String(p.key)}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted">{p.label}</span>
                  <span className="font-medium text-foreground">{pct}% {p.positivo} <span className="text-muted">({n})</span></span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${pct >= 70 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-danger"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {comentarios.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Comentarios recientes" />
          <ul className="divide-y divide-border">
            {comentarios.slice(0, 30).map((e) => (
              <li key={e.id} className="px-5 py-3">
                <p className="text-sm text-foreground">“{e.comentario}”</p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatFecha(e.creadoEn)}{e.calificacion != null ? ` · ${e.calificacion}/5` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Kpi({ label, valor }: { label: string; valor: string }) {
  return (
    <Card className="p-5">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-2 text-[22px] font-bold tracking-tight text-foreground">{valor}</p>
    </Card>
  );
}
