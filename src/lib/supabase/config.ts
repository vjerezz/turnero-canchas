import { z } from "zod";

const configSchema = z.object({
  SUPABASE_URL: z.url().refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      && url.pathname === "/" && !url.search && !url.hash;
  }),
  SUPABASE_PUBLISHABLE_KEY: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]+$/),
});

export function parseSupabaseConfig(input: Record<string, string | undefined>) {
  const parsed = configSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Configurá SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY con la URL HTTPS y la clave pública del proyecto.");
  }
  return parsed.data;
}
