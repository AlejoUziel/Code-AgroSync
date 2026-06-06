"use client";

import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from "lucide-react";

const forecast = [
  { day: "Lun", icon: <Sun size={14} className="text-amber-400" />, high: 28, low: 17 },
  { day: "Mar", icon: <Cloud size={14} className="text-gray-400" />, high: 25, low: 15 },
  { day: "Mié", icon: <CloudRain size={14} className="text-blue-400" />, high: 22, low: 14 },
  { day: "Jue", icon: <Sun size={14} className="text-amber-400" />, high: 30, low: 18 },
  { day: "Vie", icon: <Sun size={14} className="text-amber-400" />, high: 31, low: 19 },
];

export default function WeatherWidget() {
  return (
    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-4 text-white border border-white/6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-heading text-sm text-white/90">Clima Agrícola</h2>
          <p className="font-body text-[11px] text-white/40 mt-0.5">
            Región Central · Hoy
          </p>
        </div>
        <Sun size={20} className="text-amber-400" />
      </div>

      {/* Main temp */}
      <div className="flex items-end gap-3 mb-4">
        <span className="font-heading text-4xl text-white">28°</span>
        <div className="mb-1">
          <p className="font-medium-body text-sm text-white/80">Soleado</p>
          <p className="font-body text-xs text-white/40">Máx 31° / Mín 17°</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: <Droplets size={12} className="text-blue-400" />, label: "Humedad", value: "68%" },
          { icon: <Wind size={12} className="text-accent" />, label: "Viento", value: "14 km/h" },
          { icon: <Thermometer size={12} className="text-red-400" />, label: "Sensación", value: "30°" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card/5 rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <p className="font-heading text-xs text-white">{stat.value}</p>
            <p className="font-body text-[10px] text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Forecast */}
      <div className="flex justify-between border-t border-white/6 pt-3">
        {forecast.map((f) => (
          <div key={f.day} className="flex flex-col items-center gap-1">
            <span className="font-body text-[10px] text-white/40">{f.day}</span>
            {f.icon}
            <span className="font-medium-body text-xs text-white">{f.high}°</span>
            <span className="font-body text-[10px] text-white/30">{f.low}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}

