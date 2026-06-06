"use client";

import { cn } from "@/lib/utils";
import React from "react";

// ─── Field Wrapper ─────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="font-medium-body text-xs text-[#1E1E1E]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="font-body text-[11px] text-[#9CA3AF]">{hint}</p>
      )}
      {error && (
        <p className="font-body text-[11px] text-red-500 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Text Input ───────────────────────────────────────────────────────────────
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export function TextInput({ error, icon, className, ...props }: TextInputProps) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
          {icon}
        </span>
      )}
      <input
        className={cn(
          "w-full h-9 rounded-lg border text-xs font-body text-[#1E1E1E] placeholder:text-[#C4C4C4]",
          "bg-card px-3 py-2 outline-none transition-colors",
          "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10",
          "disabled:bg-[var(--background)] disabled:text-[#9CA3AF] disabled:cursor-not-allowed",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
            : "border-[var(--border)]",
          icon && "pl-9",
          className
        )}
        {...props}
      />
    </div>
  );
}

// ─── Select Input ─────────────────────────────────────────────────────────────
interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectInput({
  error,
  options,
  placeholder = "Seleccionar...",
  className,
  ...props
}: SelectInputProps) {
  return (
    <select
      className={cn(
        "w-full h-9 rounded-lg border text-xs font-body text-[#1E1E1E]",
        "bg-card px-3 py-2 outline-none transition-colors appearance-none",
        "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10",
        "disabled:bg-[var(--background)] disabled:text-[#9CA3AF] disabled:cursor-not-allowed",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_10px_center] bg-[length:14px_14px]",
        error
          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
          : "border-[var(--border)]",
        className
      )}
      {...props}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function TextareaInput({ error, className, ...props }: TextareaInputProps) {
  return (
    <textarea
      rows={3}
      className={cn(
        "w-full rounded-lg border text-xs font-body text-[#1E1E1E] placeholder:text-[#C4C4C4]",
        "bg-card px-3 py-2 outline-none transition-colors resize-none",
        "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10",
        error
          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
          : "border-[var(--border)]",
        className
      )}
      {...props}
    />
  );
}

// ─── Form Section ─────────────────────────────────────────────────────────────
export function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-heading text-xs text-[#9CA3AF] uppercase tracking-wider border-b border-[var(--border)] pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Confirm Delete Dialog ─────────────────────────────────────────────────────
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  entityType?: string;
  loading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  itemName,
  entityType = "registro",
  loading,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm border-[var(--border)] bg-card p-0 overflow-hidden">
        <div className="bg-red-50 px-6 pt-6 pb-4 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <DialogTitle className="font-heading text-base text-[#1E1E1E]">
                Eliminar {entityType}
              </DialogTitle>
              <p className="font-body text-xs text-[#6B7280] mt-0.5">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="font-body text-sm text-[#6B7280]">
            ¿Estás seguro que deseas eliminar{" "}
            <span className="font-medium-body text-[#1E1E1E]">"{itemName}"</span>?
            {entityType === "empresa" && (
              <span className="block mt-2 text-red-500 text-xs">
                ⚠️ También se eliminarán todos los usuarios asociados a esta empresa.
              </span>
            )}
          </p>
        </div>
        <DialogFooter className="px-6 pb-5 gap-2 flex-row justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-body text-[#6B7280] hover:border-[var(--primary)]/40 hover:text-[#1E1E1E] transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-medium-body hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Sí, eliminar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] mb-1">
        {icon}
      </div>
      <p className="font-heading text-sm text-[#1E1E1E]">{title}</p>
      <p className="font-body text-xs text-[#9CA3AF] max-w-xs">{desc}</p>
      {action}
    </div>
  );
}

// ─── Toast Notification ───────────────────────────────────────────────────────
import { useEffect, useState as useToastState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-body animate-fade-up",
        type === "success"
          ? "bg-card border-[var(--primary)]/30 text-[#1E1E1E]"
          : "bg-card border-red-300 text-[#1E1E1E]"
      )}
      style={{ minWidth: 260 }}
    >
      {type === "success" ? (
        <CheckCircle2 size={16} className="text-[var(--primary)] shrink-0" />
      ) : (
        <XCircle size={16} className="text-red-500 shrink-0" />
      )}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1E1E1E] transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useToastState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  return { toast, showToast, hideToast };
}
