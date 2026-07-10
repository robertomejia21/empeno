import Link from "next/link";
import { listarPrendasEnVenta } from "@/lib/db/repo";
import { formatMXN } from "@/lib/format";
import { EMPRESA } from "@/lib/compliance";
import { MarcaIcono } from "@/components/Marca";

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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/tienda" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white shadow-soft">
              <MarcaIcono className="h-6 w-6" />
            </span>
            <span className="text-[17px] font-bold tracking-tight">
              Turbo<span className="text-gold-gradient"> Presta</span>
              <span className="ml-1.5 text-[11px] font-bold uppercase tracking-widest text-brand">El Dorado</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <a href={`tel:+${EMPRESA.whatsapp}`} className="hidden text-sm font-medium text-muted hover:text-foreground sm:block">
              📞 {EMPRESA.telefono}
            </a>
            <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground">Personal →</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gold-gradient text-white">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="text-xs font-medium uppercase tracking-widest text-white/70">Oportunidades</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">Artículos a precio de remate</h1>
          <p className="mt-3 max-w-lg text-white/85">Joyería, electrónica, herramientas y más. Precios de oportunidad. Pregunta por el artículo que te interese.</p>
        </div>
      </section>

      {/* Catálogo */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        {prendas.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-6 py-20 text-center">
            <p className="text-lg font-semibold">Por ahora no hay artículos en remate</p>
            <p className="mt-2 text-sm text-muted">Vuelve pronto — publicamos oportunidades cada semana.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-2xl font-bold tracking-tight">{prendas.length} artículo(s) disponibles</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {prendas.map((p) => (
                <div key={p.id} className="shadow-card group overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-elevated">
                  <div className="aspect-square w-full overflow-hidden bg-surface-2">
                    {p.fotos[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.fotos[0]} alt={p.descripcion} className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl text-muted">📦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{p.categoria}</span>
                    <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-foreground">{p.descripcion}</p>
                    <p className="mt-2 text-lg font-bold text-primary">{formatMXN(p.valorAvaluo)}</p>
                    <a
                      href={`https://wa.me/${EMPRESA.whatsapp}?text=${encodeURIComponent(
                        `Hola ${EMPRESA.nombre}, me interesa el artículo: ${p.descripcion} (${p.folio}) a ${formatMXN(p.valorAvaluo)}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block rounded-lg bg-success px-3 py-2 text-center text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      💬 Me interesa
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl space-y-1.5 px-5 text-center text-xs text-muted">
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
