import { iniciarSesion } from "@/lib/auth-actions";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="bg-gold-gradient mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-soft">
            ⚖️
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Empeño<span className="text-gold-gradient"> Suite</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Ingresa a tu cuenta</p>
        </div>

        <form action={iniciarSesion} className="shadow-card space-y-4 rounded-2xl border border-border bg-surface p-6">
          <input type="hidden" name="next" value={next ?? "/"} />

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">
              {error === "config"
                ? "La autenticación no está configurada en el servidor."
                : "Correo o contraseña incorrectos."}
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Correo</span>
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition focus:border-primary-2 focus:bg-surface focus:ring-2 focus:ring-primary-2/20"
              placeholder="tucorreo@ejemplo.com"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition focus:border-primary-2 focus:bg-surface focus:ring-2 focus:ring-primary-2/20"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            className="bg-gold-gradient shadow-soft w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-fg transition hover:brightness-105"
          >
            Iniciar sesión
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Casa de empeño · acceso restringido al personal autorizado
        </p>
      </div>
    </div>
  );
}
