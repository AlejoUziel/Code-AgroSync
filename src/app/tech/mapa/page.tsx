"use client";

import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import { useCrudResource } from "@/hooks/useCrudResource";
import { polygonAround, type ResourceRecord } from "@/lib/resource-definitions";
import type { ParcelaGeo } from "@/components/maps/ParcelasMap";

const ParcelasMap = dynamic(() => import("@/components/maps/ParcelasMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-[#6B7280]">Cargando mapa de Honduras...</div>,
});

function toGeo(record: ResourceRecord): ParcelaGeo {
  const lat = Number(record.lat);
  const lng = Number(record.lng);
  return {
    id: record.id,
    nombre: String(record.nombre ?? ""),
    cultivo: String(record.cultivo ?? "Sin cultivo"),
    estado: String(record.estado ?? "Activa"),
    centro: [lat, lng],
    poligono: polygonAround(lat, lng),
    hectareas: Number(record.hectareas ?? 0),
  };
}

export default function MapaPage() {
  const { records } = useCrudResource("parcelas");

  return (
    <AppShell pageTitle="Mapa Interactivo Agricola" pageSubtitle="Tecnologico · Honduras">
      <div className="bg-card rounded-xl border border-[var(--border)] overflow-hidden" style={{ height: "calc(100vh - 170px)", minHeight: 520 }}>
        <ParcelasMap parcelas={records.map(toGeo)} />
      </div>
    </AppShell>
  );
}
