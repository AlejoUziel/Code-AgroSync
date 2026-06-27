"use client";

import { useMemo, useState } from "react";
import {
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Search,
  Sun,
  ThermometerSun,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type WeatherZone = {
  key: string;
  city: string;
  department: string;
  region: string;
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  rain: number;
  risk: string;
  recommendation: string;
  icon: LucideIcon;
  tone: "sun" | "rain" | "warm";
};

const zones: WeatherZone[] = [
  {
    key: "tegucigalpa",
    city: "Tegucigalpa",
    department: "Francisco Morazan",
    region: "Centro",
    temp: 29,
    condition: "Parcialmente soleado",
    humidity: 72,
    wind: 13,
    rain: 24,
    risk: "Riego moderado",
    recommendation: "Revisar humedad antes de fertilizar en laderas.",
    icon: CloudSun,
    tone: "sun",
  },
  {
    key: "san-pedro-sula",
    city: "San Pedro Sula",
    department: "Cortes",
    region: "Norte",
    temp: 32,
    condition: "Calido y humedo",
    humidity: 78,
    wind: 10,
    rain: 34,
    risk: "Vigilancia de hongos",
    recommendation: "Ventilar cultivos sensibles y monitorear manchas foliares.",
    icon: CloudSun,
    tone: "warm",
  },
  {
    key: "jutigalpa",
    city: "Juticalpa",
    department: "Olancho",
    region: "Oriente",
    temp: 31,
    condition: "Soleado",
    humidity: 61,
    wind: 16,
    rain: 12,
    risk: "Riego preventivo",
    recommendation: "Priorizar riego temprano en maiz y sorgo.",
    icon: Sun,
    tone: "sun",
  },
  {
    key: "comayagua",
    city: "Comayagua",
    department: "Comayagua",
    region: "Centro",
    temp: 27,
    condition: "Lluvia probable",
    humidity: 81,
    wind: 9,
    rain: 46,
    risk: "Ajustar fertilizacion",
    recommendation: "Evitar aplicacion antes de lluvia fuerte.",
    icon: CloudRain,
    tone: "rain",
  },
  {
    key: "choluteca",
    city: "Choluteca",
    department: "Choluteca",
    region: "Sur",
    temp: 34,
    condition: "Calor alto",
    humidity: 55,
    wind: 18,
    rain: 8,
    risk: "Estres hidrico",
    recommendation: "Incrementar monitoreo de riego en horas frescas.",
    icon: ThermometerSun,
    tone: "warm",
  },
  {
    key: "la-ceiba",
    city: "La Ceiba",
    department: "Atlantida",
    region: "Litoral Atlantico",
    temp: 30,
    condition: "Nubosidad activa",
    humidity: 84,
    wind: 12,
    rain: 52,
    risk: "Lluvia en parcelas",
    recommendation: "Revisar drenajes y programar cosecha con margen.",
    icon: CloudRain,
    tone: "rain",
  },
  {
    key: "santa-rosa",
    city: "Santa Rosa de Copan",
    department: "Copan",
    region: "Occidente",
    temp: 24,
    condition: "Fresco con nubes",
    humidity: 76,
    wind: 8,
    rain: 38,
    risk: "Bueno para cafe",
    recommendation: "Condicion favorable para monitoreo de cafe.",
    icon: CloudSun,
    tone: "rain",
  },
];

const toneClass = {
  sun: "text-amber-400",
  rain: "text-blue-300",
  warm: "text-orange-400",
};

export default function WeatherWidget() {
  const [selectedKey, setSelectedKey] = useState("tegucigalpa");
  const selected = zones.find((zone) => zone.key === selectedKey) ?? zones[0];
  const nearby = useMemo(() => zones.filter((zone) => zone.key !== selected.key).slice(0, 4), [selected.key]);
  const WeatherIcon = selected.icon;

  return (
    <div className="rounded-xl border border-white/10 bg-[#1E1E1E] p-4 text-white shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm text-white">Clima agricola</h2>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-body text-white/45">
            <MapPin size={11} /> {selected.department} · {selected.region}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/6 px-2 py-1.5">
          <Search size={12} className="text-white/35" />
          <select
            value={selectedKey}
            onChange={(event) => setSelectedKey(event.target.value)}
            className="w-[170px] bg-transparent text-xs font-body text-white outline-none [&>option]:bg-[#1E1E1E]"
            aria-label="Seleccionar ciudad o departamento"
          >
            {zones.map((zone) => (
              <option key={zone.key} value={zone.key}>
                {zone.city} · {zone.department}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-end gap-3">
          <span className="font-heading text-4xl leading-none text-white">{selected.temp}°</span>
          <div className="min-w-0 pb-1">
            <p className="truncate text-sm font-medium-body text-white/90">{selected.city}</p>
            <p className="truncate text-xs font-body text-white/45">{selected.condition}</p>
          </div>
        </div>
        <div className="rounded-lg bg-white/6 px-3 py-2 text-right">
          <p className="text-[10px] font-body text-white/45">Riesgo agricola</p>
          <p className="text-xs font-heading text-[var(--accent)]">{selected.risk}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { icon: Droplets, label: "Humedad", value: `${selected.humidity}%` },
          { icon: Wind, label: "Viento", value: `${selected.wind} km/h` },
          { icon: CloudRain, label: "Lluvia", value: `${selected.rain}%` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white/6 p-2 text-center ring-1 ring-white/5">
            <stat.icon size={14} strokeWidth={2.2} className="mx-auto mb-1 text-[var(--accent)]" />
            <p className="text-xs font-heading text-white">{stat.value}</p>
            <p className="text-[10px] font-body text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2">
          <WeatherIcon size={15} className={toneClass[selected.tone]} />
          <p className="text-xs font-heading text-white/85">Recomendacion de campo</p>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-white/48">{selected.recommendation}</p>
      </div>

      <div className="border-t border-white/10 pt-3">
        <div className="grid grid-cols-2 gap-2">
          {nearby.map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedKey(item.key)}
              className="rounded-lg bg-white/5 px-2 py-2 text-left transition-colors hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-body text-white/55">{item.department}</span>
                <item.icon size={13} className={cn(toneClass[item.tone])} />
              </div>
              <div className="mt-1 flex items-end justify-between gap-2">
                <span className="text-sm font-heading text-white">{item.temp}°</span>
                <span className="text-[10px] font-body text-blue-200">{item.rain}% lluvia</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
