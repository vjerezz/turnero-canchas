import { describe, expect, it } from "vitest";
import { parseSupabaseConfig } from "./config";

const valid = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example" };

describe("configuración Supabase", () => {
  it("acepta el origen y una clave pública", () => {
    expect(parseSupabaseConfig(valid)).toEqual(valid);
  });
  it.each([undefined, "", "sb_secret_private", "eyJservice_role"]) ("rechaza secretos y claves ausentes sin imprimirlos", (key) => {
    expect(() => parseSupabaseConfig({ ...valid, SUPABASE_PUBLISHABLE_KEY: key })).toThrow("clave pública");
    try { parseSupabaseConfig({ ...valid, SUPABASE_PUBLISHABLE_KEY: key }); } catch (error) {
      if (key) expect(String(error)).not.toContain(key);
    }
  });
  it.each(["http://example.supabase.co", "https://user:secret@example.supabase.co", "https://example.supabase.co/rest/v1", "https://example.supabase.co?secret=value", "https://example.supabase.co#fragment"]) ("rechaza orígenes inseguros o con datos extra: %s", (url) => {
    expect(() => parseSupabaseConfig({ ...valid, SUPABASE_URL: url })).toThrow("URL HTTPS");
  });
});
