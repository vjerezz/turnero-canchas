import { describe, expect, it } from "vitest";
import { parseEnvironment } from "./env-schema";

describe("configuración del origen", () => {
  it("permite desarrollo sin credenciales externas", () => {
    expect(parseEnvironment({}).APP_URL).toBe("http://localhost:3000");
  });
  it("acepta HTTPS y HTTP local", () => {
    for (const APP_URL of ["https://turnero.example", "http://127.0.0.1:3100"]) {
      expect(parseEnvironment({ APP_URL }).APP_URL).toBe(APP_URL);
    }
  });
  it.each(["http://turnero.example", "https://turnero.example/ruta", "https://turnero.example?token=privado", "no-es-url", ""])("rechaza origen inválido %s", (APP_URL) => {
    expect(() => parseEnvironment({ APP_URL })).toThrow("Configuración inválida");
  });
  it("no expone credenciales en errores", () => {
    try {
      parseEnvironment({ APP_URL: "https://usuario:secreto@turnero.example" });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain("secreto");
      expect(String(error)).not.toContain("usuario");
    }
  });
});
