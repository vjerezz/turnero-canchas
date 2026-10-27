"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "./session";
import type { AuthState } from "./actions";

export async function acceptInvitation(_previous: AuthState, form: FormData): Promise<AuthState> {
  const { supabase } = await requireUser();
  const token = z.string().trim().length(72).regex(/^[a-f0-9-]+$/i).safeParse(form.get("token"));
  const invalid = { message: "No pudimos aceptar la invitación. Revisá el código y que hayas ingresado con el email invitado; puede haber vencido o sido revocada." };
  if (!token.success) return invalid;
  // PostgreSQL verifica destinatario, vencimiento, revocación e idempotencia.
  const { data, error } = await supabase.rpc("accept_team_invitation", { invitation_token: token.data });
  if (error || !z.uuid().safeParse(data).success) return invalid;
  revalidatePath("/admin", "layout");
  redirect("/admin/seleccionar-complejo");
}
