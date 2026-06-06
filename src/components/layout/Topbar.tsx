"use client";

import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export default function Topbar({
  title,
  subtitle,
  onMenuToggle,
  sidebarCollapsed,
}: TopbarProps) {
  return (
    <header
      className="h-14 flex items-center gap-4 px-5 bg-white/70 backdrop-blur-md border-b border-[#E2EDD6] sticky top-0 z-10"
      style={{ borderBottomColor: "rgba(142,191,36,0.15)" }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="text-[#1E1E1E]/50 hover:text-[#1E1E1E] transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      {/* Desktop toggle for collapsed sidebar */}
      {sidebarCollapsed && (
        <button
          onClick={onMenuToggle}
          className="hidden lg:block text-[#1E1E1E]/40 hover:text-[#1E1E1E] transition-colors"
          aria-label="Expand sidebar"
        >
          <Menu size={16} />
        </button>
      )}

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-heading text-base text-[#1E1E1E] truncate leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body text-xs text-[#6B7280] truncate">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-[#F0F5EA] rounded-lg px-3 py-1.5 border border-[#E2EDD6] w-52 group focus-within:border-[#8EBF24] transition-colors">
        <Search size={13} className="text-[#9CA3AF] shrink-0" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent text-xs font-body text-[#1E1E1E] placeholder:text-[#9CA3AF] outline-none w-full"
        />
        <span className="text-[10px] font-body text-[#C4C4C4] shrink-0">⌘K</span>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#1E1E1E] hover:bg-[#F0F5EA] transition-all">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#8EBF24]" />
        </button>
      </div>

      {/* User chip */}
      <button className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#F0F5EA] transition-colors group">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-[#8EBF24]/15 text-[#8EBF24] text-[9px] font-heading">
            JM
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-body text-[#6B7280] group-hover:text-[#1E1E1E] transition-colors">
          Juan M.
        </span>
        <ChevronDown size={12} className="text-[#9CA3AF]" />
      </button>
    </header>
  );
}
