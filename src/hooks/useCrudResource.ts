"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateId } from "@/hooks/useLocalDB";
import { calculateInventoryStatus, resourceDefinitions, type ResourceKey, type ResourceRecord } from "@/lib/resource-definitions";

type ApiResponse = {
  items: ResourceRecord[];
  dbConfigured: boolean;
};

type ApiError = {
  message?: string;
};

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

export function useCrudResource(resourceKey: ResourceKey) {
  const definition = resourceDefinitions[resourceKey];
  const storageKey = `agrosync_resource_${resourceKey}`;
  const [records, setRecords] = useState<ResourceRecord[]>(definition.seed);
  const [loading, setLoading] = useState(true);
  const [dbConfigured, setDbConfigured] = useState(false);

  const persistLocal = useCallback(
    (items: ResourceRecord[]) => {
      const normalized = normalizeRecords(resourceKey, items);
      localStorage.setItem(storageKey, JSON.stringify(normalized));
      setRecords(normalized);
    },
    [resourceKey, storageKey]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/resources/${resourceKey}`, { cache: "no-store" });
      const data = (await response.json()) as ApiResponse;
      setDbConfigured(data.dbConfigured);
      if (data.dbConfigured) {
        setRecords(normalizeRecords(resourceKey, data.items));
      } else {
        const stored = localStorage.getItem(storageKey);
        const localItems = stored ? (JSON.parse(stored) as ResourceRecord[]) : definition.seed;
        persistLocal(localItems);
      }
    } catch {
      const stored = localStorage.getItem(storageKey);
      setRecords(stored ? (JSON.parse(stored) as ResourceRecord[]) : definition.seed);
      setDbConfigured(false);
    } finally {
      setLoading(false);
    }
  }, [definition.seed, persistLocal, resourceKey, storageKey]);

  useEffect(() => {
    void load();
  }, [load]);

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
          throw new Error(error.message ?? "No se pudo guardar.");
        }
        const saved = normalizeRecord(resourceKey, (await response.json()) as ResourceRecord);
        setRecords((current) => [saved, ...current]);
        return saved;
      }
      const saved = normalizeRecord(resourceKey, { ...normalizedPayload, id: payload.id || generateId(resourceKey.slice(0, 3).toUpperCase()) });
      persistLocal([saved, ...records]);
      return saved;
    },
    [dbConfigured, persistLocal, records, resourceKey]
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
          throw new Error(error.message ?? "No se pudo actualizar.");
        }
        const saved = normalizeRecord(resourceKey, (await response.json()) as ResourceRecord);
        setRecords((current) => current.map((item) => (item.id === id ? saved : item)));
        return saved;
      }
      const saved = normalizeRecord(resourceKey, { ...normalizedPayload, id });
      persistLocal(records.map((item) => (item.id === id ? saved : item)));
      return saved;
    },
    [dbConfigured, persistLocal, records, resourceKey]
  );

  const remove = useCallback(
    async (id: string) => {
      if (dbConfigured) {
        const response = await fetch(`/api/resources/${resourceKey}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("No se pudo eliminar.");
      }
      persistLocal(records.filter((item) => item.id !== id));
    },
    [dbConfigured, persistLocal, records, resourceKey]
  );

  return useMemo(
    () => ({ definition, records, loading, dbConfigured, create, update, remove, reload: load }),
    [create, dbConfigured, definition, load, loading, records, remove, update]
  );
}
