export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Encabezado */}
      <div className="mb-7 flex items-end justify-between">
        <div>
          <div className="skeleton h-7 w-48" />
          <div className="skeleton mt-2 h-4 w-32" />
        </div>
        <div className="skeleton h-10 w-36" />
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton mt-3 h-7 w-20" />
          </div>
        ))}
      </div>

      {/* Bloques de contenido */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="skeleton h-5 w-40" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="skeleton h-5 w-28" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
