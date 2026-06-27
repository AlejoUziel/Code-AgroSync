"use client";

import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { HONDURAS_BOUNDS, HONDURAS_CENTER } from "@/lib/resource-definitions";

export interface ParcelaGeo {
  id: string;
  nombre: string;
  cultivo: string;
  estado: string;
  centro: LatLngExpression;
  poligono: LatLngExpression[];
  hectareas: number;
}

const estadoColor: Record<string, string> = {
  Activa: "#8EBF24",
  Alerta: "#F59E0B",
  "En Descanso": "#9CA3AF",
  "En Preparacion": "#3B82F6",
};

function FitBounds({ parcelas }: { parcelas: ParcelaGeo[] }) {
  const map = useMap();
  const points = parcelas.flatMap((p) => p.poligono);
  if (points.length > 0) {
    setTimeout(() => map.fitBounds(points as [number, number][], { padding: [28, 28] }), 0);
  } else {
    setTimeout(() => map.fitBounds(HONDURAS_BOUNDS, { padding: [24, 24] }), 0);
  }
  return null;
}

export default function ParcelasMap({ parcelas }: { parcelas: ParcelaGeo[] }) {
  return (
    <MapContainer
      center={HONDURAS_CENTER}
      zoom={8}
      minZoom={7}
      maxBounds={HONDURAS_BOUNDS}
      maxBoundsViscosity={1}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds parcelas={parcelas} />
      {parcelas.map((parcela) => {
        const color = estadoColor[parcela.estado] ?? "#8EBF24";
        return (
          <div key={parcela.id}>
            <Polygon
              positions={parcela.poligono}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.22, weight: 2 }}
            >
              <Popup>
                <div className="space-y-1">
                  <strong>{parcela.nombre}</strong>
                  <p>{parcela.cultivo} · {parcela.estado}</p>
                  <p>{parcela.hectareas} ha</p>
                </div>
              </Popup>
            </Polygon>
            <CircleMarker
              center={parcela.centro}
              radius={6}
              pathOptions={{ color: "#ffffff", fillColor: color, fillOpacity: 1, weight: 2 }}
            />
          </div>
        );
      })}
    </MapContainer>
  );
}
