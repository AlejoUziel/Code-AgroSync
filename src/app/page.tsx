"use client";

import AppShell from "@/components/layout/AppShell";
import DashboardKpis from "@/components/dashboard/DashboardKpis";
import AlertsWidget from "@/components/dashboard/AlertsWidget";
import HarvestChart from "@/components/dashboard/HarvestChart";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

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
        <ErrorBoundary>
          <DashboardKpis />
        </ErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ErrorBoundary>
              <HarvestChart />
            </ErrorBoundary>
          </div>
          <div className="flex flex-col gap-4">
            <ErrorBoundary>
              <WeatherWidget />
            </ErrorBoundary>
            <ErrorBoundary>
              <AlertsWidget />
            </ErrorBoundary>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ErrorBoundary>
              <RecentActivity />
            </ErrorBoundary>
          </div>
          <div>
            <ErrorBoundary>
              <QuickActions />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
