import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), is: vi.fn(),
  cookieGet: vi.fn(), createClient: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookieGet }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.createClient }));

import { getUserMemberships, requireComplex, requireUser } from "./session";

const user = { id: "user-a", email_confirmed_at: "2026-10-26T00:00:00Z" };
const membership = { complex_id: "complex-a", role: "owner", complexes: { id: "complex-a", name: "Complejo A" } };
const client = { auth: { getUser: mocks.getUser }, from: mocks.from };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_example");
  mocks.createClient.mockResolvedValue(client);
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ is: mocks.is });
  mocks.is.mockResolvedValue({ data: [membership], error: null });
  mocks.cookieGet.mockReturnValue({ value: "complex-a" });
});
afterEach(() => vi.unstubAllEnvs());

describe("autorización del equipo en servidor", () => {
  it.each(["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"])("sin %s deriva al ingreso sin crear el cliente", async (key) => {
    vi.stubEnv(key, "");
    await expect(requireUser()).rejects.toThrow("redirect:/admin/ingresar");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each([
    { data: { user: null }, error: null },
    { data: { user }, error: { message: "expired" } },
    { data: { user: { ...user, email_confirmed_at: null } }, error: null },
  ])("rechaza sesiones ausentes, vencidas o sin email verificado", async (response) => {
    mocks.getUser.mockResolvedValue(response);
    await expect(requireComplex()).rejects.toThrow("redirect:/admin/ingresar");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("consulta membresías vigentes de la identidad verificada", async () => {
    const result = await getUserMemberships();
    expect(result.user).toEqual(user);
    expect(mocks.from).toHaveBeenCalledWith("memberships");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", user.id);
    expect(mocks.is).toHaveBeenCalledWith("revoked_at", null);
  });

  it.each([undefined, { value: "complex-b" }, { value: "invalid" }])("no concede acceso por una cookie ausente o ajena", async (cookie) => {
    mocks.cookieGet.mockReturnValue(cookie);
    await expect(requireComplex()).rejects.toThrow("redirect:/admin/seleccionar-complejo");
  });

  it("rechaza una membresía que ya no permite leer el complejo", async () => {
    mocks.is.mockResolvedValue({ data: [{ ...membership, complexes: null }], error: null });
    await expect(requireComplex()).rejects.toThrow("redirect:/admin/seleccionar-complejo");
  });

  it("vuelve a consultar y rechaza una membresía revocada entre peticiones", async () => {
    await expect(requireComplex()).resolves.toMatchObject({ complex: membership.complexes });
    mocks.is.mockResolvedValue({ data: [], error: null });
    await expect(requireComplex()).rejects.toThrow("redirect:/admin/seleccionar-complejo");
    expect(mocks.getUser).toHaveBeenCalledTimes(2);
    expect(mocks.is).toHaveBeenCalledTimes(2);
  });

  it("permite cambiar entre dos complejos con membresías vigentes", async () => {
    const second = { ...membership, complex_id: "complex-b", role: "admin", complexes: { id: "complex-b", name: "Complejo B" } };
    mocks.is.mockResolvedValue({ data: [membership, second], error: null });
    mocks.cookieGet.mockReturnValue({ value: "complex-b" });
    await expect(requireComplex()).resolves.toMatchObject({ membership: second, complex: second.complexes });
  });

  it("falla cerrado y no expone detalles del proveedor si la consulta falla", async () => {
    mocks.is.mockResolvedValue({ data: null, error: { message: "private database details" } });
    await expect(requireComplex()).rejects.toThrow("No se pudo consultar el acceso a los complejos.");
  });
});
