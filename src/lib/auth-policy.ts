import type { Departamento } from "@/lib/departments";

export const PUBLIC_REGISTRATION_DEPARTMENT: Departamento = "Operativo";

export function roleForDepartment(departamento: string) {
  return departamento === "AdministradorIT" ? "Administrador IT" : "Administrador";
}

export function publicRegistrationIdentity() {
  return {
    departamento: PUBLIC_REGISTRATION_DEPARTMENT,
    rol: roleForDepartment(PUBLIC_REGISTRATION_DEPARTMENT),
  };
}
