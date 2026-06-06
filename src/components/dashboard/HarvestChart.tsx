"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { mes: "Ene", maiz: 420, trigo: 280, sorgo: 150 },
  { mes: "Feb", maiz: 380, trigo: 320, sorgo: 180 },
  { mes: "Mar", maiz: 510, trigo: 290, sorgo: 210 },
  { mes: "Abr", maiz: 460, trigo: 350, sorgo: 190 },
  { mes: "May", maiz: 620, trigo: 410, sorgo: 260 },
  { mes: "Jun", maiz: 580, trigo: 380, sorgo: 240 },
  { mes: "Jul", maiz: 720, trigo: 450, sorgo: 310 },
  { mes: "Ago", maiz: 690, trigo: 420, sorgo: 290 },
  { mes: "Sep", maiz: 540, trigo: 370, sorgo: 220 },
  { mes: "Oct", maiz: 480, trigo: 310, sorgo: 200 },
  { mes: "Nov", maiz: 390, trigo: 260, sorgo: 170 },
  { mes: "Dic", maiz: 350, trigo: 240, sorgo: 140 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1E1E1E] rounded-xl p-3 border border-white/10 shadow-xl">
        <p className="font-heading text-xs text-white/60 mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs font-body">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-white/60 capitalize">{entry.name}:</span>
            <span className="text-white font-medium-body">
              {entry.value.toLocaleString()} t
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function HarvestChart() {
  return (
    <div className="bg-white rounded-xl border border-[#E2EDD6] p-5 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-heading text-sm text-[#1E1E1E]">
            Producción y Cosecha Anual
          </h2>
          <p className="font-body text-xs text-[#9CA3AF] mt-0.5">
            Toneladas por cultivo — 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: "Maíz", color: "#8EBF24" },
            { label: "Trigo", color: "#BEE86B" },
            { label: "Sorgo", color: "#D4EE9A" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: item.color }}
              />
              <span className="text-[11px] font-body text-[#6B7280]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="maizGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8EBF24" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8EBF24" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="trigoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#BEE86B" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#BEE86B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sorgoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4EE9A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#D4EE9A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2EDD6"
              vertical={false}
            />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "Outfit" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "Outfit" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}t`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="maiz"
              stroke="#8EBF24"
              strokeWidth={2}
              fill="url(#maizGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#8EBF24", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="trigo"
              stroke="#BEE86B"
              strokeWidth={2}
              fill="url(#trigoGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#BEE86B", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="sorgo"
              stroke="#D4EE9A"
              strokeWidth={2}
              fill="url(#sorgoGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#D4EE9A", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
