import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ context: vi.fn(), rpc: vi.fn(), revalidate: vi.fn(), redirect: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ requireComplex: mocks.context }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { createReservation } from "./actions";
const court = "3e3a563d-274e-41a3-9d36-7f4278caa999";
const request = "3e3a563d-274e-41a3-9d36-7f4278caa998";
function form() {
  const data = new FormData();
  Object.entries({ court_id: court, service_date: "2026-11-10", minute: "1080", request_id: request, name: "Jugador", email: "jugador@example.com", expected_total: "3000000", complex_id: "foreign" }).forEach(([k, v]) => data.set(k, v));
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.context.mockResolvedValue({ supabase: { rpc: mocks.rpc }, complex: { id: "authorized" } });
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.redirect.mockImplementation(() => { throw new Error("redirect"); });
});
it("usa complejo de sesión y conserva la clave para reintentar", async () => {
  await expect(createReservation({ message: "" }, form())).rejects.toThrow("redirect");
  expect(mocks.rpc).toHaveBeenCalledWith("create_quoted_team_reservation", {
    target_complex: "authorized", target_court: court, target_date: "2026-11-10", target_minute: 1080,
    guest_name: "Jugador", guest_email: "jugador@example.com", idempotency_key: request, expected_total: 3000000,
  });
  expect(mocks.redirect.mock.calls[0][0]).toContain(`solicitud=${request}`);
});
it.each([["request_id", "invalid"], ["minute", "-1"], ["service_date", "2026-02-30"], ["email", "invalid"], ["expected_total", "-1"]])("rechaza %s antes de escribir", async (key, value) => {
  const data = form(); data.set(key, value);
  expect((await createReservation({ message: "" }, data)).message).toBeTruthy();
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each([["23P01", "ocuparse"], ["P0001", "precio cambió"], ["42501", "acceso"], ["22023", "válidos"]])("informa %s sin filtrar detalles", async (code, expected) => {
  mocks.rpc.mockResolvedValue({ error: { code, message: "private details" } });
  const result = await createReservation({ message: "" }, form());
  expect(result.message).toContain(expected);
  expect(result.message).not.toContain("private details");
  expect(mocks.redirect).not.toHaveBeenCalled();
});
it("permite reintentar un resultado incierto sin anunciar éxito", async () => {
  mocks.rpc.mockRejectedValue(new Error("network"));
  expect((await createReservation({ message: "" }, form())).message).toContain("mismos datos");
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it("exige autenticación en cada operación", async () => {
  mocks.context.mockRejectedValue(new Error("unauthorized"));
  await expect(createReservation({ message: "" }, form())).rejects.toThrow("unauthorized");
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("normaliza espacios y mayúsculas del email antes de validar", async () => {
  const data = form(); data.set("email", "  JUGADOR@EXAMPLE.COM  ");
  await expect(createReservation({ message: "" }, data)).rejects.toThrow("redirect");
  expect(mocks.rpc.mock.calls[0][1].guest_email).toBe("jugador@example.com");
});
