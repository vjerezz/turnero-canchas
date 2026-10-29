import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseSupabaseConfig } from "./config";
import type { AppDatabase } from "./app-database";

// Cliente por petición: nunca compartir sesiones entre usuarios.
export async function createSupabaseServerClient() {
  const config = parseSupabaseConfig(process.env);
  const cookieStore = await cookies();
  return createServerClient<AppDatabase>(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        // Las Server Actions pueden escribir cookies; los componentes solo leen.
        // El proxy mantiene la renovación antes del render del componente.
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Next.js no permite escribir cookies durante el render.
        }
      },
    },
  });
}
