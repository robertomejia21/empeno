"use client";

// Selector de ubicación con mapa (OpenStreetMap + Leaflet, sin API key).
// El usuario escribe una referencia, busca la dirección o hace clic en el mapa
// para colocar el pin. Emite un texto combinado: "referencia · 📍 liga de Maps".
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LMap, Marker as LMarker, DivIcon } from "leaflet";

const MEXICALI: [number, number] = [32.6278, -115.4545];

const PIN_SVG =
  '<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M14 0C6.3 0 0 6.3 0 14c0 9.5 12.2 24.2 12.7 24.8a1.7 1.7 0 0 0 2.6 0C15.8 38.2 28 23.5 28 14 28 6.3 21.7 0 14 0z" fill="#d96a10"/>' +
  '<circle cx="14" cy="14" r="6" fill="#fff"/></svg>';

export function MapaResguardo({ onChange }: { onChange: (texto: string) => void }) {
  const [referencia, setReferencia] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const contRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markerRef = useRef<LMarker | null>(null);
  const iconRef = useRef<DivIcon | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);

  const inputCls =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  // Combina referencia + pin y avisa al formulario contenedor.
  useEffect(() => {
    const link = pin
      ? `📍 https://www.google.com/maps?q=${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`
      : null;
    onChange([referencia.trim() || null, link].filter(Boolean).join(" · "));
    // onChange es estable (setState del padre); no lo incluimos para no re-disparar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencia, pin]);

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
      map.on("click", (e) => setPin({ lat: e.latlng.lat, lng: e.latlng.lng }));
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
      <label className="block text-sm font-medium text-foreground">Ubicación de resguardo</label>

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
          className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
        >
          {buscando ? "Buscando…" : "🔎 Buscar"}
        </button>
      </div>

      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="text-sm font-medium text-info underline-offset-2 hover:underline"
        >
          🗺️ Colocar el pin en el mapa
        </button>
      )}

      {abierto && (
        <>
          <div
            ref={contRef}
            className="h-64 w-full overflow-hidden rounded-xl border border-border"
            aria-label="Mapa para colocar el pin de resguardo"
          />
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              {pin
                ? `📍 Pin en ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
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

      {msg && <p className="text-xs text-warning">{msg}</p>}
    </div>
  );
}
