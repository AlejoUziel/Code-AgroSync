"use client";

import { useCallback, useEffect, useState } from "react";

export type SessionUser = {
  userId: string;
  email: string;
  nombre: string;
  rol: string;
  departamento: string;
  departamentoLabel: string;
  empresaId: string;
  initials: string;
  sessionVersion: number;
  platformRole?: "none" | "platform_support" | "platform_admin";
};

let cachedUser: SessionUser | null | undefined;
let sessionRequest: Promise<SessionUser | null> | null = null;
let sessionUnauthorized = false;

function requestSession() {
  if (sessionRequest) return sessionRequest;
  sessionRequest = fetch("/api/session", { cache: "no-store" })
    .then(async (response) => {
      if (response.status === 401) {
        sessionUnauthorized = true;
        return null;
      }
      if (!response.ok) throw new Error(`Session service unavailable (${response.status})`);
      const data = await response.json();
      if (!data?.user) throw new Error("Session response did not include a user");
      sessionUnauthorized = false;
      return data.user as SessionUser;
    })
    .then((user) => {
      cachedUser = user;
      return user;
    })
    .finally(() => {
      sessionRequest = null;
    });
  return sessionRequest;
}

export function useSessionState() {
  const [user, setUser] = useState<SessionUser | null>(() => cachedUser ?? null);
  const [loading, setLoading] = useState(cachedUser === undefined);
  const [unauthorized, setUnauthorized] = useState(sessionUnauthorized);
  const [connectionError, setConnectionError] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const nextUser = await requestSession();
      setUser(nextUser);
      setUnauthorized(sessionUnauthorized);
      setConnectionError(false);
    } catch {
      // Conserva la cookie y permite reintentar cuando Neon/Vercel se recupere.
      setUnauthorized(false);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedUser !== undefined) return;
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const nextUser = await requestSession();
        if (!active) return;
        setUser(nextUser);
        setUnauthorized(sessionUnauthorized);
        setConnectionError(false);
        setLoading(false);
      } catch {
        if (!active) return;
        setUnauthorized(false);
        setConnectionError(true);
        setLoading(false);
        retryTimer = setTimeout(load, 2000);
      }
    };

    void load();

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return { user, loading, unauthorized, connectionError, retry: loadSession };
}

export function useSessionUser() {
  return useSessionState().user;
}
