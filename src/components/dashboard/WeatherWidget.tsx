"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  MapPin,
  RefreshCw,
  Search,
  Sprout,
  Sun,
  Wind,
} from "lucide-react";
import { HONDURAS_DEPARTMENTS, type AgroClimateData } from "@/lib/agro-climate";

function WeatherGlyph({ code }: { code: number }) {
  if (code === 0) return <Sun size={15} className="text-amber-300" />;
  if (code >= 51) return <CloudRain size={15} className="text-blue-300" />;
  return <CloudSun size={15} className="text-amber-300" />;
}

function formatObservedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "actualización reciente";
  return new Intl.DateTimeFormat("es-HN", { hour: "numeric", minute: "2-digit" }).format(date);
}

export default function WeatherWidget() {
  const [selectedKey, setSelectedKey] = useState("francisco-morazan");
  const [data, setData] = useState<AgroClimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/agro-climate?department=${encodeURIComponent(selectedKey)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as AgroClimateData & { message?: string };
        if (!response.ok) throw new Error(payload.message ?? "No se pudo consultar el clima actual.");
        return payload;
      })
      .then((payload) => {
        setData(payload);
        setError("");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setData(null);
        setError(cause instanceof Error ? cause.message : "No se pudo consultar el clima actual.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshToken, selectedKey]);

  const selectedLocation = HONDURAS_DEPARTMENTS.find((item) => item.key === selectedKey) ?? HONDURAS_DEPARTMENTS[0];
  return (
    <div className="rounded-xl border border-white/10 bg-[#1E1E1E] p-4 text-white shadow-sm" aria-busy={loading}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-sm text-white">Clima y suelo en tiempo real</h2>
            <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[9px] font-medium text-emerald-200">
              Open-Meteo · modelo actualizado
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-body text-white/45">
            <MapPin size={11} /> {data?.location.department ?? selectedLocation.department} · {data?.location.region ?? selectedLocation.region}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/6 px-2 py-1.5 sm:w-auto">
          <Search size={12} className="text-white/35" />
          <select
            value={selectedKey}
            onChange={(event) => {
              setLoading(true);
              setError("");
              setSelectedKey(event.target.value);
            }}
            className="min-w-0 flex-1 bg-transparent text-xs font-body text-white outline-none sm:w-[190px] [&>option]:bg-[#1E1E1E]"
            aria-label="Seleccionar departamento de Honduras"
          >
            {HONDURAS_DEPARTMENTS.map((location) => (
              <option key={location.key} value={location.key}>
                {location.department} · {location.city}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              setRefreshToken((current) => current + 1);
            }}
            disabled={loading}
            className="rounded-md p-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Actualizar clima y suelo"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-xs text-red-100" role="alert">
          <div className="flex items-center gap-2 font-medium"><AlertTriangle size={14} /> Datos temporalmente no disponibles</div>
          <p className="mt-1 text-red-100/70">{error}</p>
        </div>
      ) : loading && !data ? (
        <div className="flex min-h-52 items-center justify-center text-xs text-white/55">
          <RefreshCw size={16} className="mr-2 animate-spin" /> Consultando modelo meteorológico…
        </div>
      ) : data ? (
        <>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="flex min-w-0 items-end gap-3">
              <span className="font-heading text-4xl leading-none text-white">{data.weather.temperature}°</span>
              <div className="min-w-0 pb-1">
                <p className="truncate text-sm font-medium-body text-white/90">{data.location.city}</p>
                <p className="truncate text-xs font-body text-white/45">{data.weather.condition}</p>
              </div>
            </div>
            <div className="rounded-lg bg-white/6 px-3 py-2 text-right">
              <p className="text-[10px] font-body text-white/45">Riesgo agrícola</p>
              <p className="text-xs font-heading text-[var(--accent)]">{data.agriculturalRisk}</p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { icon: Droplets, label: "Humedad", value: `${data.weather.humidity}%` },
              { icon: Wind, label: "Viento", value: `${data.weather.windSpeed} km/h` },
              { icon: CloudRain, label: "Prob. lluvia", value: `${data.weather.precipitationProbability}%` },
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
              <WeatherGlyph code={data.weather.weatherCode} />
              <p className="text-xs font-heading text-white/85">Recomendación de campo</p>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-white/55">{data.recommendation}</p>
          </div>

          <div className="rounded-lg border border-lime-300/15 bg-lime-300/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sprout size={15} className="text-[var(--accent)]" />
                <p className="text-xs font-heading text-white/85">Análisis hídrico del suelo</p>
              </div>
              <span className="text-[10px] text-[var(--accent)]">{data.soil.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
              <div><p className="text-white/40">Superficie 0–1 cm</p><p className="mt-0.5 font-heading text-white">{data.soil.moistureSurface}%</p></div>
              <div><p className="text-white/40">Zona 3–9 cm</p><p className="mt-0.5 font-heading text-white">{data.soil.moistureRootZone}%</p></div>
              <div><p className="text-white/40">ET₀ del día</p><p className="mt-0.5 font-heading text-white">{data.soil.evapotranspiration} mm</p></div>
              <div><p className="text-white/40">Balance hídrico</p><p className="mt-0.5 font-heading text-white">{data.soil.waterBalance > 0 ? "+" : ""}{data.soil.waterBalance} mm</p></div>
            </div>
            <p className="mt-2 flex items-start gap-1.5 border-t border-white/10 pt-2 text-[9px] leading-3 text-white/35">
              <Gauge size={11} className="mt-0.5 shrink-0" /> {data.modelNotice}
            </p>
          </div>

          <p className="mt-2 text-right text-[9px] text-white/30">
            Actualizado {formatObservedAt(data.observedAt)} · Fuente: Open-Meteo
          </p>
        </>
      ) : null}
    </div>
  );
}
