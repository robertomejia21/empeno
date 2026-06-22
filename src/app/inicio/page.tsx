import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { AnimatedCounter } from "@/components/landing-fx";

export const metadata = {
  title: "Empeño Suite — Software para casas de empeño",
  description:
    "El sistema todo-en-uno para casas de empeño en México: empeños, inventario, punto de venta, caja, cumplimiento PLD y avisos por WhatsApp.",
};

const INK = "#14110d";

const capacidades = [
  { i: "01", t: "Empeños", d: "Alta guiada en nueve pasos, tasa según el historial del cliente y contrato prendario impreso al instante." },
  { i: "02", t: "Inventario y avalúos", d: "Prendas con fotografías, valuación de metales por kilataje y control de resguardo en bóveda." },
  { i: "03", t: "Punto de venta", d: "Remates, ventas, compra directa y apartados con enganche y abonos. El ciclo comercial completo." },
  { i: "04", t: "Caja y reportes", d: "Corte diario, flujo de efectivo, recibos en PDF y analítica con gráficas en vivo." },
  { i: "05", t: "Cumplimiento", d: "Umbrales LFPIORPI en UMA, expedientes KYC y contrato conforme a la NOM-179-SCFI." },
  { i: "06", t: "Avisos por WhatsApp", d: "Recordatorios de vencimiento, automáticos, para que el cliente refrende a tiempo." },
];

const modulos = [
  "Empeños", "Prendas", "Clientes", "Recordatorios", "Remates", "Ventas",
  "Compra directa", "Apartados", "Caja", "Reportes", "Cumplimiento PLD",
  "Avalúo de metales", "Usuarios", "Bitácora", "Boletas PDF", "Búsqueda global",
];

const faqs = [
  { q: "¿Necesito instalar algo?", a: "No. Funciona en la nube desde cualquier navegador: mostrador, oficina o celular." },
  { q: "¿Cumple con la normativa mexicana?", a: "Sí: umbrales LFPIORPI, expedientes KYC, contrato NOM-179 y base para reportes de PROFECO y la UIF/SAT." },
  { q: "¿Puedo avisar por WhatsApp?", a: "Sí, recordatorios de vencimiento manuales o automáticos a tus clientes." },
  { q: "¿Mis datos están seguros?", a: "Acceso por roles, autenticación de usuarios y bitácora de auditoría de cada operación." },
];

