import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ context: vi.fn(), rpc: vi.fn(), revalidate: vi.fn(), redirect: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ requireComplex: mocks.context }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { saveWeeklyHours } from "./hours-actions";

const court = "3e3a563d-274e-41a3-9d36-7f4278caa999";
const state = { message: "" };
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ court_id: court, version: "2", complex_id: "foreign", enabled_6: "on", opens_6: "18:00", closes_6: "02:00", overnight_6: "on" })) data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.context.mockResolvedValue({ supabase: { rpc: mocks.rpc }, complex: { id: "authorized" } });
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.redirect.mockImplementation(() => { throw new Error("redirect"); });
});

it("guarda el cierre del domingo en lunes usando el complejo de la sesión", async () => {
  await expect(saveWeeklyHours(state, form())).rejects.toThrow("redirect");
  expect(mocks.rpc).toHaveBeenCalledWith("replace_court_weekly_hours", {
    target_complex: "authorized", target_court: court, expected_version: 2,
    windows: [{ weekday: 6, opens_minute: 1080, closes_minute: 1560 }],
  });
});
it("rechaza una sesión sin acceso antes de escribir", async () => {
  mocks.context.mockRejectedValue(new Error("unauthorized"));
  await expect(saveWeeklyHours(state, form())).rejects.toThrow("unauthorized");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each([["court_id", "invalid"], ["version", "-1"], ["version", "2147483647"], ["opens_6", "24:00"], ["closes_6", ""], ["overnight_6", "off"]])("rechaza %s inválido sin escribir", async (key, value) => {
  const data = form(); data.set(key, value);
  expect((await saveWeeklyHours(state, data)).message).toBeTruthy();
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("rechaza superposición domingo/lunes antes de enviar", async () => {
  const data = form(); data.set("enabled_0", "on"); data.set("opens_0", "01:00"); data.set("closes_0", "03:00");
  expect((await saveWeeklyHours(state, data)).message).toContain("superpuestos");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("permite cerrar toda la semana aunque queden horas en campos deshabilitados", async () => {
  const data = form(); data.delete("enabled_6");
  await expect(saveWeeklyHours(state, data)).rejects.toThrow("redirect");
  expect(mocks.rpc.mock.calls[0][1].windows).toEqual([]);
});
it.each([["40001", "Otra persona"], ["23P01", "superpuestos"], ["42501", "Revisá tu acceso"]])("informa el rechazo %s sin anunciar guardado ni filtrar detalles", async (code, message) => {
  mocks.rpc.mockResolvedValue({ error: { code, message: "private database details" } });
  const result = await saveWeeklyHours(state, form());
  expect(result.message).toContain(message);
  expect(result.message).not.toContain("private database details");
  expect(mocks.revalidate).not.toHaveBeenCalled();
  expect(mocks.redirect).not.toHaveBeenCalled();
});
