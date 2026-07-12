"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertType = "info" | "success" | "warning" | "error" | "confirm" | "prompt";

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

interface ModernAlertContextType {
  alert: (options: AlertOptions | string) => Promise<boolean>;
  confirm: (options: AlertOptions | string) => Promise<boolean>;
  prompt: (options: AlertOptions | string) => Promise<string | null>;
}

const ModernAlertContext = createContext<ModernAlertContextType | null>(null);

export function useModernAlert() {
  const context = useContext(ModernAlertContext);
  if (!context) {
    throw new Error("useModernAlert must be used within a ModernAlertProvider");
  }
  return context;
}

export function ModernAlertProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AlertOptions & { type: AlertType }>({
    title: "",
    message: "",
    type: "info",
  });
  const [promptValue, setPromptValue] = useState("");
  const resolverRef = useRef<((value: any) => void) | null>(null);

  const show = useCallback((opts: AlertOptions, type: AlertType) => {
    setOptions({
      type,
      confirmText: type === "confirm" ? "Confirmar" : type === "prompt" ? "Aceptar" : "OK",
      cancelText: "Cancelar",
      ...opts,
    });
    setPromptValue(opts.defaultValue ?? "");
    setOpen(true);
    return new Promise<any>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const alert = useCallback((opts: AlertOptions | string) => {
    const config = typeof opts === "string" ? { title: "Notificación", message: opts } : opts;
    return show(config, config.type ?? "info") as Promise<boolean>;
  }, [show]);

  const confirm = useCallback((opts: AlertOptions | string) => {
    const config = typeof opts === "string" ? { title: "Confirmar acción", message: opts } : opts;
    return show(config, "confirm") as Promise<boolean>;
  }, [show]);

  const prompt = useCallback((opts: AlertOptions | string) => {
    const config = typeof opts === "string" ? { title: "Ingresar información", message: opts } : opts;
    return show(config, "prompt") as Promise<string | null>;
  }, [show]);

  const handleClose = () => {
    if (!open) return;
    setOpen(false);
    if (resolverRef.current) {
      if (options.type === "prompt") resolverRef.current(null);
      else resolverRef.current(false);
    }
  };

  const handleConfirm = () => {
    setOpen(false);
    if (resolverRef.current) {
      if (options.type === "prompt") resolverRef.current(promptValue);
      else resolverRef.current(true);
    }
  };

  const getIconAndColors = () => {
    switch (options.type) {
      case "success":
        return {
          icon: <CheckCircle2 className="text-[#8EBF24] size-9 shrink-0" />,
          bgHeader: "bg-[#F0F5EA]",
          borderHeader: "border-[#DDE9CF]",
        };
      case "error":
        return {
          icon: <XCircle className="text-red-500 size-9 shrink-0" />,
          bgHeader: "bg-red-50",
          borderHeader: "border-red-100",
        };
      case "warning":
      case "confirm":
        return {
          icon: <AlertTriangle className="text-amber-500 size-9 shrink-0" />,
          bgHeader: "bg-amber-50",
          borderHeader: "border-amber-100",
        };
      case "prompt":
      case "info":
      default:
        return {
          icon: <Info className="text-blue-500 size-9 shrink-0" />,
          bgHeader: "bg-blue-50",
          borderHeader: "border-blue-100",
        };
    }
  };

  const { icon, bgHeader, borderHeader } = getIconAndColors();

  return (
    <ModernAlertContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
        <DialogContent className="sm:max-w-md border-[var(--border)] bg-card p-0 overflow-hidden shadow-2xl" showCloseButton={false}>
          <div className={cn("px-6 pt-6 pb-5 border-b flex items-start gap-4", bgHeader, borderHeader)}>
            {icon}
            <div className="space-y-1 flex-1">
              <DialogTitle className="font-heading text-base text-[#1E1E1E] leading-tight">
                {options.title}
              </DialogTitle>
              <DialogDescription className="font-body text-xs text-[#6B7280]">
                {options.message}
              </DialogDescription>
            </div>
          </div>

          {options.type === "prompt" && (
            <div className="px-6 py-4 bg-white/50">
              <input
                type="text"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={options.placeholder ?? "Escribe aquí..."}
                className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm();
                  if (e.key === "Escape") handleClose();
                }}
              />
            </div>
          )}

          <DialogFooter className="px-6 py-4 gap-2 flex-row justify-end border-t border-[var(--border)] bg-[var(--background)]">
            {(options.type === "confirm" || options.type === "prompt") && (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-medium-body text-[#6B7280] hover:text-[#1E1E1E] bg-white transition-all cursor-pointer"
              >
                {options.cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className={cn(
                "px-5 py-2 rounded-lg text-white text-xs font-medium-body transition-colors cursor-pointer",
                options.type === "error"
                  ? "bg-red-500 hover:bg-red-600"
                  : options.type === "warning" || options.type === "confirm"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
              )}
            >
              {options.confirmText}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModernAlertContext.Provider>
  );
}
