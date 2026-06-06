"use client";

import { useState, useEffect } from "react";
import { Palette, X, Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Presets
const presets = [
  {
    name: "AgroSync (Verde)",
    primary: "#8EBF24",
    accent: "#BEE86B",
    background: "#F9FBF6",
    secondary: "#F0F5EA",
    border: "#E2EDD6",
    primaryDark: "#6E9A1A",
    primaryDarker: "#5A7D15",
    accentMuted: "#D4EE9A",
  },
  {
    name: "Azul Océano",
    primary: "#0284C7",
    accent: "#7DD3FC",
    background: "#F8FAFC",
    secondary: "#E0F2FE",
    border: "#BAE6FD",
    primaryDark: "#0369A1",
    primaryDarker: "#075985",
    accentMuted: "#BAE6FD",
  },
  {
    name: "Cítrico Naranja",
    primary: "#EA580C",
    accent: "#FDBA74",
    background: "#FAFAFA",
    secondary: "#FFEDD5",
    border: "#FED7AA",
    primaryDark: "#C2410C",
    primaryDarker: "#9A3412",
    accentMuted: "#FED7AA",
  },
  {
    name: "Tierra Forestal",
    primary: "#15803D",
    accent: "#86EFAC",
    background: "#F4FBF7",
    secondary: "#DCFCE7",
    border: "#BBF7D0",
    primaryDark: "#15803D",
    primaryDarker: "#166534",
    accentMuted: "#BBF7D0",
  },
  {
    name: "Púrpura Lavanda",
    primary: "#7C3AED",
    accent: "#C4B5FD",
    background: "#FAF5FF",
    secondary: "#F3E8FF",
    border: "#E9D5FF",
    primaryDark: "#6D28D9",
    primaryDarker: "#5B21B6",
    accentMuted: "#E9D5FF",
  },
];

// Helper functions for HSL color conversion and generation
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, "");
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  let rHex = Math.round((r + m) * 255).toString(16).padStart(2, "0");
  let gHex = Math.round((g + m) * 255).toString(16).padStart(2, "0");
  let bHex = Math.round((b + m) * 255).toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

function generatePaletteFromPrimary(primaryHex: string): typeof presets[0] {
  const { h, s, l } = hexToHsl(primaryHex);
  
  return {
    name: "Personalizado",
    primary: primaryHex.toUpperCase(),
    accent: hslToHex(h, Math.min(s + 10, 95), 77),
    background: hslToHex(h, Math.min(s, 15), 98),
    secondary: hslToHex(h, Math.min(s, 20), 95),
    border: hslToHex(h, Math.min(s, 25), 91),
    primaryDark: hslToHex(h, s, Math.max(l - 10, 15)),
    primaryDarker: hslToHex(h, s, Math.max(l - 18, 10)),
    accentMuted: hslToHex(h, s, 88),
  };
}

