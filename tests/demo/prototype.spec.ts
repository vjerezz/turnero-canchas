import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("jugador: filtros, reserva invitada, conflicto y resultado", async ({ page }) => {
  await page.goto("/demo");
  const openFilters = async () => { const trigger = page.getByRole("button", { name: "Modificar búsqueda" }); if (await trigger.isVisible()) await trigger.click(); };
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await openFilters();
  await page.getByRole("combobox", { name: "Deporte", exact: true }).selectOption("Pádel");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Club Norte Pádel", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "La Terraza Fútbol", exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "Techada", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Complejo Los Álamos", exact: true })).toBeVisible();
  await openFilters();
  await page.getByRole("textbox", { name: "Complejo o barrio" }).fill("sin resultados");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText("No encontramos canchas con esos filtros", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await page.getByRole("link", { name: "Ver complejo", exact: true }).first().click();
  await page.getByRole("link", { name: "Elegir cancha y horario" }).click();
  await page.getByRole("button", { name: "Simular solicitud" }).click();
  await expect(page.getByLabel("Nombre y apellido")).toBeFocused();
  await page.getByLabel("Nombre y apellido").fill("Invitado Demo");
  await page.getByLabel("Email", { exact: true }).fill("invitado@example.com");
  await page.getByRole("button", { name: "19:00 Disponible" }).click();
  await page.getByText("Probar un conflicto o error", { exact: true }).click();
  await page.getByLabel("Resultado de la solicitud").selectOption("conflict");
  await page.getByRole("button", { name: "Simular solicitud" }).click();
  await expect(page.getByText("Ese horario acaba de ocuparse. Elegí otro para continuar.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Nombre y apellido")).toHaveValue("Invitado Demo");
  await page.getByRole("button", { name: "20:00 Disponible" }).click();
  await page.getByRole("button", { name: "Simular solicitud" }).click();
  await expect(page).toHaveURL(/\/demo\/reservas\/ejemplo$/);
  await expect(page.getByRole("heading", { name: "Solicitud de ejemplo recibida" })).toBeVisible();
  await page.getByRole("button", { name: "Simular inicio de pago" }).click();
  await expect(page.getByRole("heading", { name: "El pago está en proceso" })).toBeVisible();
  await page.getByLabel("Vista del resultado").selectOption("rejected");
  await page.getByRole("button", { name: "Simular reintento" }).click();
  await page.getByLabel("Vista del resultado").selectOption("approved");
  await expect(page.getByText("Fin del recorrido de demostración.", { exact: true })).toBeVisible();
});