export default function LandingPage() {
  return (
    <div className="font-sans" style={{ background: INK }}>
      {/* ===================== HERO ===================== */}
      <section className="relative text-[#f4efe6]" style={{ background: INK }}>
        {/* Nav */}
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold tracking-tight">Empeño</span>
            <span className="text-xl font-light tracking-tight text-[#c8972f]">Suite</span>
          </div>
          <div className="hidden items-center gap-8 text-[13px] uppercase tracking-[0.18em] text-[#b9b1a4] md:flex">
            <a href="#sistema" className="hover:text-[#f4efe6]">Sistema</a>
            <a href="#capacidades" className="hover:text-[#f4efe6]">Capacidades</a>
            <a href="#faq" className="hover:text-[#f4efe6]">Preguntas</a>
          </div>
          <Link
            href="/login"
            className="rounded-full border border-[#c8972f]/50 px-5 py-2 text-[13px] font-medium uppercase tracking-[0.14em] text-[#e7b84e] transition hover:bg-[#c8972f] hover:text-[#14110d]"
          >
            Entrar
          </Link>
        </nav>

        <div className="mx-auto grid max-w-7xl items-stretch gap-0 lg:grid-cols-12">
          {/* Texto */}
          <div className="flex flex-col justify-center px-6 py-16 lg:col-span-7 lg:py-28 lg:pr-12">
            <p className="mb-6 flex items-center gap-3 text-[12px] uppercase tracking-[0.3em] text-[#b9b1a4]">
              <span className="inline-block h-px w-10 bg-[#c8972f]" />
              Casa de empeño · México
            </p>
            <h1 className="font-display text-[44px] font-light leading-[1.04] tracking-tight sm:text-6xl lg:text-[68px]">
              El oficio de empeñar,
              <br />
              <span className="italic text-[#e7b84e]">por fin</span> bien sistematizado.
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-[#cabfae]">
              Préstamos, inventario, punto de venta, caja y cumplimiento — en una sola
              plataforma, rápida y hecha para el mostrador mexicano.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/login"
                className="group inline-flex items-center gap-3 rounded-full bg-[#e7b84e] px-7 py-3.5 text-sm font-semibold text-[#14110d] transition hover:bg-[#f4efe6]"
              >
                Entrar a la plataforma
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <a href="#sistema" className="text-sm font-medium text-[#cabfae] underline-offset-4 hover:text-[#f4efe6] hover:underline">
                Ver el sistema
              </a>
            </div>

            {/* Stats con hairlines */}
            <div className="mt-14 flex divide-x divide-white/10 border-y border-white/10">
              {[
                { n: <AnimatedCounter value={16} suffix="" />, l: "módulos" },
                { n: <AnimatedCounter value={9} suffix="" />, l: "pasos por empeño" },
                { n: <><AnimatedCounter value={100} suffix="" />%</>, l: "en la nube" },
              ].map((s, i) => (
                <div key={i} className="flex-1 py-5 pl-5 first:pl-0">
                  <p className="font-display text-3xl font-light text-[#f4efe6]">{s.n}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-[#b9b1a4]">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Imagen full-height */}
          <div className="relative min-h-[340px] overflow-hidden lg:col-span-5 lg:min-h-full">
            <Image
              src="/img/avaluo-oro.png"
              alt="Joyería de oro y reloj de lujo"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(90deg, ${INK} 0%, transparent 35%, transparent 100%)` }}
            />
          </div>
        </div>
      </section>

      {/* ===================== MANIFIESTO (papel) ===================== */}
      <section className="bg-[#f4efe6] text-[#14110d]">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <Reveal>
            <p className="mb-8 text-[12px] uppercase tracking-[0.3em] text-[#9a8f7d]">Manifiesto</p>
            <p className="font-display text-3xl font-light leading-[1.25] tracking-tight md:text-[42px]">
              El empeño es un negocio de <span className="italic">confianza</span> y de
              <span className="italic"> minutos</span>. Tu sistema debería respetar ambos:
              cero papeleo, cada préstamo en orden y cada cliente atendido a tiempo.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===================== CAPACIDADES (tinta, lista numerada) ===================== */}
      <section id="capacidades" className="text-[#f4efe6]" style={{ background: INK }}>
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-28">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-light tracking-tight md:text-5xl">Todo lo que opera tu casa</h2>
            <p className="max-w-xs text-sm text-[#b9b1a4]">De la recepción de la prenda al remate, con trazabilidad en cada paso.</p>
          </div>
          <div className="border-t border-white/10">
            {capacidades.map((c, idx) => (
              <Reveal key={c.i} delay={idx * 60}>
                <div className="group grid grid-cols-1 gap-3 border-b border-white/10 py-7 transition hover:bg-white/[0.03] md:grid-cols-12 md:items-baseline md:gap-8 md:px-3">
                  <span className="font-mono text-sm text-[#c8972f] md:col-span-1">{c.i}</span>
                  <h3 className="font-display text-2xl font-light md:col-span-4">{c.t}</h3>
                  <p className="text-[15px] leading-relaxed text-[#cabfae] md:col-span-7">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SISTEMA (papel, mockups) ===================== */}
      <section id="sistema" className="bg-[#f4efe6] text-[#14110d]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <Reveal>
            <p className="mb-3 text-[12px] uppercase tracking-[0.3em] text-[#9a8f7d]">El producto</p>
            <h2 className="font-display max-w-xl text-4xl font-light leading-tight tracking-tight md:text-5xl">
              Una interfaz clara, pensada para el mostrador.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-12">
              <AppMockup />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== AVALÚO (tinta + imagen) ===================== */}
      <section className="text-[#f4efe6]" style={{ background: INK }}>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-28">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
              <Image src="/img/avaluo-balanza.png" alt="Báscula de joyero pesando oro" fill sizes="(max-width:768px) 100vw, 45vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <p className="mb-4 text-[12px] uppercase tracking-[0.3em] text-[#c8972f]">Avalúo de metales</p>
              <h2 className="font-display text-4xl font-light leading-tight tracking-tight md:text-[44px]">
                Valúa oro y plata en segundos.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#cabfae]">
                Calcula por gramaje y kilataje con el precio del día y obtén el préstamo
                sugerido al instante. Menos errores, más confianza frente al cliente.
              </p>
              <Link href="/login" className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-[#e7b84e] underline-offset-4 hover:underline">
                Probar la calculadora <span>→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== MÓDULOS (marquee) ===================== */}
      <section className="overflow-hidden border-y border-[#14110d]/10 bg-[#ece4d6] py-7 text-[#14110d]">
        <div className="flex w-max anim-marquee whitespace-nowrap">
          {[...modulos, ...modulos].map((m, i) => (
            <span key={i} className="flex items-center font-display text-2xl font-light">
              <span className="px-6">{m}</span>
              <span className="text-[#c8972f]">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* ===================== MÉXICO (papel) ===================== */}
      <section className="bg-[#f4efe6] text-[#14110d]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-28">
          <Reveal>
            <h2 className="font-display max-w-2xl text-4xl font-light leading-tight tracking-tight md:text-5xl">
              Cumplimiento mexicano, sin letra chica.
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 border-t border-black/10 sm:grid-cols-2 lg:grid-cols-5">
            {["LFPIORPI", "PROFECO", "NOM-179-SCFI", "CFDI / SAT", "CURP / KYC"].map((b, i) => (
              <Reveal key={b} delay={i * 50}>
                <div className="border-b border-black/10 py-8 sm:border-r sm:px-5 sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(5n)]:border-r-0">
                  <p className="font-mono text-xs text-[#9a8f7d]">0{i + 1}</p>
                  <p className="font-display mt-2 text-xl font-light">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ (tinta) ===================== */}
      <section id="faq" className="text-[#f4efe6]" style={{ background: INK }}>
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-28">
          <h2 className="font-display mb-12 text-4xl font-light tracking-tight md:text-5xl">Preguntas frecuentes</h2>
          <div className="border-t border-white/10">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-white/10 py-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-6 text-lg font-light">
                  <span className="font-display">{f.q}</span>
                  <span className="text-[#c8972f] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#cabfae]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA (papel) ===================== */}
      <section className="bg-[#f4efe6] text-[#14110d]">
        <div className="mx-auto max-w-5xl px-6 py-28 text-center md:py-36">
          <Reveal>
            <h2 className="font-display text-5xl font-light leading-[1.05] tracking-tight md:text-7xl">
              Tu casa de empeño,
              <br />
              <span className="italic text-[#c8972f]">en orden.</span>
            </h2>
            <Link
              href="/login"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#14110d] px-8 py-4 text-sm font-semibold text-[#f4efe6] transition hover:bg-[#c8972f] hover:text-[#14110d]"
            >
              Iniciar sesión <span>→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="text-[#f4efe6]" style={{ background: INK }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 px-6 py-10 md:flex-row">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold">Empeño</span>
            <span className="text-lg font-light text-[#c8972f]">Suite</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b9b1a4]">© 2026 · Software para casas de empeño · México</p>
        </div>
      </footer>
    </div>
  );
}

/* ---- Mockup del producto (papel/dark mix, render real) ---- */
function AppMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-black/10 bg-[#ece4d6] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#d97b6c]" />
        <span className="h-3 w-3 rounded-full bg-[#e0b54a]" />
        <span className="h-3 w-3 rounded-full bg-[#86b87f]" />
        <span className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-center text-[11px] text-[#9a8f7d]">empeno.suite/tablero</span>
      </div>
      <div className="flex h-[340px] text-[#14110d]">
        <div className="hidden w-40 shrink-0 flex-col gap-1.5 bg-[#14110d] p-3.5 sm:flex">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-[#e7b84e]" />
            <span className="h-2.5 w-16 rounded bg-white/30" />
          </div>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className={`flex items-center gap-2 rounded px-2 py-1.5 ${i === 1 ? "bg-white/10" : ""}`}>
              <span className={`h-2.5 w-2.5 rounded ${i === 1 ? "bg-[#e7b84e]" : "bg-white/25"}`} />
              <span className={`h-2 rounded ${i === 1 ? "bg-white/70" : "bg-white/20"}`} style={{ width: `${48 + i * 5}%` }} />
            </div>
          ))}
        </div>
        <div className="flex-1 space-y-3 overflow-hidden bg-[#f4efe6] p-4">
          <div className="flex items-center justify-between rounded-xl bg-[#14110d] px-5 py-4 text-white">
            <div>
              <div className="h-2 w-20 rounded bg-white/30" />
              <div className="mt-2.5 h-3.5 w-32 rounded bg-[#e7b84e]/80" />
            </div>
            <div className="h-8 w-24 rounded-lg bg-[#e7b84e]" />
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {[["#86833f", "12"], ["#c8972f", "$84k"], ["#3f6a9e", "$20k"], ["#b1483f", "3"]].map(([c, v], i) => (
              <div key={i} className="rounded-lg border border-black/10 bg-white p-2.5">
                <div className="h-1.5 w-8 rounded bg-black/10" />
                <div className="mt-2 font-display text-base" style={{ color: c as string }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-3">
            <div className="mb-2 h-1.5 w-24 rounded bg-black/10" />
            <div className="flex h-24 items-end gap-2">
              {[42, 64, 50, 82, 56, 92, 70, 60].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: "linear-gradient(180deg,#e7b84e,#c8972f)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