export default function ColorPalettePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activePalette, setActivePalette] = useState<typeof presets[0]>(presets[0]);
  const [customPrimary, setCustomPrimary] = useState(presets[0].primary);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("agrosync-theme");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActivePalette(parsed);
        setCustomPrimary(parsed.primary);
        applyTheme(parsed);
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const applyTheme = (palette: typeof presets[0]) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", palette.primary);
    root.style.setProperty("--accent", palette.accent);
    root.style.setProperty("--background", palette.background);
    root.style.setProperty("--secondary", palette.secondary);
    root.style.setProperty("--border", palette.border);
    root.style.setProperty("--input", palette.border);
    root.style.setProperty("--ring", palette.primary);
    root.style.setProperty("--primary-dark", palette.primaryDark);
    root.style.setProperty("--primary-darker", palette.primaryDarker);
    root.style.setProperty("--accent-muted", palette.accentMuted);
    
    // Also update chart/sidebar colors if needed
    root.style.setProperty("--chart-1", palette.primary);
    root.style.setProperty("--chart-2", palette.accent);
    root.style.setProperty("--chart-3", palette.primaryDark);
    root.style.setProperty("--chart-4", palette.accentMuted);
    root.style.setProperty("--sidebar-primary", palette.primary);
    root.style.setProperty("--sidebar-accent-foreground", palette.accent);
  };

  const handleSelectPreset = (preset: typeof presets[0]) => {
    setActivePalette(preset);
    setCustomPrimary(preset.primary);
    applyTheme(preset);
    localStorage.setItem("agrosync-theme", JSON.stringify(preset));
  };

  const handleCustomPrimaryChange = (color: string) => {
    setCustomPrimary(color);
    const generated = generatePaletteFromPrimary(color);
    setActivePalette(generated);
    applyTheme(generated);
    localStorage.setItem("agrosync-theme", JSON.stringify(generated));
  };

  const handleReset = () => {
    handleSelectPreset(presets[0]);
  };

  const copyToClipboard = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const displayColors = [
    { name: "Primary (Principal)", hex: activePalette.primary, desc: "Botones principales, estados activos y acentos clave." },
    { name: "Accent (Acento Claro)", hex: activePalette.accent, desc: "Acentos secundarios, etiquetas y estados destacados." },
    { name: "Surface (Superficie)", hex: activePalette.background, desc: "Fondo general de la aplicación y tarjetas claras." },
    { name: "Secondary / Muted (Secundario)", hex: activePalette.secondary, desc: "Fondos de inputs, hover de tablas y elementos secundarios." },
    { name: "Border (Borde / Outline)", hex: activePalette.border, desc: "Bordes de inputs, tablas y divisiones de tarjetas." },
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center justify-center w-12 h-12 rounded-full shadow-xl hover:scale-105 transition-all cursor-pointer group bg-primary text-white border border-[#E2EDD6]"
        title="Personalizar Colores / Tema"
      >
        <Palette size={20} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Slide-over Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 z-50 w-80 sm:w-96 bg-white border-l border-[#E2EDD6] shadow-2xl flex flex-col animate-slide-in">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E2EDD6] flex items-center justify-between bg-[#F9FBF6]">
              <div className="flex items-center gap-2">
                <Palette size={16} className="text-[#8EBF24]" />
                <h3 className="font-heading text-sm text-[#1E1E1E]">Personalizar Tema</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleReset}
                  className="text-[#9CA3AF] hover:text-[#8EBF24] transition-colors p-1 rounded-lg"
                  title="Restaurar colores originales"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#9CA3AF] hover:text-[#1E1E1E] transition-colors p-1 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Presets Grid */}
              <div className="space-y-2">
                <h4 className="font-heading text-[11px] text-[#9CA3AF] uppercase tracking-wider">
                  Temas Predeterminados
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => {
                    const isSelected = activePalette.name === preset.name;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handleSelectPreset(preset)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-xs font-body cursor-pointer bg-[#F9FBF6]",
                          isSelected
                            ? "border-primary ring-2 ring-primary/10 text-primary font-medium-body"
                            : "border-[#E2EDD6] hover:border-primary/40 text-[#6B7280]"
                        )}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-black/5"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Picker */}
              <div className="p-3.5 rounded-xl border border-[#E2EDD6] bg-[#F9FBF6] space-y-2.5">
                <h4 className="font-heading text-[11px] text-[#9CA3AF] uppercase tracking-wider">
                  Crear Color Personalizado
                </h4>
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#E2EDD6] shrink-0">
                    <input
                      type="color"
                      value={customPrimary}
                      onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                      className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium-body text-[11.5px] text-[#1E1E1E]">
                      Selector de Color Libre
                    </p>
                    <p className="font-body text-[10px] text-[#9CA3AF] mt-0.5">
                      ¡Escoge tu color corporativo y generaremos el tema automáticamente!
                    </p>
                  </div>
                </div>
              </div>

              {/* Generated Palette Details */}
              <div className="space-y-2.5">
                <h4 className="font-heading text-[11px] text-[#9CA3AF] uppercase tracking-wider">
                  Valores del Tema Activo
                </h4>
                <div className="space-y-2">
                  {displayColors.map((color, i) => (
                    <div
                      key={color.name}
                      className="p-2.5 rounded-lg border border-[#E2EDD6] bg-white flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-md shrink-0 shadow-sm border border-black/5"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="min-w-0">
                          <span className="font-medium-body text-[11px] text-[#1E1E1E] block truncate">
                            {color.name}
                          </span>
                          <span className="font-mono text-[9px] text-[#8EBF24] block mt-0.5">
                            {color.hex}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(color.hex, i)}
                        className="text-[#9CA3AF] hover:text-[#8EBF24] transition-colors p-1 shrink-0"
                        title="Copiar Hexadecimal"
                      >
                        {copiedIndex === i ? (
                          <Check size={11} className="text-[#8EBF24]" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#E2EDD6] bg-[#F9FBF6] text-center shrink-0">
              <span className="font-body text-[10px] text-[#9CA3AF]">
                Los cambios se guardan localmente en el navegador.
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
