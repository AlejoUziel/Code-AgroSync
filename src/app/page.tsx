"use client";

import AppShell from "@/components/layout/AppShell";
import KpiCard from "@/components/dashboard/KpiCard";
import AlertsWidget from "@/components/dashboard/AlertsWidget";
import HarvestChart from "@/components/dashboard/HarvestChart";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { MapPinned, Sprout, Tractor, UsersRound } from "lucide-react";

const kpis = [
  {
    label: "Parcelas Activas",
    value: "47",
    unit: "parcelas",
    change: "+3 este mes",
    trend: "up" as const,
    icon: MapPinned,
    detail: "18 en Francisco Morazan y 12 en Olancho",
    progress: 78,
    tone: "green" as const,
  },
  {
    label: "Cultivos en Proceso",
    value: "128",
    unit: "cultivos",
    change: "+12% vs año anterior",
    trend: "up" as const,
    icon: Sprout,
    detail: "Maiz, cafe y frijol lideran la semana",
    progress: 66,
    tone: "blue" as const,
  },
  {
    label: "Cosecha Este Mes",
    value: "3,842",
    unit: "toneladas",
    change: "+8.3% vs meta",
    trend: "up" as const,
    icon: Tractor,
    detail: "Pico operativo previsto en 9 dias",
    progress: 83,
    tone: "amber" as const,
  },
  {
    label: "Empleados Activos",
    value: "214",
    unit: "empleados",
    change: "12 en campo hoy",
    trend: "neutral" as const,
    icon: UsersRound,
    detail: "Cuadrillas activas en 5 departamentos",
    progress: 58,
    tone: "dark" as const,
  },
];

export default function DashboardPage() {
  const hondurasDate = new Intl.DateTimeFormat("es-HN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Tegucigalpa",
  }).format(new Date());

  return (
    <AppShell
      pageTitle="Dashboard"
      pageSubtitle={`Resumen operativo Honduras - ${hondurasDate}`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={i} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <HarvestChart />
          </div>
          <div className="flex flex-col gap-4">
            <WeatherWidget />
            <AlertsWidget />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
