import { z } from "zod";

const appUrl = z.url().refine((value) => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  return (url.protocol === "https:" || (local && url.protocol === "http:"))
    && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash;
});

const schema = z.object({ APP_URL: appUrl.default("http://localhost:3000") });

export function parseEnvironment(input: Record<string, string | undefined>) {
  const result = schema.safeParse(input);
  if (!result.success) {
    // No incluir valores recibidos: una variable mal configurada puede contener secretos.
    throw new Error("Configuración inválida: APP_URL debe ser un origen HTTPS (HTTP solo en localhost), sin credenciales, ruta ni parámetros.");
  }
  return result.data;
}
