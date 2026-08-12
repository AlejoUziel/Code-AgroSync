"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateId } from "@/hooks/useLocalDB";
import { calculateInventoryStatus, resourceDefinitions, type ResourceKey, type ResourceRecord } from "@/lib/resource-definitions";
import { subscribeToRealtime } from "@/lib/realtime-client";

type ApiResponse = {
  items: ResourceRecord[];
  dbConfigured: boolean;
};

type ApiError = {
  message?: string;
  traceId?: string;
};

function apiErrorMessage(error: ApiError, fallback: string) {
  const message = error.message ?? fallback;
  return error.traceId ? `${message} Referencia: ${error.traceId.slice(0, 8)}.` : message;
}

const allowLocalFallback = process.env.NODE_ENV !== "production";

function normalizeRecord(resourceKey: ResourceKey, record: ResourceRecord) {
  if (resourceKey !== "inventario") return record;
  return {
    ...record,
    estado: calculateInventoryStatus(record.stock, record.stockMinimo),
  };
}

function normalizeRecords(resourceKey: ResourceKey, records: ResourceRecord[]) {
  return records.map((record) => normalizeRecord(resourceKey, record));
}

export function useCrudResource(resourceKey: ResourceKey, enabled = true) {
  const definition = resourceDefinitions[resourceKey];
  const storageKey = `agrosync_resource_${resourceKey}`;
  const [records, setRecords] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [syncing, setSyncing] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [dbConfigured, setDbConfigured] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncInProgress = useRef(false);

  const persistLocal = useCallback(
    (items: ResourceRecord[]) => {
      const normalized = normalizeRecords(resourceKey, items);
      localStorage.setItem(storageKey, JSON.stringify(normalized));
      setRecords(normalized);
    },
    [resourceKey, storageKey]
  );

  const load = useCallback(async (showLoading = false) => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    if (showLoading) setLoading(true);
    else setSyncing(true);
    try {
      const response = await fetch(`/api/resources/${resourceKey}`, { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as ApiResponse & ApiError;
      if (!response.ok) throw new Error(data.message ?? "No se pudo consultar la base de datos compartida.");
      setDbConfigured(data.dbConfigured);
      setSyncError(null);
      if (data.dbConfigured) {
        setRecords(normalizeRecords(resourceKey, data.items));
      } else if (allowLocalFallback) {
        const local = localStorage.getItem(storageKey);
        if (local) {
          setRecords(JSON.parse(local));
        } else {
          const seeds = normalizeRecords(resourceKey, definition.seed);
          localStorage.setItem(storageKey, JSON.stringify(seeds));
          setRecords(seeds);
        }
      }
    } catch (error) {
      if (allowLocalFallback) {
        const local = localStorage.getItem(storageKey);
        if (local) {
          setRecords(JSON.parse(local));
        } else {
          setRecords(normalizeRecords(resourceKey, definition.seed));
        }
      } else {
        setRecords([]);
      }
      setDbConfigured(false);
      setSyncError(error instanceof Error ? error.message : "Sin conexion con la base compartida.");
    } finally {
      if (showLoading) setLoading(false);
      else setSyncing(false);
      syncInProgress.current = false;
    }
  }, [resourceKey, storageKey, definition.seed]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const initialLoad = window.setTimeout(() => void load(true), 0);

    const refresh = () => {
      if (document.visibilityState === "visible") void load(false);
    };
    const unsubscribe = subscribeToRealtime(refresh, setRealtimeConnected);
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      unsubscribe();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled, load]);

  const create = useCallback(
    async (payload: ResourceRecord) => {
      const normalizedPayload = normalizeRecord(resourceKey, payload);
      if (dbConfigured) {
        const response = await fetch(`/api/resources/${resourceKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedPayload),
        });
        if (!response.ok) {
          const error = (await response.json().catch(() => ({}))) as ApiError;
          throw new Error(apiErrorMessage(error, "No se pudo guardar."));
        }
        const saved = normalizeRecord(resourceKey, (await response.json()) as ResourceRecord);
        setRecords((current) => [saved, ...current]);
        return saved;
      }
      if (!allowLocalFallback) throw new Error(syncError ?? "La base compartida no esta disponible.");
      const saved = normalizeRecord(resourceKey, { ...normalizedPayload, id: payload.id || generateId(resourceKey.slice(0, 3).toUpperCase()) });
      persistLocal([saved, ...records]);
      return saved;
    },
    [dbConfigured, persistLocal, records, resourceKey, syncError]
  );

  const update = useCallback(
    async (id: string, payload: ResourceRecord) => {
      const normalizedPayload = normalizeRecord(resourceKey, payload);
      if (dbConfigured) {
        const response = await fetch(`/api/resources/${resourceKey}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedPayload),
        });
        if (!response.ok) {
          const error = (await response.json().catch(() => ({}))) as ApiError;
          throw new Error(apiErrorMessage(error, "No se pudo actualizar."));
        }
        const saved = normalizeRecord(resourceKey, (await response.json()) as ResourceRecord);
        setRecords((current) => current.map((item) => (item.id === id ? saved : item)));
        return saved;
      }
      if (!allowLocalFallback) throw new Error(syncError ?? "La base compartida no esta disponible.");
      const saved = normalizeRecord(resourceKey, { ...normalizedPayload, id });
      persistLocal(records.map((item) => (item.id === id ? saved : item)));
      return saved;
    },
    [dbConfigured, persistLocal, records, resourceKey, syncError]
  );

  const remove = useCallback(
    async (id: string) => {
      if (dbConfigured) {
        const response = await fetch(`/api/resources/${resourceKey}/${id}`, { method: "DELETE" });
        if (!response.ok) {
          const error = (await response.json().catch(() => ({}))) as ApiError;
          throw new Error(apiErrorMessage(error, "No se pudo eliminar."));
        }
      }
      if (!dbConfigured && !allowLocalFallback) throw new Error(syncError ?? "La base compartida no esta disponible.");
      persistLocal(records.filter((item) => item.id !== id));
    },
    [dbConfigured, persistLocal, records, resourceKey, syncError]
  );

  return useMemo(
    () => ({ definition, records, loading, syncing, realtimeConnected, dbConfigured, syncError, create, update, remove, reload: load }),
    [create, dbConfigured, definition, load, loading, realtimeConnected, records, remove, syncError, syncing, update]
  );
}
