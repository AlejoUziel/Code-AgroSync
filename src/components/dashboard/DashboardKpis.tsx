"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPinned, Sprout, Tractor, UsersRound } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import type { ResourceRecord } from "@/lib/resource-definitions";
import type { Usuario } from "@/types/models";

type ResourceResponse = {
  items?: ResourceRecord[];
  dbConfigured?: boolean;
};

type DirectoryResponse = {
  items?: Usuario[];
  dbConfigured?: boolean;
};

type DashboardData = {
  parcelas: ResourceRecord[];
  cultivos: ResourceRecord[];
  cosechas: ResourceRecord[];
  empleados: ResourceRecord[];
  usuarios: Usuario[];
};

const emptyData: DashboardData = {
  parcelas: [],
  cultivos: [],
  cosechas: [],
  empleados: [],
  usuarios: [],
};

function numberFormat(value: number, decimals = 0) {
  return new Intl.NumberFormat("es-HN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

async function loadResource(resource: string) {
  try {
    const response = await fetch(`/api/resources/${resource}`, { cache: "no-store" });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return [];
    const data = (await response.json()) as ResourceResponse;
    return data.items ?? [];
  } catch {
    return [];
  }
}

async function loadUsers() {
  try {
    const response = await fetch("/api/admin-directory?tab=usuarios&q=", { cache: "no-store" });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return [];
    const data = (await response.json()) as DirectoryResponse;
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default function DashboardKpis() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboardData() {
      setLoading(true);
      try {
        const [parcelas, cultivos, cosechas, empleados, usuarios] = await Promise.all([
          loadResource("parcelas"),
          loadResource("cultivos"),
          loadResource("cosechas"),
          loadResource("empleados"),
          loadUsers(),
        ]);

        if (!controller.signal.aborted) {
          setData({ parcelas, cultivos, cosechas, empleados, usuarios });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDashboardData();
    return () => controller.abort();
  }, []);

  const kpis = useMemo(() => {
    const activeParcelas = data.parcelas.filter((item) => String(item.estado ?? "") === "Activa").length;
    const activeCultivos = data.cultivos.filter((item) => ["Nuevo", "En Progreso", "Alerta"].includes(String(item.estado ?? ""))).length;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyHarvest = data.cosechas
      .filter((item) => String(item.fecha ?? "").startsWith(currentMonth))
      .reduce((sum, item) => sum + Number(item.toneladas ?? 0), 0);
    const activeEmployees = data.empleados.filter((item) => String(item.estado ?? "") === "Activo").length;
    const activeUsers = data.usuarios.filter((item) => item.estado === "Activo").length;
    const totalHectareas = data.parcelas.reduce((sum, item) => sum + Number(item.hectareas ?? 0), 0);
    const totalHarvest = data.cosechas.reduce((sum, item) => sum + Number(item.toneladas ?? 0), 0);

    return [
      {
        label: "Parcelas Activas",
        value: loading ? "..." : numberFormat(activeParcelas),
        unit: "parcelas",
        change: loading ? "cargando" : `${percent(activeParcelas, data.parcelas.length)}% activas`,
        trend: "up" as const,
        icon: MapPinned,
        detail: loading ? "Consultando MySQL" : `${numberFormat(totalHectareas, 1)} ha registradas`,
        progress: percent(activeParcelas, data.parcelas.length),
        tone: "green" as const,
      },
      {
        label: "Cultivos en Proceso",
        value: loading ? "..." : numberFormat(activeCultivos),
        unit: "cultivos",
        change: loading ? "cargando" : `${data.cultivos.length} total`,
        trend: "up" as const,
        icon: Sprout,
        detail: loading ? "Consultando cultivos" : `${data.cultivos.filter((item) => String(item.estado ?? "") === "Alerta").length} en alerta`,
        progress: percent(activeCultivos, data.cultivos.length),
        tone: "blue" as const,
      },
      {
        label: "Cosecha Este Mes",
        value: loading ? "..." : numberFormat(monthlyHarvest, monthlyHarvest % 1 ? 1 : 0),
        unit: "toneladas",
        change: loading ? "cargando" : `${numberFormat(totalHarvest, 1)} t historico`,
        trend: "up" as const,
        icon: Tractor,
        detail: loading ? "Consultando cosechas" : `${data.cosechas.length} registros de cosecha`,
        progress: Math.min(100, Math.round(monthlyHarvest || totalHarvest || 0)),
        tone: "amber" as const,
      },
      {
        label: "Empleados Activos",
        value: loading ? "..." : numberFormat(activeEmployees),
        unit: "empleados",
        change: loading ? "cargando" : `${activeUsers} usuarios activos`,
        trend: "neutral" as const,
        icon: UsersRound,
        detail: loading ? "Consultando RRHH" : `${data.empleados.length} empleados registrados`,
        progress: percent(activeEmployees, data.empleados.length),
        tone: "dark" as const,
      },
    ];
  }, [data, loading]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
