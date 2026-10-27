import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("componentes, tema de portales, teclado y accesibilidad", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/ui");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.getByRole("heading", { level: 1 }).evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Bricolage Grotesque Variable");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("player.png"), fullPage: true, animations: "disabled" });
  await page.screenshot({ path: testInfo.outputPath("player-viewport.png"), animations: "disabled" });
  const scan = () => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect((await scan()).violations).toEqual([]);

  await page.getByRole("button", { name: "Validar ejemplo" }).click();
  await expect(page.getByLabel("Nombre", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Nombre", { exact: true }).fill("Valentina");
  await page.getByLabel("Deporte", { exact: true }).selectOption("tenis");
  await page.getByRole("button", { name: "Validar ejemplo" }).click();
  await expect(page.getByText("Ejemplo validado", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Valentina");
  await page.getByRole("button", { name: "Cerrar aviso" }).click();
  await page.getByRole("button", { name: "18:00 Disponible" }).click();
  await expect(page.getByRole("button", { name: "18:00 Seleccionado" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "21:00 Ocupado" })).toBeDisabled();

  for (const area of ["player", "admin"]) {
    if (area === "admin") await page.getByRole("button", { name: "Administración", exact: true }).click();
    const trigger = page.getByRole("button", { name: "Abrir diálogo", exact: true });
    const expectedColor = await trigger.evaluate((element) => getComputedStyle(element).backgroundColor);
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAttribute("data-area", area);
    await expect(page.getByLabel("Nota de ejemplo")).toBeFocused();
    expect(await dialog.getByRole("button", { name: "Listo" }).evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(expectedColor);
    for (let n = 0; n < 5; n++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
    expect((await scan()).violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`${area}-dialog.png`), animations: "disabled" });
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  await page.getByRole("button", { name: "Más acciones", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).not.toBeVisible();
  await page.getByRole("button", { name: "Abrir panel" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Entendido" }).click();
  await expect(page.getByRole("button", { name: "Abrir panel" })).toBeFocused();
  await page.getByRole("button", { name: "Mostrar ejemplo" }).click();
  await expect(page.getByText("Ejemplo disponible", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("admin.png"), fullPage: true, animations: "disabled" });
  expect(errors).toEqual([]);
});

test("navegación con teclado no queda tapada por barras", async ({ page, browserName }) => {
  await page.goto("/dev/ui");
  // This Windows WebKit build omits native links from sequential Tab navigation.
  // Chromium verifies discovery of the skip link; WebKit starts at that link.
  if (browserName === "webkit") await page.getByRole("link", { name: "Saltar al contenido" }).focus();
  else await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await page.keyboard.press("Enter");
  let checked = 0;
  for (let index = 0; index < 40; index++) {
    await page.keyboard.press("Tab");
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      if (element === document.body) return { end: true, visible: true };
      if (!(element instanceof HTMLElement)) return { visible: false, name: "sin foco" };
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return { visible: !!hit && (element === hit || element.contains(hit)), name: element.getAttribute("aria-label") ?? element.textContent?.slice(0, 80), y: rect.y };
    });
    if (focus.end) break;
    expect(focus.visible, JSON.stringify(focus)).toBe(true);
    checked++;
  }
  expect(checked).toBeGreaterThanOrEqual(20);
});

test("reflujo, objetivos táctiles y movimiento reducido", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/ui");
  for (const width of [320, 767, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const targets = await page.locator(".app-shell button:visible, .app-shell input:visible, .app-shell select:visible").evaluateAll((elements) => elements.map((element) => ({ name: element.textContent, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
    expect(targets.filter((rect) => rect.width < 44 || rect.height < 44)).toEqual([]);
  }
  await page.setViewportSize({ width: 640, height: 450 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator(".ui-spin").first().evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  await page.screenshot({ path: testInfo.outputPath("large-text.png"), fullPage: true, animations: "disabled" });
});
