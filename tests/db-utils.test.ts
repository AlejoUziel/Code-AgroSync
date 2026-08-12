import { describe, expect, it } from "vitest";
import { compileNamedQuery, hardenedPostgresUrl } from "@/lib/db-utils";

describe("compileNamedQuery", () => {
  it("reutiliza el mismo parámetro nombrado", () => {
    expect(compileNamedQuery("SELECT :id, :name, :id", { id: 7, name: "Parcela" })).toEqual({
      text: "SELECT $1, $2, $1",
      parameters: [7, "Parcela"],
    });
  });

  it("no interpreta los casts nativos de PostgreSQL como parámetros", () => {
    expect(compileNamedQuery("SELECT :payload::jsonb", { payload: "{}" })).toEqual({
      text: "SELECT $1::jsonb",
      parameters: ["{}"],
    });
  });

  it("falla de forma explícita cuando falta un valor", () => {
    expect(() => compileNamedQuery("SELECT :missing")).toThrow("Falta el parametro SQL :missing.");
  });
});

describe("hardenedPostgresUrl", () => {
  it("eleva SSL a verify-full", () => {
    const value = hardenedPostgresUrl("postgresql://user:secret@example.com/db?sslmode=require");
    expect(value).toContain("sslmode=verify-full");
  });

  it("preserva una política SSL ya estricta", () => {
    const source = "postgresql://user:secret@example.com/db?sslmode=verify-full";
    expect(hardenedPostgresUrl(source)).toBe(source);
  });
});
