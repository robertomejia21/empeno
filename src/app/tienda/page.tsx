import Link from "next/link";
import { listarPrendasEnVenta } from "@/lib/db/repo";
import { formatMXN } from "@/lib/format";
import { EMPRESA } from "@/lib/compliance";
import { MarcaIcono } from "@/components/Marca";
import { ArrowRight, MessageCircle, Package, Phone } from "lucide-react";

export const metadata = {
  title: "Remates y oportunidades — Turbo Presta El Dorado",
  description: "Artículos en venta a precio de remate: joyería, electrónica, herramientas y más.",
};

export default async function TiendaPage() {
  const prendas = await listarPrendasEnVenta();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
          <Link href="/tienda" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-white shadow-soft">
              <MarcaIcono className="h-6 w-6" />
            </span>
            <span className="truncate text-[17px] font-bold tracking-tight">
              Turbo<span className="text-primary"> Presta</span>
              <span className="ml-1.5 hidden text-[11px] font-bold uppercase tracking-widest text-brand sm:inline">El Dorado</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-4">
            <a href={`tel:+${EMPRESA.whatsapp}`} className="hidden items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground sm:inline-flex">
              <Phone className="h-4 w-4" aria-hidden /> {EMPRESA.telefono}
            </a>
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
              Personal <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-5">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-fg md:px-10 md:py-16">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-32 h-56 w-56 rounded-full bg-white/5" />
          <div className="relative">
          <p className="text-xs font-medium uppercase tracking-widest text-white/75">Oportunidades</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Artículos a precio de remate</h1>
          <p className="mt-3 max-w-lg text-white/85">Joyería, electrónica, herramientas y más. Precios de oportunidad. Pregunta por el artículo que te interese.</p>
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-12">
        {prendas.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-6 py-20 text-center">
            <p className="text-lg font-semibold">Por ahora no hay artículos en remate</p>
            <p className="mt-2 text-sm text-muted">Vuelve pronto — publicamos oportunidades cada semana.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{prendas.length} artículo(s) disponibles</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {prendas.map((p) => (
                <div key={p.id} className="shadow-soft group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card">
                  <div className="aspect-square w-full overflow-hidden bg-surface-2">
                    {p.fotos[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.fotos[0]} alt={p.descripcion} className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted">
                        <Package className="h-10 w-10" strokeWidth={1.5} aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">{p.categoria}</span>
                    <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-foreground">{p.descripcion}</p>
                    <p className="mb-3 mt-2 text-base font-bold tabular-nums text-primary sm:text-lg">{formatMXN(p.valorAvaluo)}</p>
                    <a
                      href={`https://wa.me/${EMPRESA.whatsapp}?text=${encodeURIComponent(
                        `Hola ${EMPRESA.nombre}, me interesa el artículo: ${p.descripcion} (${p.folio}) a ${formatMXN(p.valorAvaluo)}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-success px-3 py-2 text-center text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden /> Me interesa
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl space-y-1.5 px-4 text-center text-xs text-muted sm:px-5">
          <p className="font-semibold text-foreground">
            {EMPRESA.nombre} · Sucursal {EMPRESA.sucursal}
          </p>
          <p>
            {EMPRESA.direccion}, {EMPRESA.colonia}, C.P. {EMPRESA.cp}, {EMPRESA.ciudad} · Tel. {EMPRESA.telefono}
          </p>
          <p>© 2026 · {EMPRESA.razonSocial} · Precios sujetos a disponibilidad.</p>
        </div>
      </footer>
    </div>
  );
}
