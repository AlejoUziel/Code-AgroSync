"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="pro-card rounded-2xl p-6 border-red-200 bg-red-50/50 flex flex-col items-center justify-center text-center gap-3 animate-fade-up">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="font-heading text-sm text-[#1E1E1E]">Panel no disponible</h4>
            <p className="font-body text-xs text-muted-foreground mt-1 max-w-md">
              {this.state.error?.message || "Ocurrió un error inesperado al renderizar este panel."}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-xs text-red-700 bg-white hover:bg-red-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
