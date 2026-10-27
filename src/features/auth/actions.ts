"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnvironment } from "@/lib/env";
import { complexCookie, getUserMemberships, requireUser } from "./session";

export type AuthState = { message: string; success?: boolean };
const emailSchema = z.email().max(254);

export async function signIn(_previous: AuthState, form: FormData): Promise<AuthState> {
  const input = z.object({ email: emailSchema, password: z.string().min(1).max(256) }).safeParse({ email: form.get("email"), password: form.get("password") });
  if (!input.success) return { message: "Revisá el email y la contraseña." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(input.data);
  if (error) return { message: "No pudimos iniciar sesión. Revisá tus datos y que tu email esté verificado." };
  (await cookies()).set(complexCookie, "", { path: "/admin", maxAge: 0, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/admin", "layout");
  redirect("/admin/seleccionar-complejo");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw new Error("No se pudo cerrar la sesión. Volvé a intentarlo.");
  (await cookies()).set(complexCookie, "", { path: "/admin", maxAge: 0, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/admin", "layout");
  redirect("/admin/ingresar");
}

export async function selectComplex(form: FormData) {
  const parsed = z.uuid().safeParse(form.get("complex_id"));
  const { memberships } = await getUserMemberships();
  if (!parsed.success || !memberships.some((item) => item.complex_id === parsed.data)) {
    redirect("/admin/seleccionar-complejo?error=acceso");
  }
  (await cookies()).set(complexCookie, parsed.data, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin",
  });
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function recoverAccess(_previous: AuthState, form: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { message: "Ingresá un email válido." };
  const supabase = await createSupabaseServerClient();
  const { APP_URL } = getServerEnvironment();
  // Respuesta idéntica para cuentas existentes, inexistentes y límites del proveedor.
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${APP_URL}/auth/callback` });
  return { success: true, message: "Si el email corresponde a una cuenta habilitada, recibirás un enlace para recuperar el acceso. Revisá también el correo no deseado." };
}

export async function updatePassword(_previous: AuthState, form: FormData): Promise<AuthState> {
  const { supabase } = await requireUser();
  const password = z.string().min(12).max(128).safeParse(form.get("password"));
  if (!password.success || password.data !== form.get("confirmation")) return { message: "Usá al menos 12 caracteres y repetí la misma contraseña." };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { message: "No pudimos guardar la contraseña. Pedí un nuevo enlace o volvé a intentarlo." };
  revalidatePath("/admin", "layout");
  redirect("/admin/seleccionar-complejo");
}
