"use client";

/**
 * LocalDBProvider
 * Runs once on app mount and seeds localStorage with demo data
 * if the keys don't exist yet (i.e. first visit).
 *
 * MySQL migration: Remove this file entirely and replace with
 * real API calls / server-side data fetching.
 */

import { useEffect, useState } from "react";
import { seedEmpresas, seedUsuarios } from "@/types/models";

const STORAGE_KEYS = {
  empresas: "agrosync_empresas",
  usuarios: "agrosync_usuarios",
  initialized: "agrosync_db_initialized",
};

function seedIfEmpty() {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.empresas)) {
      localStorage.setItem(STORAGE_KEYS.empresas, JSON.stringify(seedEmpresas));
    }
    if (!localStorage.getItem(STORAGE_KEYS.usuarios)) {
      localStorage.setItem(STORAGE_KEYS.usuarios, JSON.stringify(seedUsuarios));
    }
    localStorage.setItem(STORAGE_KEYS.initialized, new Date().toISOString());
  } catch {
    // Private browsing / storage quota exceeded — silently continue
  }
}

interface LocalDBProviderProps {
  children: React.ReactNode;
}

export default function LocalDBProvider({ children }: LocalDBProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedIfEmpty();
    setReady(true);
  }, []);

  // Prevent SSR flash by showing nothing until client-side is ready
  if (!ready) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          {/* Animated AgroSync logo */}
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E1E1E] flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 22c1.25-.987 2.27-1.975 3.9-2.975A15 15 0 0 1 12 17c2.12 0 4.002.386 5.1 1.025" />
                <path d="M12 17V3" />
                <path d="M7 8l5-5 5 5" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[var(--primary)] border-2 border-[var(--background)] animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-heading text-sm text-[#1E1E1E]">AgroSync</p>
            <p className="font-body text-xs text-[#9CA3AF] mt-0.5">Iniciando sistema...</p>
          </div>
          {/* Progress bar */}
          <div className="w-32 h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full"
              style={{
                width: "60%",
                animation: "progress-fill 0.8s ease-out forwards",
              }}
            />
          </div>
        </div>
        <style>{`
          @keyframes progress-fill {
            from { width: 0% }
            to { width: 100% }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
