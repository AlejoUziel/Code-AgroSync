"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";

const data = [
  { mes: "Ene", maiz: 420, cafe: 210, frijol: 120, meta: 690 },
  { mes: "Feb", maiz: 380, cafe: 240, frijol: 150, meta: 710 },
  { mes: "Mar", maiz: 510, cafe: 260, frijol: 160, meta: 780 },
  { mes: "Abr", maiz: 460, cafe: 300, frijol: 180, meta: 800 },
  { mes: "May", maiz: 620, cafe: 340, frijol: 210, meta: 920 },
  { mes: "Jun", maiz: 580, cafe: 310, frijol: 190, meta: 900 },
  { mes: "Jul", maiz: 720, cafe: 360, frijol: 240, meta: 980 },
  { mes: "Ago", maiz: 690, cafe: 350, frijol: 230, meta: 960 },
  { mes: "Sep", maiz: 540, cafe: 320, frijol: 180, meta: 860 },
  { mes: "Oct", maiz: 480, cafe: 280, frijol: 170, meta: 780 },
  { mes: "Nov", maiz: 390, cafe: 250, frijol: 140, meta: 700 },
  { mes: "Dic", maiz: 350, cafe: 220, frijol: 110, meta: 650 },
];

const totals = [
  { label: "Maiz", value: "6,120 t", color: "bg-[var(--primary)]" },
  { label: "Cafe", value: "3,440 qq", color: "bg-amber-500" },
  { label: "Frijol", value: "2,080 t", color: "bg-blue-500" },
];

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#1E1E1E] p-3 shadow-xl">
      <p className="mb-2 text-xs font-heading text-white/70">{label} 2026</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex min-w-36 items-center justify-between gap-4 text-xs">
          <span className="font-body capitalize text-white/60">{entry.name}</span>
          <span className="font-medium-body text-white">{entry.value.toLocaleString()} t</span>
        </div>
      ))}
    </div>
  );
}

export default function HarvestChart() {
  return (
    <div className="pro-card h-full rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-sm text-[#1E1E1E]">Produccion y cosecha</h2>
            <Badge className="border-0 bg-[var(--secondary)] px-2 py-0 text-[10px] text-[var(--primary)]">
              Honduras 2026
            </Badge>
          </div>
          <p className="mt-0.5 text-xs font-body text-[#9CA3AF]">
            Maiz, cafe y frijol contra meta mensual
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {totals.map((item) => (
            <div key={item.label} className="rounded-lg bg-[var(--background)] px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                <span className="text-[10px] font-body text-[#6B7280]">{item.label}</span>
              </div>
              <p className="mt-1 text-xs font-heading text-[#171A16]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[330px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="rgba(221,233,207,0.86)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `${v}t`} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(142, 191, 36, 0.07)" }} />
            <Bar dataKey="maiz" stackId="harvest" fill="var(--primary)" radius={[0, 0, 6, 6]} barSize={24} />
            <Bar dataKey="cafe" stackId="harvest" fill="#F59E0B" barSize={24} />
            <Bar dataKey="frijol" stackId="harvest" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={24} />
            <Line type="monotone" dataKey="meta" stroke="#1E1E1E" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
