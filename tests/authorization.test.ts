import { describe, expect, it } from "vitest";
import { canAccessResource } from "@/lib/authorization";
import type { SessionPayload } from "@/lib/session";

function session(overrides: Partial<SessionPayload>): SessionPayload {
  return {
    userId: "USR-001",
    email: "usuario@example.com",
    nombre: "Usuario",
    rol: "Operador",
    departamento: "Operativo",
    empresaId: "EMP-001",
    sessionVersion: 1,
    platformRole: "none",
    ...overrides,
  };
}

describe("canAccessResource", () => {
  it("limita a un operador a recursos operativos", () => {
    expect(canAccessResource(session({}), "parcelas")).toBe(true);
    expect(canAccessResource(session({}), "finanzas")).toBe(false);
  });

  it("permite a un administrador de empresa operar todos sus modulos", () => {
    expect(canAccessResource(session({ rol: "Administrador" }), "finanzas")).toBe(true);
    expect(canAccessResource(session({ rol: "Administrador" }), "alertas")).toBe(true);
  });

  it("reconoce al administrador de plataforma por platformRole", () => {
    expect(canAccessResource(session({ departamento: "Administrativo", platformRole: "platform_admin" }), "cultivos")).toBe(true);
  });
});
