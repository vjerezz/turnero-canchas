import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ context: vi.fn(), rpc: vi.fn(), from: vi.fn(), fetch: vi.fn() }));
vi.mock("./session", () => ({ requireComplex: mocks.context }));
vi.mock("@/lib/env", () => ({ getServerEnvironment: () => ({ APP_URL: "http://localhost:3000" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { inviteAdministrator } from "./invite-administrator";
const invitation = { invitation_id: "test-id", invitation_token: "private-token" };
const form = () => { const f = new FormData(); f.set("email", "recipient@example.com"); return f; };
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("RESEND_API_KEY", "test-secret"); vi.stubEnv("INVITATION_FROM", "team@example.com");
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.context.mockResolvedValue({ membership: { role: "owner" }, complex: { id: "complex-a", name: "A" }, supabase: { rpc: mocks.rpc, from: mocks.from } });
  mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ gte: async () => ({ count: 0, error: null }) }) }) });
  mocks.rpc.mockResolvedValue({ data: [invitation], error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("no crea invitaciones sin correo configurado", async () => {
  vi.stubEnv("RESEND_API_KEY", "");
  await inviteAdministrator({ message: "" }, form());
  expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
});
it("respeta el rechazo atómico de la base antes de contactar al correo", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { code: "P0001" } });
  const result = await inviteAdministrator({ message: "" }, form());
  expect(result.message).toContain("Esperá un minuto");
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it("rechaza un administrador antes de crear o enviar", async () => {
  mocks.context.mockResolvedValue({ membership: { role: "admin" } });
  await inviteAdministrator({ message: "" }, form());
  expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
});
it("revoca una invitación si el proveedor falla sin exponer el token", async () => {
  mocks.fetch.mockRejectedValue(new Error("private-token"));
  const result = await inviteAdministrator({ message: "" }, form());
  expect(mocks.rpc).toHaveBeenLastCalledWith("revoke_team_invitation", { target_complex: "complex-a", target_invitation: "test-id" });
  expect(result.success).not.toBe(true); expect(result.message).not.toContain("private-token");
});
it("solo anuncia envío aceptado cuando el proveedor responde correctamente", async () => {
  mocks.fetch.mockResolvedValue({ ok: true });
  const result = await inviteAdministrator({ message: "" }, form());
  expect(result.success).toBe(true); expect(JSON.stringify(result)).not.toContain("private-token");
  expect(mocks.rpc).toHaveBeenCalledWith("invite_administrator", { target_complex: "complex-a", recipient_email: "recipient@example.com" });
});
