import "server-only";
import { redirect } from "next/navigation";
import { requireComplex } from "./session";

export async function loadTeam() {
  const { supabase, complex, membership, user } = await requireComplex();
  if (membership.role !== "owner") redirect("/admin");
  const [members, invitations] = await Promise.all([
    supabase.from("memberships").select("user_id, role, revoked_at").eq("complex_id", complex.id).order("created_at"),
    supabase.from("team_invitations").select("id, email, accepted_by, accepted_at, revoked_at, expires_at").eq("complex_id", complex.id).order("created_at", { ascending: false }),
  ]);
  if (members.error || invitations.error) throw new Error("No pudimos cargar el equipo. Volvé a intentarlo.");
  // Hora del servidor para la presentación; PostgreSQL decide la validez al operar.
  return { complex, user, members: members.data, invitations: invitations.data, loadedAt: Date.now() };
}
