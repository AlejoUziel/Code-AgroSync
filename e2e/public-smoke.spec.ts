import { expect, test } from "@playwright/test";

test("login y recuperacion son accesibles", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /bienvenido/i })).toBeVisible();
  await page.getByRole("link", { name: /olvidaste/i }).click();
  await expect(page).toHaveURL(/recuperar-contrasena/);
});

test("la vista movil no tiene desbordamiento horizontal", async ({ page }) => {
  await page.goto("/login");
  const dimensions = await page.evaluate(() => ({ inner: window.innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.inner);
});

test("los headers de seguridad se publican", async ({ request }) => {
  const response = await request.get("/login");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
});

test("health informa la dependencia central", async ({ request }) => {
  const response = await request.get("/api/health");
  expect([200, 503]).toContain(response.status());
  const body = await response.json();
  expect(body).toHaveProperty("dependencies.database");
});

