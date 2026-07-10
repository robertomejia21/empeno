import Link from "next/link";
import { MarcaIcono } from "@/components/Marca";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedCounter, Parallax } from "@/components/landing-fx";

export const metadata = {
  title: "Turbo Presta El Dorado — Casa de empeño en Mexicali",
  description:
    "La suite todo-en-uno para casas de empeño en México: empeños, inventario, punto de venta, caja, cumplimiento PLD y notificaciones por WhatsApp.",
};

const features = [
  { icon: "🤝", t: "Empeños guiados", d: "Asistente de 9 pasos: cliente, prenda, préstamo, intereses por historial y contrato prendario." },
  { icon: "💍", t: "Inventario y avalúos", d: "Catálogo con fotos, avalúo de metales por kilataje y ubicación de resguardo." },
  { icon: "🛒", t: "Punto de venta", d: "Remates, ventas, compra directa y apartados con enganche y abonos." },
  { icon: "💵", t: "Caja y reportes", d: "Corte diario, flujo de efectivo y analítica con gráficas en tiempo real." },
  { icon: "🛡️", t: "Cumplimiento PLD", d: "Umbrales LFPIORPI en UMA, operaciones reportables y expedientes KYC." },
  { icon: "🔔", t: "Avisos por WhatsApp", d: "Recordatorios de vencimiento automáticos para que tus clientes refrenden a tiempo." },
];

const modulos = [
  "Tablero", "Empeños", "Comprar", "Clientes", "Recordatorios", "Remates",
  "Ventas (POS)", "Compra directa", "Apartados", "Caja", "Reportes",
  "Cumplimiento PLD", "Avalúo de metales", "Usuarios y roles", "Bitácora", "Boletas PDF",
];

const testimonios = [
  { n: "María G.", r: "Gerente · CDMX", t: "Desde que usamos la suite, los refrendos por WhatsApp subieron muchísimo. Los clientes llegan a tiempo." },
  { n: "Juan C.", r: "Dueño · Toluca", t: "El asistente de empeño es rapidísimo en el mostrador. Capturamos en minutos y el contrato sale en PDF." },
  { n: "Ana M.", r: "Cajera · Edomex", t: "La caja y los reportes me cuadran solos al final del día. Antes era un caos en papel." },
];

