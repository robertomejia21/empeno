"use client";

// Selector de ubicación con mapa (OpenStreetMap + Leaflet, sin API key).
// El usuario escribe una referencia, busca la dirección o hace clic en el mapa
// para colocar el pin. Emite un texto combinado: "referencia · 📍 liga de Maps".
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LMap, Marker as LMarker, DivIcon } from "leaflet";
import { Map as MapIcon, MapPin, Search, Store, TriangleAlert, Warehouse } from "lucide-react";
import { SUCURSAL } from "@/lib/negocio";

const MEXICALI: [number, number] = [SUCURSAL.lat, SUCURSAL.lng];

// Ubicaciones fijas del negocio, para no tener que buscarlas cada vez.
// Este componente es de uso interno (requiere sesión) — nunca se muestra al cliente.
const LUGARES_FIJOS = [
  { label: "Casa de empeño", icono: Store, texto: "Casa de empeño", url: "https://maps.app.goo.gl/2XGvvR3KLJy9KSfR7" },
  { label: "Resguardo (bóveda)", icono: Warehouse, texto: "Resguardo (bóveda)", url: "https://maps.app.goo.gl/h2XnxGvWz9Wv9zep8" },
] as const;

// Los marcadores de Leaflet son HTML en texto (no JSX): se pintan con los tokens
// del tema vía `style` para que sigan la paleta (y el modo oscuro).
const PIN_PATH =
  '<path d="M14 0C6.3 0 0 6.3 0 14c0 9.5 12.2 24.2 12.7 24.8a1.7 1.7 0 0 0 2.6 0C15.8 38.2 28 23.5 28 14 28 6.3 21.7 0 14 0z"';

const PIN_SVG =
  '<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">' +
  PIN_PATH + ' style="fill:var(--primary)"/>' +
  '<circle cx="14" cy="14" r="6" style="fill:var(--primary-fg)"/></svg>';

// Marcador de nuestra sucursal (matriz): naranja profundo con el glifo "store" de lucide.
const SUCURSAL_SVG =
  '<svg width="30" height="42" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">' +
  PIN_PATH + ' style="fill:var(--brand)"/>' +
  '<svg x="7" y="7" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--brand-fg)">' +
  '<path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/>' +
  '<path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/>' +
  '<path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/>' +
  '</svg></svg>';

export function MapaResguardo({
  onChange,
  label = "Ubicación de resguardo",
}: {
  onChange: (texto: string) => void;
  label?: string;
}) {
  const [referencia, setReferencia] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // Liga fija (Casa de empeño / Resguardo) elegida con un clic, en vez de un pin en el mapa.
  const [lugarFijoUrl, setLugarFijoUrl] = useState<string | null>(null);

  const contRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markerRef = useRef<LMarker | null>(null);
  const iconRef = useRef<DivIcon | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);

  const inputCls =
    "w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  // Combina referencia + (liga fija o pin) y avisa al formulario contenedor.
  useEffect(() => {
    const link = lugarFijoUrl
      ? `📍 ${lugarFijoUrl}`
      : pin
        ? `📍 https://www.google.com/maps?q=${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`
        : null;
    onChange([referencia.trim() || null, link].filter(Boolean).join(" · "));
    // onChange es estable (setState del padre); no lo incluimos para no re-disparar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencia, pin, lugarFijoUrl]);

  // Inicializa el mapa la primera vez que se abre.
  useEffect(() => {
    if (!abierto || mapRef.current) return;
    let cancelado = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !contRef.current || mapRef.current) return;
      LRef.current = L;
      iconRef.current = L.divIcon({
        className: "",
        html: PIN_SVG,
        iconSize: [28, 40],
        iconAnchor: [14, 40],
      });
      const map = L.map(contRef.current).setView(
        pin ? [pin.lat, pin.lng] : MEXICALI,
        pin ? 16 : 13
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      // Nuestra sucursal (matriz) siempre visible en el mapa.
      const sucursalIcon = L.divIcon({ className: "", html: SUCURSAL_SVG, iconSize: [30, 42], iconAnchor: [15, 42] });
      L.marker([SUCURSAL.lat, SUCURSAL.lng], { icon: sucursalIcon })
        .addTo(map)
        .bindTooltip(SUCURSAL.nombre, { direction: "top", offset: [0, -38] });
      map.on("click", (e) => { setLugarFijoUrl(null); setPin({ lat: e.latlng.lat, lng: e.latlng.lng }); });
      mapRef.current = map;
      if (pin) markerRef.current = L.marker([pin.lat, pin.lng], { icon: iconRef.current }).addTo(map);
      setTimeout(() => map.invalidateSize(), 60);
    })();
    return () => {
      cancelado = true;
    };
  }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mueve o crea el marcador cuando cambia el pin.
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !pin || !iconRef.current) return;
    if (markerRef.current) markerRef.current.setLatLng([pin.lat, pin.lng]);
    else markerRef.current = L.marker([pin.lat, pin.lng], { icon: iconRef.current }).addTo(map);
  }, [pin]);

  // Limpia el mapa al desmontar (p. ej. al cambiar de paso).
  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    },
    []
  );

  async function buscar() {
    if (!referencia.trim()) return;
    setBuscando(true);
    setMsg(null);
    setAbierto(true);
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=mx&q=" +
        encodeURIComponent(referencia);
      const r = await fetch(url, { headers: { "Accept-Language": "es" } });
      const data = (await r.json()) as Array<{ lat: string; lon: string }>;
      if (!data[0]) {
        setMsg("No se encontró la dirección. Coloca el pin manualmente en el mapa.");
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      setLugarFijoUrl(null);
      setPin({ lat, lng });
      setTimeout(() => mapRef.current?.setView([lat, lng], 16), 80);
    } catch {
      setMsg("No se pudo buscar. Coloca el pin manualmente en el mapa.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>

      <div className="flex flex-wrap gap-2">
        {LUGARES_FIJOS.map((l) => (
          <button
            key={l.url}
            type="button"
            onClick={() => {
              setReferencia(l.texto);
              setPin(null);
              setLugarFijoUrl(l.url);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              lugarFijoUrl === l.url ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-foreground hover:bg-surface-2"
            }`}
          >
            <l.icono className="h-4 w-4" aria-hidden />
            {l.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          onFocus={() => setAbierto(true)}
          placeholder="Dirección o referencia (Bóveda Caja 3, calle, colonia…)"
          className={inputCls}
        />
        <button
          type="button"
          onClick={buscar}
          disabled={buscando}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2 disabled:opacity-50"
        >
          {!buscando && <Search className="h-4 w-4" aria-hidden />}
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          <MapIcon className="h-4 w-4" aria-hidden /> Colocar el pin en el mapa
        </button>
      )}

      {abierto && (
        <>
          <div
            ref={contRef}
            className="h-64 w-full overflow-hidden rounded-xl border border-border sm:h-72 xl:h-80"
            aria-label="Mapa para colocar el pin de resguardo"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              {pin && <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />}
              {pin
                ? `Pin en ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
                : "Haz clic en el mapa para colocar el pin."}
            </span>
            {pin && (
              <button
                type="button"
                onClick={() => {
                  setPin(null);
                  markerRef.current?.remove();
                  markerRef.current = null;
                }}
                className="font-medium text-danger hover:underline"
              >
                Quitar pin
              </button>
            )}
          </div>
        </>
      )}

      {msg && (
        <p className="flex items-start gap-1.5 text-xs text-warning">
          <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden /> {msg}
        </p>
      )}
    </div>
  );
}
