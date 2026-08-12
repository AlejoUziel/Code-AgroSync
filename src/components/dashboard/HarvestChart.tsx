"use client";

import { useMemo } from "react";
import { Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useCrudResource } from "@/hooks/useCrudResource";
import { useSessionUser } from "@/hooks/useSessionUser";

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#1E1E1E] p-3 shadow-xl">
      <p className="mb-1 text-xs font-heading text-white/70">{label}</p>
      <p className="text-xs text-white">{Number(payload[0].value).toLocaleString("es-HN")} toneladas</p>
    </div>
  );
}

export default function HarvestChart() {
  const user = useSessionUser();
  const enabled = Boolean(user && (user.departamento === "Operativo" || user.departamento === "AdministradorIT"));
  const { records, loading, syncError } = useCrudResource("cosechas", enabled);
  const year = new Date().getFullYear();

  const data = useMemo(() => {
    const totals = months.map((mes) => ({ mes, toneladas: 0 }));
    records.forEach((record) => {
      const date = new Date(String(record.fecha ?? ""));
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) return;
      totals[date.getMonth()].toneladas += Number(record.toneladas ?? 0);
    });
    return totals.map((item) => ({ ...item, toneladas: Number(item.toneladas.toFixed(2)) }));
  }, [records, year]);

  const total = records.reduce((sum, record) => sum + Number(record.toneladas ?? 0), 0);
  const currentYearRecords = data.filter((item) => item.toneladas > 0).length;
  const average = records.length ? total / records.length : 0;

  return (
    <div className="pro-card h-full min-w-0 rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-sm text-[#1E1E1E]">Producción y cosecha</h2>
            <Badge className="border-0 bg-[var(--secondary)] px-2 py-0 text-[10px] text-[var(--primary)]">
              Datos registrados · {year}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs font-body text-[#9CA3AF]">Toneladas reales registradas por mes</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
          {[
            ["Total", `${total.toLocaleString("es-HN", { maximumFractionDigits: 1 })} t`],
            ["Registros", String(records.length)],
            ["Promedio", `${average.toLocaleString("es-HN", { maximumFractionDigits: 1 })} t`],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-lg bg-[var(--background)] px-2 py-2 sm:px-3">
              <span className="text-[10px] font-body text-[#6B7280]">{label}</span>
              <p className="mt-1 text-xs font-heading text-[#171A16]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {!enabled ? (
        <div className="flex h-[260px] items-center justify-center rounded-xl bg-[var(--background)] text-sm text-muted-foreground sm:h-[330px]">
          Este indicador está disponible para Operaciones y Administrador IT.
        </div>
      ) : loading ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground sm:h-[330px]">Cargando cosechas...</div>
      ) : syncError ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-red-600 sm:h-[330px]">No se pudieron consultar las cosechas.</div>
      ) : currentYearRecords === 0 ? (
        <div className="flex h-[260px] items-center justify-center rounded-xl bg-[var(--background)] text-sm text-muted-foreground sm:h-[330px]">
          No hay cosechas registradas en {year}.
        </div>
      ) : (
        <div className="h-[260px] min-h-[260px] min-w-0 sm:h-[330px] sm:min-h-[330px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={260}
            initialDimension={{ width: 800, height: 260 }}
          >
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(221,233,207,0.86)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `${v}t`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(142, 191, 36, 0.07)" }} />
              <Bar dataKey="toneladas" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={26} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
