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
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (colorHex: string) => {
    const root = document.documentElement;
    
    if (colorHex === "#8EBF24") {
      // 🟢 Verde AgroSync Theme (Light, Original)
      root.style.setProperty("--primary", "#8EBF24");
      root.style.setProperty("--primary-dark", "#6E9A1A");
      root.style.setProperty("--primary-darker", "#5A7D15");
      root.style.setProperty("--background", "#F9FBF6");
      root.style.setProperty("--foreground", "#1E1E1E");
      root.style.setProperty("--card", "#ffffff");
      root.style.setProperty("--card-foreground", "#1E1E1E");
      root.style.setProperty("--border", "#E2EDD6");
      root.style.setProperty("--input", "#E2EDD6");
      root.style.setProperty("--secondary", "#F0F5EA");
      root.style.setProperty("--accent", "#BEE86B");
      root.style.setProperty("--accent-foreground", "#1E1E1E");
      root.style.setProperty("--sidebar", "#1E1E1E");
      root.style.setProperty("--sidebar-foreground", "#F9FBF6");
    } else if (colorHex === "#BEE86B") {
      // 🟡 Verde Limón Theme (Light Citrus)
      root.style.setProperty("--primary", "#BEE86B");
      root.style.setProperty("--primary-dark", "#A5D152");
      root.style.setProperty("--primary-darker", "#8CB839");
      root.style.setProperty("--background", "#FCFDF9");
      root.style.setProperty("--foreground", "#1E1E1E");
      root.style.setProperty("--card", "#ffffff");
      root.style.setProperty("--card-foreground", "#1E1E1E");
      root.style.setProperty("--border", "#EDF7DB");
      root.style.setProperty("--input", "#EDF7DB");
      root.style.setProperty("--secondary", "#F5FAEB");
      root.style.setProperty("--accent", "#8EBF24");
      root.style.setProperty("--accent-foreground", "#ffffff");
      root.style.setProperty("--sidebar", "#1E1E1E");
      root.style.setProperty("--sidebar-foreground", "#F9FBF6");
    } else if (colorHex === "#1E1E1E") {
      // ⚫ Negro Premium Theme (Full Dark Mode!)
      root.style.setProperty("--primary", "#8EBF24"); // High-contrast green primary
      root.style.setProperty("--primary-dark", "#BEE86B");
      root.style.setProperty("--primary-darker", "#D4EE9A");
      root.style.setProperty("--background", "#121212"); // Pitch Black background
      root.style.setProperty("--foreground", "#F9FBF6");
      root.style.setProperty("--card", "#1E1E1E"); // Dark grey panels/cards
      root.style.setProperty("--card-foreground", "#F9FBF6");
      root.style.setProperty("--border", "#2D2D2D");
      root.style.setProperty("--input", "#2D2D2D");
      root.style.setProperty("--secondary", "#2A2A2A");
      root.style.setProperty("--accent", "#BEE86B");
      root.style.setProperty("--accent-foreground", "#1E1E1E");
      root.style.setProperty("--sidebar", "#161616");
      root.style.setProperty("--sidebar-foreground", "#F9FBF6");
    } else if (colorHex === "#F9FBF6") {
      // ⚪ Fondo AgroSync Theme (Soft Green Panels)
      root.style.setProperty("--primary", "#8EBF24");
      root.style.setProperty("--primary-dark", "#6E9A1A");
      root.style.setProperty("--primary-darker", "#5A7D15");
      root.style.setProperty("--background", "#F9FBF6");
      root.style.setProperty("--foreground", "#1E1E1E");
      root.style.setProperty("--card", "#F0F5EA"); // Theme shifts card panels to secondary green
      root.style.setProperty("--card-foreground", "#1E1E1E");
      root.style.setProperty("--border", "#E2EDD6");
      root.style.setProperty("--input", "#E2EDD6");
      root.style.setProperty("--secondary", "#E2EDD6");
      root.style.setProperty("--accent", "#BEE86B");
      root.style.setProperty("--accent-foreground", "#1E1E1E");
      root.style.setProperty("--sidebar", "#1E1E1E");
      root.style.setProperty("--sidebar-foreground", "#F9FBF6");
    } else if (colorHex === "#F0F5EA") {
      // 🔘 Gris Suave Theme (Calm Muted Background)
      root.style.setProperty("--primary", "#8EBF24");
      root.style.setProperty("--primary-dark", "#6E9A1A");
      root.style.setProperty("--primary-darker", "#5A7D15");
      root.style.setProperty("--background", "#F0F5EA"); // Background becomes soft grey-green
      root.style.setProperty("--foreground", "#1E1E1E");
      root.style.setProperty("--card", "#FAFBF8"); // White cards stand out on soft background
      root.style.setProperty("--card-foreground", "#1E1E1E");
      root.style.setProperty("--border", "#D7E2CD");
      root.style.setProperty("--input", "#D7E2CD");
      root.style.setProperty("--secondary", "#E2EDD6");
      root.style.setProperty("--accent", "#BEE86B");
      root.style.setProperty("--accent-foreground", "#1E1E1E");
      root.style.setProperty("--sidebar", "#1E1E1E");
      root.style.setProperty("--sidebar-foreground", "#F9FBF6");
    }

    // Standard properties
    root.style.setProperty("--ring", colorHex === "#1E1E1E" ? "#8EBF24" : colorHex);
    root.style.setProperty("--chart-1", colorHex === "#1E1E1E" ? "#8EBF24" : colorHex);
    root.style.setProperty("--sidebar-primary", colorHex === "#1E1E1E" ? "#8EBF24" : colorHex);
  };

  const handleSelectColor = (colorHex: string) => {
    setActivePrimary(colorHex);
    applyTheme(colorHex);
    localStorage.setItem("agrosync-active-primary", colorHex);
  };

  return (
    <header
      className="h-14 flex items-center gap-4 px-5 bg-card/70 backdrop-blur-md border-b border-[#E2EDD6] sticky top-0 z-10"
      style={{ borderBottomColor: "rgba(142,191,36,0.15)" }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="text-foreground/50 hover:text-foreground transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      {/* Desktop toggle for collapsed sidebar */}
      {sidebarCollapsed && (
        <button
          onClick={onMenuToggle}
          className="hidden lg:block text-foreground/40 hover:text-foreground transition-colors"
          aria-label="Expand sidebar"
        >
          <Menu size={16} />
        </button>
      )}

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-heading text-base text-foreground truncate leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 border border-border w-48 group focus-within:border-primary transition-colors">
        <Search size={13} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent text-xs font-body text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
        <span className="text-[10px] font-body text-[#C4C4C4] shrink-0">⌘K</span>
      </div>

      {/* Color Customizer Circles directly in the Topbar */}
      <div className="flex items-center gap-1.5 bg-secondary px-2.5 py-1.5 rounded-full border border-border shadow-xs">
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
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
        </button>
      </div>

      {/* User chip */}
      <button className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary transition-colors group">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-heading">
            JM
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-body text-muted-foreground group-hover:text-foreground transition-colors">
          Juan M.
        </span>
        <ChevronDown size={12} className="text-muted-foreground" />
      </button>
    </header>
  );
}

