"use client";

import { useEffect, useState } from "react";

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

function requestSession() {
  if (sessionRequest) return sessionRequest;
  sessionRequest = fetch("/api/session", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => data?.user ?? null)
    .catch(() => null)
    .then((user) => {
      cachedUser = user;
      return user;
    });
  return sessionRequest;
}

export function useSessionState() {
  const [user, setUser] = useState<SessionUser | null>(() => cachedUser ?? null);
  const [loading, setLoading] = useState(cachedUser === undefined);

  useEffect(() => {
    if (cachedUser !== undefined) return;
    let active = true;
    requestSession().then((nextUser) => {
      if (active) {
        setUser(nextUser);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}

export function useSessionUser() {
  return useSessionState().user;
}
