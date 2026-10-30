import Image from "next/image";
import { ArrowRight, Building2, Lock, Mail, ShieldCheck, TriangleAlert } from "lucide-react";
import { iniciarSesion, entrarComoInvitado } from "@/lib/auth-actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MarcaIcono } from "@/components/Marca";

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  const mensajeError =
    error === "config"
      ? "La autenticación no está configurada en el servidor."
      : error === "sinrol"
        ? "Tu usuario no tiene un rol asignado. Pide al administrador que te lo asigne."
        : error
          ? "Correo o contraseña incorrectos."
          : null;

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Formulario */}
      <div className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white">
              <MarcaIcono className="h-7 w-7" />
            </span>
            <div className="leading-tight">
              <p className="text-[15px] font-bold tracking-tight text-foreground">
                Turbo<span className="text-primary"> Presta</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">El Dorado</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Bienvenido</h1>
            <p className="mt-2 text-sm text-muted">Ingresa con tu cuenta para continuar.</p>

            <form action={iniciarSesion} className="mt-8 space-y-4">
              <input type="hidden" name="next" value={next ?? "/"} />

              {mensajeError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {mensajeError}
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Correo</span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                  <input
                    name="email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    className={inputCls}
                    placeholder="tucorreo@ejemplo.com"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Contraseña</span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className={inputCls}
                    placeholder="••••••••"
                  />
                </span>
              </label>

              <button
                type="submit"
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-fg shadow-soft transition hover:brightness-105 active:brightness-95"
              >
                Iniciar sesión
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" /> o <span className="h-px flex-1 bg-border" />
            </div>

            <form action={entrarComoInvitado}>
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground transition hover:bg-surface-2"
              >
                <Building2 className="h-4 w-4 text-primary" aria-hidden />
                Entrar a la Oficina Virtual
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-muted">Acceso sin contraseña · solo lectura</p>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Acceso restringido al personal autorizado
        </p>
      </div>

      {/* Panel visual (desktop) */}
      <div className="relative hidden p-3 lg:block">
        <div className="relative h-full overflow-hidden rounded-3xl bg-primary">
          <Image
            src="/img/login.png"
            alt=""
            fill
            priority
            sizes="55vw"
            className="object-cover opacity-35 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/75">Software para casas de empeño</p>
            <p className="mt-3 max-w-md text-3xl font-semibold leading-tight xl:text-4xl">
              Tu casa de empeño, ordenada y en la nube.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
