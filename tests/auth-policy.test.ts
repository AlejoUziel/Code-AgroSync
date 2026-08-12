import { describe, expect, it } from "vitest";
import { publicRegistrationIdentity, roleForDepartment } from "@/lib/auth-policy";

describe("política de registro público", () => {
  it("crea siempre identidad Operativa sin privilegios administrativos", () => {
    expect(publicRegistrationIdentity()).toEqual({
      departamento: "Operativo",
      rol: "Administrador",
    });
  });

  it("reserva el rol Administrador IT al departamento interno correspondiente", () => {
    expect(roleForDepartment("AdministradorIT")).toBe("Administrador IT");
    expect(roleForDepartment("Operativo")).toBe("Administrador");
  });
});
