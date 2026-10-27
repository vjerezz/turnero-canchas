import { expect, test } from "@playwright/test";

for (const route of ["/", "/admin"]) {
  test(`base accesible y responsive ${route}`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath("page.png"), fullPage: true });
    await page.getByRole("link", { name: route === "/" ? "Soy un complejo" : "Portal de jugadores" }).click();
    await expect(page).toHaveURL(route === "/" ? "/admin" : "/");
    expect(errors).toEqual([]);
  });
}

test("ruta desconocida permite volver", async ({ page }) => {
  const response = await page.goto("/no-existe");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Volver al inicio" }).click();
  await expect(page).toHaveURL("/");
});

test("catálogo interno no disponible en producción", async ({ page }) => {
  const response = await page.goto("/dev/ui");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Solo desarrollo", { exact: true })).not.toBeVisible();
});

test("prototipo y fixtures no se muestran en rutas de producción", async ({ request, page }) => {
  for (const route of ["/demo", "/demo/admin", "/demo/admin/clientes", "/demo/complejos/los-alamos/reservar", "/demo/reservas/ejemplo"]) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(404);
  }
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Abrir prototipo F03" })).not.toBeVisible();
});
