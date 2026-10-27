import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("el panel exige sesión aunque se falsifique el complejo seleccionado", async ({ page, context }) => {
  await context.addCookies([{ name: "turnero-complex", value: "00000000-0000-4000-8000-000000000001", domain: "127.0.0.1", path: "/admin" }]);
  for (const route of ["/admin", "/admin/seleccionar-complejo", "/admin/nueva-contrasena"]) {
    await page.goto(route);
    await expect(page).toHaveURL("/admin/ingresar");
    await expect(page.getByRole("heading", { name: "Ingresá a Turnero" })).toBeVisible();
  }
});

test("ingreso y recuperación accesibles, sin datos privados ni caché compartida", async ({ page }, testInfo) => {
  const response = await page.goto("/admin/ingresar");
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Contraseña", { exact: true })).toHaveAttribute("type", "password");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("login.png"), fullPage: true });
  await page.getByRole("link", { name: "Olvidé mi contraseña" }).click();
  await expect(page.getByRole("heading", { name: "Recuperá tu acceso" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("recover.png"), fullPage: true });
  // No enviar correo ni probar contraseñas de terceros en la suite de presentación.
  await page.getByRole("link", { name: "Volver al ingreso" }).click();
  await expect(page).toHaveURL("/admin/ingresar");
});

test("el callback inválido ignora destinos externos", async ({ request }) => {
  const response = await request.get("/auth/callback?next=https://example.org/", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toBe("http://localhost:3000/admin/ingresar?error=enlace");
  expect(response.headers()["cache-control"]).toContain("no-store");
});
