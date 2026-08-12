"use client";

type ChangeListener = () => void;
type StatusListener = (connected: boolean) => void;

const changeListeners = new Set<ChangeListener>();
const statusListeners = new Set<StatusListener>();
let eventSource: EventSource | null = null;
let connected = false;

function publishStatus(nextConnected: boolean) {
  connected = nextConnected;
  statusListeners.forEach((listener) => listener(connected));
}

function ensureConnection() {
  if (typeof window === "undefined" || eventSource) return;
  eventSource = new EventSource("/api/realtime");
  eventSource.addEventListener("change", () => {
    changeListeners.forEach((listener) => listener());
  });
  eventSource.onopen = () => publishStatus(true);
  eventSource.onerror = () => publishStatus(false);
}

function closeWhenUnused() {
  if (changeListeners.size || statusListeners.size || !eventSource) return;
  eventSource.close();
  eventSource = null;
  connected = false;
}

export function subscribeToRealtime(onChange: ChangeListener, onStatus?: StatusListener) {
  changeListeners.add(onChange);
  if (onStatus) {
    statusListeners.add(onStatus);
    onStatus(connected);
  }
  ensureConnection();
  return () => {
    changeListeners.delete(onChange);
    if (onStatus) statusListeners.delete(onStatus);
    closeWhenUnused();
  };
}
