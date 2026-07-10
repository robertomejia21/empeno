import { notFound } from "next/navigation";
import { obtenerPrenda } from "@/lib/db/repo";
import { subirFotoPrenda, eliminarFotoPrenda, actualizarResguardo } from "@/lib/actions";
import { formatMXN, formatFechaLarga } from "@/lib/format";
import { Card, CardHeader, PageHeader, VolverLink } from "@/components/ui";
import { estadoPrendaBadge } from "@/components/badges";
import { ConfirmSubmit } from "@/components/actions-ui";

const campoCls =
  "w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm";

export default async function PrendaDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await obtenerPrenda(id);
  if (!p) notFound();

  const datos: [string, string | null][] = [
    ["Folio", p.folio],
    ["Departamento", p.categoria],
    ["Marca", p.marca],
    ["Submarca", p.submarca],
    ["Modelo", p.modelo],
    ["Color", p.color],
    ["Serie", p.serie],
    ["Placas", p.placas],
    ["Metal", p.metal],
    ["Kilataje", p.kilataje],
    ["Gramos", p.gramos != null ? `${p.gramos} g` : null],
    ["Resguardo", p.ubicacionResguardo],
  ];

  const esVehiculo = p.categoria === "Vehículos";
  const fichaVehiculo: [string, string | null][] = [
    ["Tipo de vehículo", p.tipoVehiculo],
    ["Transmisión", p.transmision],
    ["Número de motor", p.numeroMotor],
    ["Kilometraje", p.kilometraje != null ? `${p.kilometraje.toLocaleString("es-MX")} km` : null],
    ["Cilindros", p.cilindros],
    ["Clave vehicular", p.claveVehicular],
    ["Nivel de gasolina", p.nivelGasolina],
    ["No. de factura", p.numeroFactura],
    ["Emisor de factura", p.emisorFactura],
    ["Valor de factura", p.valorFactura != null ? formatMXN(p.valorFactura) : null],
    ["Fecha de factura", p.fechaFactura ? formatFechaLarga(p.fechaFactura) : null],
    ["Aseguradora", p.aseguradora],
    ["Póliza", p.poliza],
    ["Seguro mensual", p.seguroMensual != null ? formatMXN(p.seguroMensual) : null],
    ["Pensión mensual", p.pensionMensual != null ? formatMXN(p.pensionMensual) : null],
    ["GPS mensual", p.gpsMensual != null ? formatMXN(p.gpsMensual) : null],
  ];
  const tieneFicha = fichaVehiculo.some(([, v]) => v) || p.danios || p.gpsUbicacion;

  return (
    <div className="mx-auto max-w-4xl">
      <VolverLink href="/prendas" label="Comprar" />
      <PageHeader
        title={p.descripcion}
        subtitle={`${p.folio} · registrada ${formatFechaLarga(p.creadoEn)}`}
        action={estadoPrendaBadge(p.estado)}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title="Fotografías" subtitle={`${p.fotos.length} imagen(es)`} />
          <div className="p-5">
            {p.fotos.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay fotos de esta prenda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {p.fotos.map((url) => (
                  <div key={url} className="group relative overflow-hidden rounded-lg border border-border">
                    {/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) ? (
                      <video src={url} controls className="aspect-square w-full object-cover" />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={url} alt={p.descripcion} className="aspect-square w-full object-cover" />
                    )}
                    <form
                      action={eliminarFotoPrenda.bind(null, p.id, url)}
                      className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-100"
                    >
                      <button
                        type="submit"
                        className="rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-danger"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            <form action={subirFotoPrenda.bind(null, p.id)} className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <input
                type="file"
                name="foto"
                accept="image/*,video/*"
                required
                className="block text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
              />
              <ConfirmSubmit confirmacion="¿Subir este archivo?">Subir foto/video</ConfirmSubmit>
            </form>
          </div>
        </Card>

        <Card>
          <CardHeader title="Avalúo" />
          <div className="space-y-3 p-5">
            <div>
              <p className="text-xs text-muted">Valor de avalúo</p>
              <p className="text-2xl font-bold text-foreground">{formatMXN(p.valorAvaluo)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Préstamo sugerido</p>
              <p className="text-lg font-semibold text-primary">{formatMXN(p.montoPrestamoSugerido)}</p>
            </div>
            {/* Ubicación / pin */}
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted">Ubicación de resguardo</p>
              <p className="text-sm font-medium text-foreground">{p.ubicacionResguardo ?? "Sin asignar"}</p>
              {p.resguardo.mapsUrl && (
                <a href={p.resguardo.mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-1 inline-flex text-xs font-medium text-info underline-offset-2 hover:underline">
                  📍 Ver en el mapa →
                </a>
              )}
              <form action={actualizarResguardo.bind(null, p.id)} className="mt-3 space-y-2">
                <select name="tipoUbicacion" defaultValue={p.resguardo.tipo} className={campoCls}>
                  <option value="Matriz">📍 Matriz</option>
                  <option value="Externa">📍 Externa / otra sucursal</option>
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <input name="calle" defaultValue={p.resguardo.calle ?? ""} placeholder="Calle" className={`col-span-2 ${campoCls}`} />
                  <input name="numero" defaultValue={p.resguardo.numero ?? ""} placeholder="Número" className={campoCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input name="colonia" defaultValue={p.resguardo.colonia ?? ""} placeholder="Colonia" className={campoCls} />
                  <input name="ciudad" defaultValue={p.resguardo.ciudad ?? ""} placeholder="Ciudad" className={campoCls} />
                </div>
                <input name="cp" defaultValue={p.resguardo.cp ?? ""} placeholder="Código postal" className={campoCls} />
                <input name="referencia" defaultValue={p.resguardo.referencia ?? ""} placeholder="Referencia (bóveda, estante, estacionamiento…)" className={campoCls} />
                <input name="mapsUrl" defaultValue={p.resguardo.mapsUrl ?? ""} placeholder="Link de Google Maps (opcional)" className={campoCls} />
                <ConfirmSubmit variante="secondary" confirmacion="¿Actualizar la ubicación?">Guardar ubicación</ConfirmSubmit>
              </form>
            </div>
          </div>
        </Card>
      </div>

      {esVehiculo && tieneFicha && (
        <Card className="mt-6">
          <CardHeader title="Ficha del vehículo" subtitle="Datos técnicos, factura y seguro" />
          <dl className="grid gap-4 p-5 sm:grid-cols-3">
            {fichaVehiculo.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-muted">{k}</dt>
                <dd className="mt-0.5 text-sm text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          {p.gpsUbicacion && (
            <div className="border-t border-border px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-muted">Ubicación del GPS</p>
              <a
                href={/^https?:\/\//.test(p.gpsUbicacion)
                  ? p.gpsUbicacion
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.gpsUbicacion)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex text-sm font-medium text-info underline-offset-2 hover:underline"
              >
                📍 {p.gpsUbicacion} →
              </a>
            </div>
          )}
          {p.danios && (
            <div className="border-t border-border px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-muted">Daños visibles</p>
              <p className="mt-1 text-sm text-foreground">{p.danios}</p>
            </div>
          )}
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader title="Detalles" />
        <dl className="grid gap-4 p-5 sm:grid-cols-3">
          {datos.filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-muted">{k}</dt>
              <dd className="mt-0.5 text-sm text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        {p.notas && (
          <div className="border-t border-border px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-muted">Notas</p>
            <p className="mt-1 text-sm text-foreground">{p.notas}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
