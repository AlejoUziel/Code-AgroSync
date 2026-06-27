export type Departamento = "AdministradorIT" | "Administrativo" | "Operativo" | "Tecnologico";

export const departamentos: { value: Departamento; label: string; home: string; prefixes: string[] }[] = [
  { value: "AdministradorIT", label: "Administrador IT", home: "/", prefixes: ["/admin", "/ops", "/tech"] },
  { value: "Administrativo", label: "Administrativo", home: "/", prefixes: ["/admin"] },
  { value: "Operativo", label: "Operativo", home: "/", prefixes: ["/ops"] },
  { value: "Tecnologico", label: "Tecnologico", home: "/", prefixes: ["/tech"] },
];

export function normalizeDepartamento(value?: string | null): Departamento {
  if (value === "AdministradorIT" || value === "Operativo" || value === "Tecnologico" || value === "Administrativo") return value;
  return "Administrativo";
}

export function departamentoLabel(value?: string | null) {
  return departamentos.find((item) => item.value === normalizeDepartamento(value))?.label ?? "Administrativo";
}

export function departamentoHome(value?: string | null) {
  return departamentos.find((item) => item.value === normalizeDepartamento(value))?.home ?? "/";
}

export function canAccessDepartamentoPath(value: string | undefined | null, pathname: string) {
  if (pathname === "/") return true;
  if (normalizeDepartamento(value) === "AdministradorIT") return true;
  const departamento = departamentos.find((item) => item.value === normalizeDepartamento(value));
  if (!departamento) return false;
  return departamento.prefixes.some((prefix) => pathname.startsWith(prefix));
}
