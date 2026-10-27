"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireComplex } from "./session";
import { getServerEnvironment } from "@/lib/env";
import type { AuthState } from "./actions";

export async function inviteAdministrator(_previous: AuthState, form: FormData): Promise<AuthState> {
  const { supabase, complex, membership } = await requireComplex();
  if (membership.role !== "owner") return { message: "Solo el propietario puede invitar al equipo." };
  const email = z.email().max(254).safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { message: "Ingresá un email válido." };
  const key = process.env.RESEND_API_KEY;
  const from = z.email().safeParse(process.env.INVITATION_FROM);
  if (!key || !from.success) return { message: "El envío de invitaciones todavía no está configurado." };
  const { APP_URL } = getServerEnvironment();
  // Límite por complejo, compartido por sus propietarios; SQL mantiene el alcance.
  const since = new Date(Date.now() - 60_000).toISOString();
  const recent = await supabase.from("team_invitations").select("id", { count: "exact", head: true }).eq("complex_id", complex.id).gte("created_at", since);
  if (recent.error) return { message: "No pudimos comprobar el envío. Volvé a intentarlo." };
  if ((recent.count ?? 0) >= 1) return { message: "Esperá un minuto antes de enviar otra invitación." };
  const { data, error } = await supabase.rpc("invite_administrator", { target_complex: complex.id, recipient_email: email.data });
  const invitation = data?.[0];
  if (error?.code === "P0001") return { message: "Esperá un minuto antes de enviar otra invitación." };
  if (error || !invitation) return { message: "No pudimos crear la invitación." };
  let sent = false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `team-invitation/${invitation.invitation_id}` },
      body: JSON.stringify({ from: from.data, to: [email.data], subject: "Invitación al equipo de Turnero",
        text: `Te invitaron a administrar ${complex.name}. Ingresá con este email en ${APP_URL}/admin/ingresar. Después abrí ${APP_URL}/admin/invitaciones/aceptar y pegá este código:\n\n${invitation.invitation_token}\n\nLa invitación vence a los 7 días. Si no esperabas este correo, podés ignorarlo.` }),
    });
    sent = response.ok;
  } catch { /* No registrar errores del proveedor: pueden incluir credenciales. */ }
  if (!sent) {
    const revoked = await supabase.rpc("revoke_team_invitation", { target_complex: complex.id, target_invitation: invitation.invitation_id });
    revalidatePath("/admin/equipo");
    return { message: revoked.error ? "No confirmamos el envío. Revisá y revocá la invitación pendiente antes de reintentar." : "No confirmamos el envío y revocamos la invitación. Esperá un minuto antes de reintentar." };
  }
  revalidatePath("/admin/equipo");
  return { success: true, message: "El servicio de correo aceptó la invitación para envío. Pedile al destinatario que revise su casilla y el correo no deseado." };
}
