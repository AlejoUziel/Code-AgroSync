"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Rectangle, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { HONDURAS_BOUNDS, HONDURAS_CENTER, isInsideHonduras } from "@/lib/resource-definitions";

type ParcelaLocationPickerProps = {
  lat: number;
  lng: number;
  onSelect: (lat: number, lng: number) => void;
};

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      if (!isInsideHonduras(lat, lng)) return;
      onSelect(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    },
  });
  return null;
}

function MapSizeFix() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    const animationFrame = window.requestAnimationFrame(() => map.invalidateSize());
    const timer = window.setTimeout(() => map.invalidateSize(), 180);

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timer);
    };
  }, [map]);
  return null;
}

function MapCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (isInsideHonduras(lat, lng)) map.setView([lat, lng], Math.max(map.getZoom(), 8));
  }, [lat, lng, map]);
  return null;
}

export default function ParcelaLocationPicker({ lat, lng, onSelect }: ParcelaLocationPickerProps) {
  const selectedLat = Number.isFinite(lat) && isInsideHonduras(lat, lng) ? lat : HONDURAS_CENTER[0];
  const selectedLng = Number.isFinite(lng) && isInsideHonduras(lat, lng) ? lng : HONDURAS_CENTER[1];

  return (
    <div className="sm:col-span-2 min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2">
        <span className="text-xs font-medium-body text-[#1E1E1E]">Selecciona la ubicacion en el mapa de Honduras</span>
        <span className="text-[11px] text-[#6B7280]">
          Lat {selectedLat.toFixed(6)} · Lng {selectedLng.toFixed(6)}
        </span>
      </div>
      <div className="h-[220px] min-w-0 w-full max-w-full overflow-hidden sm:h-[260px]">
        <MapContainer
          center={[selectedLat, selectedLng]}
          zoom={8}
          minZoom={7}
          maxBounds={HONDURAS_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
          className="h-full w-full max-w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Rectangle bounds={HONDURAS_BOUNDS} pathOptions={{ color: "#8EBF24", fillOpacity: 0.03, weight: 1 }} />
          <CircleMarker
            center={[selectedLat, selectedLng]}
            radius={8}
            pathOptions={{ color: "#ffffff", fillColor: "#8EBF24", fillOpacity: 1, weight: 3 }}
          />
          <MapClickHandler onSelect={onSelect} />
          <MapCenter lat={selectedLat} lng={selectedLng} />
          <MapSizeFix />
        </MapContainer>
      </div>
    </div>
  );
}
