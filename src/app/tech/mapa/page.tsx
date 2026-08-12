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
      <div className="h-[calc(100dvh-9rem)] min-h-[22rem] overflow-hidden rounded-xl border border-[var(--border)] bg-card sm:h-[calc(100dvh-10.625rem)] sm:min-h-[32.5rem]">
        <ParcelasMap parcelas={records.map(toGeo)} />
      </div>
    </AppShell>
  );
}
