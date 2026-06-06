"use client";

import { useState, useEffect } from "react";
import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Exclusively the colors shared by the user at the start
const brandColors = [
  { name: "Verde AgroSync (Primary)", hex: "#8EBF24" },
  { name: "Verde Limón (Accent)", hex: "#BEE86B" },
  { name: "Negro Premium (Dark)", hex: "#1E1E1E" },
  { name: "Fondo AgroSync (Surface)", hex: "#F9FBF6" },
  { name: "Gris Suave (Secondary)", hex: "#F0F5EA" },
];

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
  const [activePrimary, setActivePrimary] = useState("#8EBF24");

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("agrosync-active-primary");
    if (saved) {
      setActivePrimary(saved);
      applyPrimaryColor(saved);
    }
  }, []);

  const applyPrimaryColor = (primaryHex: string) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", primaryHex);
    root.style.setProperty("--ring", primaryHex);
    root.style.setProperty("--chart-1", primaryHex);
    root.style.setProperty("--sidebar-primary", primaryHex);
    
    // Dynamically adjust dark hover variants for the primary button
    if (primaryHex === "#8EBF24") {
      root.style.setProperty("--primary-dark", "#6E9A1A");
      root.style.setProperty("--primary-darker", "#5A7D15");
    } else if (primaryHex === "#BEE86B") {
      root.style.setProperty("--primary-dark", "#A5D152");
      root.style.setProperty("--primary-darker", "#8CB839");
    } else if (primaryHex === "#1E1E1E") {
      root.style.setProperty("--primary-dark", "#000000");
      root.style.setProperty("--primary-darker", "#000000");
    } else if (primaryHex === "#F9FBF6") {
      root.style.setProperty("--primary-dark", "#E2EDD6");
      root.style.setProperty("--primary-darker", "#C8DCB8");
    } else {
      root.style.setProperty("--primary-dark", "#D7E2CD");
      root.style.setProperty("--primary-darker", "#BDCEAB");
    }
  };

  const handleSelectColor = (colorHex: string) => {
    setActivePrimary(colorHex);
    applyPrimaryColor(colorHex);
    localStorage.setItem("agrosync-active-primary", colorHex);
  };

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
      <div className="hidden md:flex items-center gap-2 bg-[#F0F5EA] rounded-lg px-3 py-1.5 border border-[#E2EDD6] w-48 group focus-within:border-primary transition-colors">
        <Search size={13} className="text-[#9CA3AF] shrink-0" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent text-xs font-body text-[#1E1E1E] placeholder:text-[#9CA3AF] outline-none w-full"
        />
        <span className="text-[10px] font-body text-[#C4C4C4] shrink-0">⌘K</span>
      </div>

      {/* Color Customizer Circles directly in the Topbar */}
      <div className="flex items-center gap-1.5 bg-[#F9FBF6] px-2.5 py-1.5 rounded-full border border-[#E2EDD6] shadow-xs">
        {brandColors.map((color) => (
          <button
            key={color.hex}
            onClick={() => handleSelectColor(color.hex)}
            className={cn(
              "w-4 h-4 rounded-full border border-black/10 transition-all hover:scale-115 cursor-pointer",
              activePrimary === color.hex ? "ring-2 ring-primary ring-offset-1 scale-110" : ""
            )}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          />
        ))}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#1E1E1E] hover:bg-[#F0F5EA] transition-all">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
        </button>
      </div>

      {/* User chip */}
      <button className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#F0F5EA] transition-colors group">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-heading">
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
