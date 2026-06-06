"use client";

/**
 * LocalDBProvider
 * Runs once on app mount and seeds localStorage with demo data
 * if the keys don't exist yet (i.e. first visit).
 *
 * MySQL migration: Remove this file entirely and replace with
 * real API calls / server-side data fetching.
 */

import { useEffect } from "react";
import { seedEmpresas, seedUsuarios } from "@/types/models";

const STORAGE_KEYS = {
  empresas: "agrosync_empresas",
  usuarios: "agrosync_usuarios",
  initialized: "agrosync_db_initialized",
};

function seedIfEmpty() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      if (!localStorage.getItem(STORAGE_KEYS.empresas)) {
        localStorage.setItem(STORAGE_KEYS.empresas, JSON.stringify(seedEmpresas));
      }
      if (!localStorage.getItem(STORAGE_KEYS.usuarios)) {
        localStorage.setItem(STORAGE_KEYS.usuarios, JSON.stringify(seedUsuarios));
      }
      localStorage.setItem(STORAGE_KEYS.initialized, new Date().toISOString());
    }
  } catch {
    // Private browsing / storage quota exceeded — silently continue
  }
}

interface LocalDBProviderProps {
  children: React.ReactNode;
}

export default function LocalDBProvider({ children }: LocalDBProviderProps) {
  useEffect(() => {
    seedIfEmpty();
  }, []);

  return <>{children}</>;
}

