"use client";

import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import { CrudModule } from "@/components/crud/CrudModule";
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

export default function ParcelasPage() {
  const { records } = useCrudResource("parcelas");

  return (
    <AppShell pageTitle="Gestion de Parcelas" pageSubtitle="Operativo · Geolocalizacion exclusiva de Honduras">
      <div className="space-y-5">
        <div className="bg-card rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-3 sm:px-4">
            <div>
              <h2 className="font-heading text-sm text-[#1E1E1E]">Mapa de Parcelas en Honduras</h2>
              <p className="font-body text-xs text-[#9CA3AF]">Las coordenadas fuera de Honduras se rechazan al guardar.</p>
            </div>
          </div>
          <div className="h-[280px] sm:h-[380px]">
            <ParcelasMap parcelas={records.map(toGeo)} />
          </div>
        </div>
        <CrudModule resourceKey="parcelas" />
      </div>
    </AppShell>
  );
}
