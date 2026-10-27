import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ context: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }));
vi.mock("./session", () => ({ requireComplex: mocks.context }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { revokeTeamAccess } from "./team-actions";

const id = "3e3a563d-274e-41a3-9d36-7f4278caa999";
function form(kind = "administrator", target = id) {
  const data = new FormData();
  data.set("kind", kind); data.set("id", target); data.set("complex_id", "foreign-complex");
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.context.mockResolvedValue({ supabase: { rpc: mocks.rpc }, complex: { id: "authorized-complex" }, membership: { role: "owner" } });
  mocks.rpc.mockResolvedValue({ error: null });
});
it("rechaza administradores aunque envíen una solicitud directa", async () => {
  mocks.context.mockResolvedValue({ membership: { role: "admin" } });
  expect((await revokeTeamAccess({ message: "" }, form())).success).not.toBe(true);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each([["other", id], ["administrator", "invalid"]])("rechaza entradas inválidas", async (kind, target) => {
  await revokeTeamAccess({ message: "" }, form(kind, target));
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each(["administrator", "invitation"])("usa el complejo autorizado al revocar %s", async (kind) => {
  expect((await revokeTeamAccess({ message: "" }, form(kind))).success).toBe(true);
  expect(mocks.rpc).toHaveBeenCalledWith(kind === "administrator" ? "revoke_administrator" : "revoke_team_invitation", {
    target_complex: "authorized-complex", [kind === "administrator" ? "target_user" : "target_invitation"]: id,
  });
  expect(mocks.revalidate).toHaveBeenCalledWith("/admin", "layout");
});
it("no anuncia éxito ni filtra errores internos si PostgreSQL deniega", async () => {
  mocks.rpc.mockResolvedValue({ error: { message: "private details" } });
  const result = await revokeTeamAccess({ message: "" }, form());
  expect(result.success).not.toBe(true);
  expect(result.message).not.toContain("private details");
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
