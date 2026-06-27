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
};

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return user;
}
