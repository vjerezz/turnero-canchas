import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("formulario de reservas conserva datos y admite reintento por teclado", async ({ page }, testInfo) => {
  await page.goto("/dev/reservas");
  await expect(page.getByRole("heading", { name: "Nueva reserva" })).toBeVisible();
  await page.getByLabel("Nombre del cliente").fill("Jugador de prueba");
  await page.getByLabel("Email del cliente").fill("jugador@example.com");
  await expect(page.getByLabel("Nombre del cliente")).toHaveValue("Jugador de prueba");
  await page.getByLabel("Email del cliente").press("Tab");
  const submit = page.getByRole("button", { name: "Crear reserva pendiente" });
  await expect(submit).toBeFocused();
  await page.keyboard.press("Space");
  await expect(submit).toBeDisabled();
  await expect(page.locator("form").getByRole("alert")).toContainText("acaba de ocuparse");
  await expect(page.getByLabel("Nombre del cliente")).toHaveValue("Jugador de prueba");
  await expect(page.getByLabel("Email del cliente")).toHaveValue("jugador@example.com");
  await expect(page.getByTestId("submission")).toContainText("Jugador de prueba · jugador@example.com");
  for (const [scenario, message] of [["price", "precio cambió"], ["uncertain", "mismos datos"]]) {
    await page.getByLabel("Escenario de prueba").selectOption(scenario);
    await submit.click();
    await expect(page.locator("form").getByRole("alert")).toContainText(message);
    await expect(page.getByLabel("Nombre del cliente")).toHaveValue("Jugador de prueba");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("reservation-form.png"), fullPage: true });
});
