/**
 * useLocalDB — In-browser CRUD database using localStorage.
 * Drop-in replacement API designed for future MySQL migration.
 *
 * Usage:
 *   const db = useLocalDB<Empresa>("empresas", seedEmpresas);
 *   db.getAll()  db.getById(id)  db.create(data)  db.update(id, data)  db.delete(id)
 */
"use client";

import { useState, useEffect, useCallback } from "react";

export function generateId(prefix = "ID"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function useLocalDB<T extends { id: string }>(
  key: string,
  seed: T[] = []
) {
  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`agrosync_${key}`);
      if (stored) {
        setRecords(JSON.parse(stored));
      } else if (seed.length > 0) {
        // First time — seed demo data
        localStorage.setItem(`agrosync_${key}`, JSON.stringify(seed));
        setRecords(seed);
      }
    } catch {
      setRecords(seed);
    } finally {
      setLoading(false);
    }
  }, [key]);

  // Persist to localStorage whenever records change
  const persist = useCallback(
    (data: T[]) => {
      try {
        localStorage.setItem(`agrosync_${key}`, JSON.stringify(data));
      } catch {
        // Storage full or unavailable — silently fail for demo
      }
      setRecords(data);
    },
    [key]
  );

  const getAll = useCallback(() => records, [records]);

  const getById = useCallback(
    (id: string) => records.find((r) => r.id === id) ?? null,
    [records]
  );

  const create = useCallback(
    (data: Omit<T, "id"> & { id?: string }): T => {
      const newRecord = {
        ...data,
        id: data.id ?? generateId(key.slice(0, 3).toUpperCase()),
      } as T;
      persist([...records, newRecord]);
      return newRecord;
    },
    [records, persist, key]
  );

  const update = useCallback(
    (id: string, data: Partial<Omit<T, "id">>): T | null => {
      const idx = records.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      const updated = { ...records[idx], ...data } as T;
      const next = [...records];
      next[idx] = updated;
      persist(next);
      return updated;
    },
    [records, persist]
  );

  const remove = useCallback(
    (id: string): boolean => {
      const idx = records.findIndex((r) => r.id === id);
      if (idx === -1) return false;
      persist(records.filter((r) => r.id !== id));
      return true;
    },
    [records, persist]
  );

  const reset = useCallback(() => {
    persist(seed);
  }, [persist, seed]);

  return { records, loading, getAll, getById, create, update, remove, reset };
}

