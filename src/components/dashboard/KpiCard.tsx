"use client";

import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: LucideIcon;
  detail: string;
  progress: number;
  tone: "green" | "blue" | "amber" | "dark";
}

const toneClass = {
  green: {
    icon: "bg-[var(--primary)]/12 text-[var(--primary)] ring-[var(--primary)]/15",
    bar: "bg-[var(--primary)]",
    glow: "bg-[var(--primary)]/18",
  },
  blue: {
    icon: "bg-blue-50 text-blue-600 ring-blue-100",
    bar: "bg-blue-500",
    glow: "bg-blue-500/14",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    bar: "bg-amber-500",
    glow: "bg-amber-500/16",
  },
  dark: {
    icon: "bg-[#1E1E1E]/8 text-[#1E1E1E] ring-[#1E1E1E]/10",
    bar: "bg-[#1E1E1E]",
    glow: "bg-[#1E1E1E]/10",
  },
};

export default function KpiCard({
  label,
  value,
  unit,
  change,
  trend,
  icon: Icon,
  detail,
  progress,
  tone,
}: KpiCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor = trend === "down" ? "text-red-500" : trend === "neutral" ? "text-[#9CA3AF]" : "text-[var(--primary)]";

  const toneStyle = toneClass[tone];

  return (
    <div className="pro-card pro-card-hover group relative overflow-hidden rounded-2xl p-4">
      <div className={cn("pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity group-hover:opacity-90", toneStyle.glow)} />
      <div className="flex items-start justify-between gap-3">
        <div className={cn("relative flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition-transform group-hover:scale-105", toneStyle.icon)}>
          <Icon size={21} strokeWidth={2.2} />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-card bg-[var(--accent)]" />
        </div>
        <div className={cn("flex items-center gap-1 rounded-full border border-[var(--border)] bg-white/80 px-2.5 py-1 text-[10px] font-medium-body shadow-[var(--shadow-xs)]", trendColor)}>
          <TrendIcon size={12} strokeWidth={2.4} />
          {change}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium-body text-[var(--text-soft)]">{label}</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-heading text-3xl leading-none text-[#171A16]">{value}</span>
          <span className="text-xs font-body text-[#9CA3AF]">{unit}</span>
        </div>
        <p className="mt-2 text-[11px] font-body text-[#9CA3AF]">{detail}</p>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div
          className={cn("h-full rounded-full transition-all", toneStyle.bar)}
          style={{ width: `${Math.max(8, Math.min(progress, 100))}%` }}
        />
      </div>
    </div>
  );
}
