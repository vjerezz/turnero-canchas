"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireComplex } from "@/features/auth/session";
import type { AuthState } from "@/features/auth/actions";
import { courtInputSchema } from "./court-schema";

export async function saveCourt(_previous: AuthState, form: FormData): Promise<AuthState> {
  const { supabase, complex } = await requireComplex();
  const input = courtInputSchema.safeParse({ name: form.get("name"), sport: form.get("sport"), pricePesos: form.get("pricePesos") });
  const rawId = form.get("id");
  const id = rawId ? z.uuid().safeParse(rawId) : null;
  if (!input.success) return { message: input.error.issues[0]?.message ?? "Revisá los datos de la cancha." };
  if (id && !id.success) return { message: "La cancha no es válida." };
  const values = { name: input.data.name, sport: input.data.sport, price_in_cents: input.data.priceInCents };
  const result = id?.success
    ? await supabase.from("courts").update({ ...values, active: form.get("active") === "on" }).eq("id", id.data).eq("complex_id", complex.id).select("id").maybeSingle()
    : await supabase.from("courts").insert({ ...values, complex_id: complex.id }).select("id").single();
  if (result.error || !result.data) return { message: "No pudimos guardar la cancha. Revisá tu acceso y volvé a intentarlo." };
  revalidatePath("/admin/canchas");
  redirect("/admin/canchas");
}
