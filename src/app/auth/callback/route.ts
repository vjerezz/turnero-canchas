import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnvironment } from "@/lib/env";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const { APP_URL } = getServerEnvironment();
  let destination = "/admin/ingresar?error=enlace";
  if (code && code.length <= 2048) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) destination = "/admin/nueva-contrasena";
  }
  // Destino fijo y origen configurado, nunca next/redirectTo recibidos del navegador.
  const response = NextResponse.redirect(new URL(destination, APP_URL));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
