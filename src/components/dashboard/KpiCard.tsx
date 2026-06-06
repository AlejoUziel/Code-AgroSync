"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: "green" | "neutral" | "warning" | "danger";
}

export default function KpiCard({
  label,
  value,
  unit,
  change,
  trend,
  icon,
  color,
}: KpiCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "up"
      ? "text-[var(--primary)]"
      : trend === "down"
      ? "text-red-500"
      : "text-[#9CA3AF]";

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-5 card-hover group cursor-default transition-all duration-200 hover:border-[var(--primary)]/30 hover:shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-lg bg-[var(--secondary)] flex items-center justify-center group-hover:bg-[var(--primary)]/10 transition-colors">
          {icon}
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-body", trendColor)}>
          <TrendIcon size={12} />
          <span className="text-[10px]">{change}</span>
        </div>
      </div>

      <p className="font-body text-xs text-[#9CA3AF] mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-2xl text-[#1E1E1E] leading-none">
          {value}
        </span>
        <span className="font-body text-xs text-[#C4C4C4]">{unit}</span>
      </div>
    </div>
  );
}
