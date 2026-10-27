"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireComplex } from "./session";
import type { AuthState } from "./actions";

export async function revokeTeamAccess(_previous: AuthState, form: FormData): Promise<AuthState> {
  const { supabase, complex, membership } = await requireComplex();
  if (membership.role !== "owner") return { message: "Solo el propietario puede gestionar el equipo." };
  const input = z.object({ kind: z.enum(["administrator", "invitation"]), id: z.uuid() })
    .safeParse({ kind: form.get("kind"), id: form.get("id") });
  if (!input.success) return { message: "Revisá el acceso que querés revocar." };
  // El alcance proviene de una membresía vigente; PostgreSQL vuelve a autorizar.
  const { error } = input.data.kind === "administrator"
    ? await supabase.rpc("revoke_administrator", { target_complex: complex.id, target_user: input.data.id })
    : await supabase.rpc("revoke_team_invitation", { target_complex: complex.id, target_invitation: input.data.id });
  if (error) return { message: "No pudimos revocar el acceso. Actualizá la página y volvé a intentarlo." };
  revalidatePath("/admin", "layout");
  return { success: true, message: "La solicitud de revocación se procesó." };
}
