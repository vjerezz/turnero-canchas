import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }));
vi.mock("./session", () => ({ requireUser: mocks.user }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { acceptInvitation } from "./accept-invitation";
const id = "3e3a563d-274e-41a3-9d36-7f4278caa999";
function input(token = id + id) { const form = new FormData(); form.set("token", token); return form; }
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ supabase: { rpc: mocks.rpc } });
  mocks.rpc.mockResolvedValue({ data: id, error: null });
});
it("exige sesión antes de enviar la invitación a la base", async () => {
  mocks.user.mockRejectedValue(new Error("unauthorized"));
  await expect(acceptInvitation({ message: "" }, input())).rejects.toThrow("unauthorized");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("rechaza códigos malformados sin consultar la base", async () => {
  await acceptInvitation({ message: "" }, input("invalid"));
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("acepta mediante la función SQL y actualiza la selección de complejos", async () => {
  await expect(acceptInvitation({ message: "" }, input())).rejects.toThrow("redirect:/admin/seleccionar-complejo");
  expect(mocks.rpc).toHaveBeenCalledWith("accept_team_invitation", { invitation_token: id + id });
  expect(mocks.revalidate).toHaveBeenCalledWith("/admin", "layout");
});
it("no expone detalles ni códigos rechazados por la base", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: "private details" } });
  const result = await acceptInvitation({ message: "" }, input());
  expect(result.message).not.toContain("private details");
  expect(result.message).not.toContain(id);
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
