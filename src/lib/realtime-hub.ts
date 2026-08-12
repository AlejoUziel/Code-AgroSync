import { Client } from "pg";
import { hardenedPostgresUrl } from "@/lib/db-utils";

type Listener = (payload: string) => void;

type RealtimeHub = {
  client: Client | null;
  connecting: Promise<void> | null;
  listeners: Set<Listener>;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
};

const globalHub = globalThis as typeof globalThis & { __agrosyncRealtimeHub?: RealtimeHub };

const hub = globalHub.__agrosyncRealtimeHub ?? {
  client: null,
  connecting: null,
  listeners: new Set<Listener>(),
  reconnectTimer: null,
};

globalHub.__agrosyncRealtimeHub = hub;

function connectionString() {
  return hardenedPostgresUrl(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);
}

function scheduleReconnect() {
  if (hub.reconnectTimer || hub.listeners.size === 0) return;
  hub.reconnectTimer = setTimeout(() => {
    hub.reconnectTimer = null;
    void ensureConnected();
  }, 2_000);
}

async function ensureConnected() {
  if (hub.client || hub.connecting) return hub.connecting;
  const url = connectionString();
  if (!url?.startsWith("postgres")) throw new Error("Base de datos no configurada.");

  hub.connecting = (async () => {
    const client = new Client({ connectionString: url, application_name: "agrosync-realtime-hub" });
    client.on("notification", (message) => {
      if (message.channel !== "agrosync_changes") return;
      const payload = message.payload ?? "{}";
      hub.listeners.forEach((listener) => listener(payload));
    });
    client.on("error", () => {
      if (hub.client === client) hub.client = null;
      void client.end().catch(() => undefined);
      scheduleReconnect();
    });
    await client.connect();
    await client.query("LISTEN agrosync_changes");
    hub.client = client;
  })();

  try {
    await hub.connecting;
  } finally {
    hub.connecting = null;
  }
}

export async function subscribeToDatabaseChanges(listener: Listener) {
  hub.listeners.add(listener);
  try {
    await ensureConnected();
  } catch (error) {
    hub.listeners.delete(listener);
    throw error;
  }

  return () => {
    hub.listeners.delete(listener);
    if (hub.listeners.size === 0 && hub.reconnectTimer) {
      clearTimeout(hub.reconnectTimer);
      hub.reconnectTimer = null;
    }
    if (hub.listeners.size === 0 && hub.client) {
      const idleClient = hub.client;
      hub.client = null;
      void idleClient.end().catch(() => undefined);
    }
  };
}
