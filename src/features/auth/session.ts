import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const complexCookie = "turnero-complex";

export async function requireUser() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) redirect("/admin/ingresar");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !data.user.email_confirmed_at) redirect("/admin/ingresar");
  return { supabase, user: data.user };
}

export async function getUserMemberships() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("memberships")
    .select("complex_id, role, complexes(id, name)")
    .eq("user_id", user.id).is("revoked_at", null);
  if (error) throw new Error("No se pudo consultar el acceso a los complejos.");
  return { supabase, user, memberships: data };
}

export async function requireComplex() {
  const context = await getUserMemberships();
  const selectedId = (await cookies()).get(complexCookie)?.value;
  const membership = context.memberships.find((item) => item.complex_id === selectedId);
  if (!membership?.complexes) redirect("/admin/seleccionar-complejo");
  return { ...context, membership, complex: membership.complexes };
}