test("acceso privado y recuperación no revelan reservas por ID o email", async ({ page }) => {
  await page.goto("/demo/reservas/cualquier-id");
  await expect(page.getByRole("heading", { name: "Necesitás un enlace privado" })).toBeVisible();
  await page.getByRole("link", { name: "Solicitar enlace", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("desconocido@example.com");
  await page.getByRole("button", { name: "Solicitar enlace de ejemplo" }).click();
  await expect(page.getByText("No se envió ningún correo.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Ver siguiente pantalla" }).click();
  await expect(page.getByRole("heading", { name: "Este enlace no está disponible" })).toBeVisible();
});

test("admin: creación local, conflicto, cambio de contexto y permisos de ejemplo", async ({ page }) => {
  await page.goto("/demo/admin/calendario");
  const mobileCourt = page.getByRole("combobox", { name: "Cancha en agenda" });
  const hasCourtSelector = await mobileCourt.isVisible();
  if (hasCourtSelector) await mobileCourt.selectOption("alamos-2");
  await page.getByRole("button", { name: "Nueva reserva", exact: true }).click();
  const dialog = page.getByRole("dialog");
  if (hasCourtSelector) await expect(dialog.getByLabel("Cancha del turno")).toHaveValue("alamos-2");
  await dialog.getByLabel("Nombre del cliente").fill("Cliente Demo");
  await dialog.getByLabel("Cancha del turno").selectOption("alamos-1");
  await dialog.getByLabel("Hora de inicio").selectOption("18:00");
  await dialog.getByRole("button", { name: "Guardar ejemplo" }).click();
  await expect(dialog.getByText(/Ese intervalo está ocupado/)).toBeVisible();
  await dialog.getByLabel("Hora de inicio").selectOption("20:00");
  await dialog.getByRole("button", { name: "Guardar ejemplo" }).click();
  if (hasCourtSelector) await mobileCourt.selectOption("alamos-1");
  await expect(page.getByText("Cliente Demo", { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByText("Contexto de demostración", { exact: false }).click();
  await page.getByLabel("Complejo de demostración").selectOption("norte");
  await expect(page.getByText("Cliente Demo", { exact: true })).not.toBeVisible();
  await page.goto("/demo/admin/equipo");
  // A full reload resets fixture context; simulate administrator again explicitly.
  await page.getByText("Contexto de demostración", { exact: false }).click();
  await page.getByLabel("Rol de demostración").selectOption("Administrador");
  await expect(page.getByRole("heading", { name: "Esta sección es del propietario" })).toBeVisible();
});

test("gestión: cancha, cliente e invitación de demostración", async ({ page }) => {
  await page.goto("/demo/admin/canchas/nueva");
  await page.getByLabel("Nombre de la cancha").fill("Cancha de prueba");
  await page.getByRole("button", { name: "Guardar cancha de ejemplo" }).click();
  await expect(page.getByRole("heading", { name: "Cancha de prueba", exact: true })).toBeVisible();
  await page.goto("/demo/admin/clientes");
  await page.getByRole("button", { name: "Agregar cliente" }).click();
  await page.getByRole("dialog").getByLabel("Nombre del cliente").fill("Cliente de prueba");
  await page.getByRole("dialog").getByLabel("Email del cliente").fill("prueba@example.com");
  await page.getByRole("button", { name: "Agregar ejemplo" }).click();
  await page.getByLabel("Buscar cliente").fill("Cliente de prueba");
  await page.getByRole("link", { name: "Ver ficha" }).click();
  await expect(page.getByRole("heading", { name: "Cliente de prueba" })).toBeVisible();
  await page.goto("/demo/admin/equipo");
  await page.getByLabel("Email a invitar").fill("invitado@example.com");
  await page.getByRole("button", { name: "Simular invitación" }).click();
  await expect(page.getByText("invitado@example.com", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Ver aceptación de ejemplo" }).click();
  await page.getByRole("button", { name: "Simular aceptación" }).click();
  await expect(page.getByText("Aceptación simulada", { exact: true })).toBeVisible();
});

test("precio cambiado, enlace válido e ingreso del equipo", async ({ page }) => {
  await page.goto("/demo/complejos/los-alamos/reservar");
  await page.getByRole("button", { name: "19:00 Disponible" }).click();
  await page.getByLabel("Nombre y apellido").fill("Invitado Ejemplo");
  await page.getByLabel("Email", { exact: true }).fill("invitado@example.com");
  await page.getByText("Probar un conflicto o error", { exact: true }).click();
  await page.getByLabel("Resultado de la solicitud").selectOption("price");
  await page.getByRole("button", { name: "Simular solicitud" }).click();
  await page.getByRole("button", { name: /Aceptar total de ejemplo/ }).click();
  await page.getByRole("button", { name: "Simular solicitud" }).click();
  await expect(page.locator(".demo-price")).toContainText("40.000");
  await page.goto("/demo/acceso-reserva");
  await page.getByRole("button", { name: "Probar enlace válido de ejemplo" }).click();
  await page.getByRole("link", { name: "Simular canje y ver ejemplo" }).click();
  await expect(page.getByRole("heading", { name: "Solicitud de ejemplo recibida" })).toBeVisible();
  await page.goto("/demo/admin/ingresar");
  await page.getByLabel("Email del equipo").fill("equipo@example.com");
  await page.getByLabel("Contraseña de ejemplo").fill("solo-demostracion");
  await page.getByRole("button", { name: "Ingresar a la demo" }).click();
  await page.getByRole("button", { name: "Entrar a Club Norte Pádel" }).click();
  await expect(page.getByRole("heading", { name: "Panel del complejo" })).toBeVisible();
  await expect(page.getByText("Gonzalo Pérez", { exact: true })).not.toBeVisible();
});

const routes = ["", "complejos/los-alamos", "complejos/los-alamos/reservar", "reservas/ejemplo", "mis-reservas", "acceso-reserva", "admin", "admin/calendario", "admin/canchas", "admin/canchas/alamos-1", "admin/clientes", "admin/clientes/c1", "admin/equipo", "admin/configuracion", "admin/ingresar", "admin/recuperar-acceso", "admin/seleccionar-complejo", "admin/invitaciones/aceptar", "recorridos"];
test("pantallas: responsive, contraste y capturas", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of routes) {
    const response = await page.goto(`/demo/${route}`);
    expect(response?.status(), route).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
    const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations;
    expect(violations, route).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll("/", "-") || "catalogo"}.png`), fullPage: true, animations: "disabled" });
  }
  expect(errors).toEqual([]);
});

test("reflujo a 320 px y texto aumentado", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  for (const route of ["", "complejos/los-alamos/reservar", "admin/calendario", "admin/configuracion"]) {
    await page.goto(`/demo/${route}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
  }
  await page.setViewportSize({ width: 640, height: 450 });
  await page.goto("/demo");
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("geometría aprobada de tarjetas, días y agenda", async ({ page }) => {
  await page.goto("/demo");
  const media = page.locator(".complex-art .court-art").first();
  await expect(media).toHaveCSS("height", page.viewportSize()!.width < 768 ? "112px" : "168px");
  await expect(page.locator(".complex-card").first()).toHaveCSS("border-radius", "16px");
  await expect(page.locator(".complex-card").first()).toHaveCSS("box-shadow", "none");
  await page.goto("/demo/complejos/los-alamos/reservar");
  await expect(page.locator(".demo-day").first()).toHaveCSS("min-height", "72px");
  if (page.viewportSize()!.width >= 1024) {
    await page.goto("/demo/admin/calendario");
    await expect(page.locator(".calendar-hour").first()).toHaveCSS("height", "72px");
    await expect(page.locator(".calendar-column-header").first()).toHaveCSS("height", "52px");
    await expect(page.locator(".calendar-time")).toHaveCSS("width", "56px");
  }
});
