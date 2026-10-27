import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { parseSupabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Todas las respuestas del equipo, incluso errores y acciones, son privadas.
  const noCache = (result: NextResponse) => {
    result.headers.set("Cache-Control", "private, no-store, max-age=0");
    result.headers.set("Pragma", "no-cache");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  };
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) return noCache(response);
  const config = parseSupabaseConfig(process.env);
  const supabase = createServerClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies, headers) {
        for (const { name, value } of cookies) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });
  await supabase.auth.getClaims();
  // La autorización se repite en servidor para cada página/acción protegida.
  return noCache(response);
}

export const config = { matcher: ["/admin/:path*", "/auth/:path*"] };
