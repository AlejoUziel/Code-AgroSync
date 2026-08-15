import { expect, test } from "@playwright/test";

test("usuario configurado entra y ve datos del tenant", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  test.skip(!email || !password, "E2E_EMAIL y E2E_PASSWORD no estan configurados.");
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email!);
  await page.getByLabel("Contrasena").fill(password!);
  await page.getByRole("button", { name: /iniciar sesion/i }).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 15_000 });
  await expect(page.getByText(/validando sesión segura/i)).toHaveCount(0, { timeout: 15_000 });
});

