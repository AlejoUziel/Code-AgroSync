"use client";

import AppShell from "@/components/layout/AppShell";
import KpiCard from "@/components/dashboard/KpiCard";
import AlertsWidget from "@/components/dashboard/AlertsWidget";
import HarvestChart from "@/components/dashboard/HarvestChart";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { Sprout, MapPin, Package, Users, TrendingUp } from "lucide-react";

const kpis = [
  {
    label: "Parcelas Activas",
    value: "47",
    unit: "parcelas",
    change: "+3 este mes",
    trend: "up" as const,
    icon: <MapPin size={18} className="text-[var(--primary)]" />,
    color: "green" as const,
  },
  {
    label: "Cultivos en Proceso",
    value: "128",
    unit: "cultivos",
    change: "+12% vs año anterior",
    trend: "up" as const,
    icon: <Sprout size={18} className="text-[var(--primary)]" />,
    color: "green" as const,
  },
  {
    label: "Cosecha Este Mes",
    value: "3,842",
    unit: "toneladas",
    change: "+8.3% vs meta",
    trend: "up" as const,
    icon: <Package size={18} className="text-[var(--primary)]" />,
    color: "green" as const,
  },
  {
    label: "Empleados Activos",
    value: "214",
    unit: "empleados",
    change: "12 en campo hoy",
    trend: "neutral" as const,
    icon: <Users size={18} className="text-[var(--primary)]" />,
    color: "neutral" as const,
  },
];

export default function DashboardPage() {
  return (
    <AppShell
      pageTitle="Dashboard"
      pageSubtitle="Resumen operativo — Hoy, 6 de junio 2026"
    >
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={i} {...kpi} />
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Harvest chart - 2 cols */}
          <div className="lg:col-span-2">
            <HarvestChart />
          </div>
          {/* Weather + alerts */}
          <div className="flex flex-col gap-4">
            <WeatherWidget />
            <AlertsWidget />
          </div>
        </div>

        {/* Bottom row */}
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
