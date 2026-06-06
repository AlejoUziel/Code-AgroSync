"use client";

import { useState, useEffect } from "react";
import { Palette, X, Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Exclusively the colors shared by the user at the start
const brandColors = [
  { name: "Verde AgroSync (Primary)", hex: "#8EBF24", desc: "Color principal original del sistema." },
  { name: "Verde Limón (Accent)", hex: "#BEE86B", desc: "Acento claro original del sistema." },
  { name: "Negro Premium (Dark)", hex: "#1E1E1E", desc: "Tono oscuro para barra lateral e interfaces de alto contraste." },
  { name: "Fondo AgroSync (Surface)", hex: "#F9FBF6", desc: "Color de fondo claro original del sistema." },
  { name: "Gris Suave (Secondary)", hex: "#F0F5EA", desc: "Tono secundario original de la aplicación." },
];

export default function ColorPalettePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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

  const handleReset = () => {
    handleSelectColor("#8EBF24");
  };

  const copyToClipboard = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      {/* Floating Toggle Button — Moved to the TOP-RIGHT corner */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-5 z-40 flex items-center justify-center w-11 h-11 rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer bg-primary text-white border border-[#E2EDD6]"
        title="Personalizar Colores / Tema"
      >
        <Palette size={18} className="hover:rotate-12 transition-transform" />
      </button>

      {/* Slide-over Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 z-50 w-80 sm:w-88 bg-white border-l border-[#E2EDD6] shadow-2xl flex flex-col animate-slide-in">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E2EDD6] flex items-center justify-between bg-[#F9FBF6]">
              <div className="flex items-center gap-2">
                <Palette size={15} className="text-primary" />
                <h3 className="font-heading text-sm text-[#1E1E1E]">Personalizar Color</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleReset}
                  className="text-[#9CA3AF] hover:text-primary transition-colors p-1 rounded-lg cursor-pointer"
                  title="Restaurar color original"
                >
                  <RefreshCw size={12} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#9CA3AF] hover:text-[#1E1E1E] transition-colors p-1 rounded-lg cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <p className="font-body text-xs text-[#6B7280] leading-relaxed">
                Selecciona uno de los colores originales compartidos al inicio para aplicarlo como el color primario del sistema.
              </p>

              {/* Exclusive Colors Selector */}
              <div className="space-y-3">
                <h4 className="font-heading text-[10px] text-[#9CA3AF] uppercase tracking-wider">
                  Colores de la Paleta
                </h4>
                <div className="space-y-2">
                  {brandColors.map((color, i) => {
                    const isSelected = activePrimary === color.hex;
                    return (
                      <div
                        key={color.hex}
                        className={cn(
                          "p-2.5 rounded-xl border flex items-center justify-between gap-3 bg-[#F9FBF6] transition-all",
                          isSelected ? "border-primary ring-2 ring-primary/8" : "border-[#E2EDD6]"
                        )}
                      >
                        {/* Color Selector Info */}
                        <button
                          onClick={() => handleSelectColor(color.hex)}
                          className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <span
                            className="w-7 h-7 rounded-lg shrink-0 shadow-xs border border-black/5"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="min-w-0">
                            <span className={cn(
                              "text-xs font-body block truncate",
                              isSelected ? "text-primary font-medium-body" : "text-[#1E1E1E]"
                            )}>
                              {color.name}
                            </span>
                            <span className="font-mono text-[9px] text-[#9CA3AF] block mt-0.5">
                              {color.hex}
                            </span>
                          </div>
                        </button>

                        {/* Copy Code */}
                        <button
                          onClick={() => copyToClipboard(color.hex, i)}
                          className="text-[#9CA3AF] hover:text-primary transition-colors p-1.5 shrink-0 cursor-pointer"
                          title="Copiar Código"
                        >
                          {copiedIndex === i ? (
                            <Check size={12} className="text-primary" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-[#E2EDD6] bg-[#F9FBF6] text-center shrink-0">
              <span className="font-body text-[9px] text-[#9CA3AF]">
                Personalización limitada a la paleta corporativa autorizada.
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