const faqs = [
  { q: "¿Necesito instalar algo?", a: "No. Es 100% web y funciona en la nube desde cualquier navegador, en mostrador, oficina o celular." },
  { q: "¿Cumple con la normativa mexicana?", a: "Sí. Incorpora umbrales LFPIORPI (UMA), expedientes KYC, contrato prendario conforme a la NOM-179 y base para reportes de PROFECO y la UIF/SAT." },
  { q: "¿Puedo enviar avisos por WhatsApp?", a: "Sí. Envía recordatorios de vencimiento manuales o automáticos a tus clientes para que refrenden a tiempo." },
  { q: "¿Mis datos están seguros?", a: "Sí. Base de datos con control de acceso por roles, autenticación de usuarios y bitácora de auditoría de cada operación." },
  { q: "¿Puedo migrar mis datos actuales?", a: "Sí, te ayudamos a importar tu cartera de empeños, clientes e inventario para arrancar sin perder información." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white shadow-soft"><MarcaIcono className="h-6 w-6" /></span>
            <span className="text-[17px] font-bold tracking-tight">Turbo<span className="text-gold-gradient"> Presta</span></span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#funciones" className="hover:text-foreground">Funciones</a>
            <a href="#producto" className="hover:text-foreground">Producto</a>
            <a href="#faq" className="hover:text-foreground">Preguntas</a>
            <Link href="/tienda" className="hover:text-foreground">🛒 Remates</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="bg-gold-gradient shadow-soft hidden rounded-lg px-4 py-2 text-sm font-semibold text-primary-fg transition hover:brightness-105 sm:inline-block">
              Iniciar sesión
            </Link>
            {/* Menú móvil */}
            <details className="relative md:hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-base">☰</summary>
              <div className="shadow-elevated absolute right-0 mt-2 w-44 rounded-xl border border-border bg-surface p-2 text-sm">
                <a href="#funciones" className="block rounded-lg px-3 py-2 hover:bg-surface-2">Funciones</a>
                <a href="#producto" className="block rounded-lg px-3 py-2 hover:bg-surface-2">Producto</a>
                <a href="#faq" className="block rounded-lg px-3 py-2 hover:bg-surface-2">Preguntas</a>
                <Link href="/login" className="bg-gold-gradient mt-1 block rounded-lg px-3 py-2 text-center font-semibold text-primary-fg">Iniciar sesión</Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="anim-blob absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="anim-blob absolute right-0 top-32 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl" style={{ animationDelay: "4s" }} />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <div className="anim-pulso mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Hecho para México · LFPIORPI · PROFECO
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
              El sistema completo para tu{" "}
              <span className="text-gold-gradient">casa de empeño</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              Empeños, inventario, punto de venta, caja, cumplimiento y avisos por WhatsApp.
              Todo en una plataforma rápida, segura y en la nube.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="bg-gold-gradient shadow-elevated rounded-xl px-6 py-3 text-sm font-semibold text-primary-fg transition hover:brightness-105">
                Entrar a la plataforma →
              </Link>
              <a href="#producto" className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold transition hover:bg-surface-2">
                Ver el producto
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted">
              <Stat n={<AnimatedCounter value={16} suffix="+" />} l="módulos" />
              <Stat n={<AnimatedCounter value={9} suffix=" pasos" />} l="alta de empeño" />
              <Stat n={<AnimatedCounter value={100} suffix="% nube" />} l="disponibilidad" />
            </div>
          </div>

          {/* Mockup flotante del producto */}
          <Reveal>
            <Parallax factor={0.04}>
              <div className="anim-flotar">
                <BrowserMockup />
              </div>
            </Parallax>
          </Reveal>
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Todo lo que tu operación necesita</h2>
            <p className="mt-3 text-muted">De la recepción de la prenda al remate, con cumplimiento y trazabilidad en cada paso.</p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.t} delay={i * 70}>
              <div className="shadow-card group h-full rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-1 hover:shadow-elevated">
                <span className="bg-primary-soft flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition group-hover:scale-110">{f.icon}</span>
                <h3 className="mt-4 text-lg font-semibold">{f.t}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* AVALÚO DE METALES — imagen generada */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="bg-gold-gradient absolute -inset-3 rounded-3xl opacity-20 blur-2xl" />
              <Image
                src="/img/avaluo-oro.png"
                alt="Avalúo de metales: joyería de oro y reloj de lujo"
                width={800}
                height={600}
                className="shadow-elevated relative w-full rounded-2xl border border-border object-cover"
                priority
              />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <span className="bg-primary-soft inline-flex rounded-full px-3 py-1 text-xs font-semibold text-primary">
                Avalúo inteligente
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">Valúa metales preciosos en segundos</h2>
              <p className="mt-3 text-muted">
                Calcula el valor de oro y plata por gramaje y kilataje con precios de referencia,
                y obtén el préstamo sugerido al instante. Menos errores, más confianza en el mostrador.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {["Cálculo por kilataje (10k–24k) y gramos", "Préstamo sugerido configurable", "Precio spot editable del día"].map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <span className="mt-0.5 text-success">✓</span>
                    <span className="text-foreground">{x}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login" className="bg-gold-gradient shadow-soft mt-7 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-primary-fg transition hover:brightness-105">
                Probar la calculadora →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRODUCTO — mockup grande real */}
      <section id="producto" className="border-y border-border bg-surface-2 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Una interfaz que se siente premium</h2>
              <p className="mt-3 text-muted">Diseño claro, rápido y pensado para el mostrador. Así se ve por dentro.</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-10">
              <AppMockup />
            </div>
          </Reveal>
        </div>
      </section>

      {/* MÓDULOS */}
      <section id="modulos" className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">16 módulos, una sola suite</h2>
            <p className="mt-3 text-muted">Sin integraciones complicadas: todo conectado y listo para usar.</p>
          </div>
        </Reveal>
        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          {modulos.map((m, i) => (
            <Reveal key={m} delay={i * 35}>
              <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium shadow-soft">{m}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="border-y border-border bg-surface-2 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Casas de empeño que ya operan mejor</h2>
              <p className="mt-3 text-muted">Lo que dicen quienes lo usan todos los días.</p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonios.map((t, i) => (
              <Reveal key={t.n} delay={i * 80}>
                <figure className="shadow-card h-full rounded-2xl border border-border bg-surface p-6">
                  <div className="mb-3 text-primary">★★★★★</div>
                  <blockquote className="text-sm text-foreground">“{t.t}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span className="bg-gold-gradient flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white">
                      {t.n.charAt(0)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{t.n}</span>
                      <span className="block text-xs text-muted">{t.r}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted">Testimonios ilustrativos.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-surface-2 py-16">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
              <p className="mt-3 text-muted">Lo que más nos preguntan antes de empezar.</p>
            </div>
          </Reveal>
          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 50}>
                <details className="group shadow-soft rounded-xl border border-border bg-surface p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold">
                    {f.q}
                    <span className="text-primary transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MÉXICO */}
      <section id="mexico" className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <div className="bg-gold-gradient gradiente-animado shadow-elevated relative overflow-hidden rounded-3xl px-8 py-12 text-white md:px-12">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Cumplimiento mexicano, integrado</h2>
                <p className="mt-3 max-w-md text-white/85">
                  Umbrales LFPIORPI en UMA, expedientes KYC, contrato prendario conforme a la NOM-179
                  y reportes para PROFECO y la UIF/SAT.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                {["LFPIORPI", "PROFECO", "NOM-179-SCFI", "CFDI / SAT", "CURP / KYC"].map((b) => (
                  <span key={b} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">{b}</span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <Reveal>
          <div className="shadow-card rounded-3xl border border-border bg-surface px-8 py-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Empieza a operar hoy</h2>
            <p className="mx-auto mt-3 max-w-md text-muted">Tu casa de empeño, ordenada y en la nube. Entra y descúbrelo.</p>
            <Link href="/login" className="bg-gold-gradient shadow-elevated mt-7 inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-primary-fg transition hover:brightness-105">
              Iniciar sesión →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted md:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white"><MarcaIcono className="h-5 w-5" /></span>
            <span className="font-semibold text-foreground">Turbo Presta El Dorado</span>
          </div>
          <p>© 2026 · Software para casas de empeño · México</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ n, l }: { n: React.ReactNode; l: string }) {
  return (
    <div>
      <p className="text-xl font-bold text-foreground">{n}</p>
      <p className="text-xs text-muted">{l}</p>
    </div>
  );
}

/* Mockup del producto en una ventana de navegador (hero) */
function BrowserMockup() {
  return (
    <div className="shadow-elevated overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-3 flex-1 rounded-md bg-surface px-3 py-1 text-center text-[11px] text-muted">empeno.suite/tablero</span>
      </div>
      <div className="flex h-[300px]">
        <div className="hidden w-32 shrink-0 flex-col gap-1.5 bg-sidebar p-3 sm:flex">
          <div className="mb-2 flex items-center gap-2">
            <span className="bg-gold-gradient h-6 w-6 rounded-md" />
            <span className="h-2 w-14 rounded bg-white/30" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`flex items-center gap-2 rounded px-1.5 py-1.5 ${i === 1 ? "bg-sidebar-2" : ""}`}>
              <span className={`h-2.5 w-2.5 rounded ${i === 1 ? "bg-gold" : "bg-white/25"}`} />
              <span className={`h-2 rounded ${i === 1 ? "bg-white/70" : "bg-white/20"}`} style={{ width: `${50 + i * 6}%` }} />
            </div>
          ))}
        </div>
        <div className="flex-1 space-y-3 overflow-hidden p-4">
          <div className="bg-gold-gradient flex items-center justify-between rounded-xl px-4 py-3 text-white">
            <div>
              <div className="h-2 w-16 rounded bg-white/40" />
              <div className="mt-2 h-3 w-28 rounded bg-white/70" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-white/90" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[["#15803d", "12"], ["#b45309", "$84k"], ["#1d4ed8", "$20k"], ["#b91c1c", "3"]].map(([c, v], i) => (
              <div key={i} className="rounded-lg border border-border bg-surface p-2">
                <div className="h-1.5 w-8 rounded bg-border" />
                <div className="mt-1.5 text-sm font-bold" style={{ color: c as string }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="mb-2 h-1.5 w-20 rounded bg-border" />
            <div className="flex h-20 items-end gap-1.5">
              {[40, 65, 50, 80, 55, 90, 70, 60].map((h, i) => (
                <div key={i} className="bg-gold-gradient flex-1 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Mockup grande: vista de empeño con boleta */
function AppMockup() {
  return (
    <div className="shadow-elevated mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-3 flex-1 rounded-md bg-surface px-3 py-1 text-center text-[11px] text-muted">empeno.suite/empenos/EM-0042</span>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">Empeño EM-0042</div>
              <div className="text-xs text-muted">Creado el 12 de junio de 2026</div>
            </div>
            <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">Activo</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
            {[["Capital", "$3,400"], ["Interés", "$367"], ["A liquidar", "$3,767"]].map(([k, v], i) => (
              <div key={i} className="bg-surface px-4 py-3">
                <div className="text-[10px] text-muted">{k}</div>
                <div className={`mt-1 font-bold ${i === 2 ? "text-primary" : "text-foreground"}`}>{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <span className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium">📄 Descargar PDF</span>
            <span className="bg-primary-soft rounded-lg px-4 py-2 text-xs font-medium text-primary">Refrendar</span>
            <span className="bg-gold-gradient rounded-lg px-4 py-2 text-xs font-medium text-white">Desempeñar</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <div className="text-xs font-semibold text-foreground">Prenda en garantía</div>
          <div className="mt-3 aspect-square w-full rounded-lg bg-gradient-to-br from-amber-100 to-amber-300" />
          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-3/4 rounded bg-border" />
            <div className="h-2 w-1/2 rounded bg-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
