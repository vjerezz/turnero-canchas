import Link from "next/link";
import { InviteForm } from "@/features/auth/invite-form";
import { loadTeam } from "@/features/auth/team-data";
import { RevokeAccessForm } from "@/features/auth/revoke-access-form";

export default async function TeamPage() {
  const { complex, user, members, invitations, loadedAt } = await loadTeam();
  return <section className="intro-card ui-stack">
    <Link href="/admin">Volver al panel</Link>
    <p className="eyebrow">{complex.name}</p>
    <h1>Equipo</h1>
    <p>Administrá los accesos a este complejo.</p>
    <h2>Invitar administrador</h2>
    {process.env.RESEND_API_KEY && process.env.INVITATION_FROM ? <InviteForm /> : <p>El envío de invitaciones por correo todavía está en preparación.</p>}
    <h2>Integrantes</h2>
    {members.length === 0 && <p>No hay integrantes para mostrar.</p>}
    {members.map((member) => {
      const label = member.user_id === user.id ? (user.email ?? "Tu cuenta") :
        invitations.find((invitation) => invitation.accepted_by === member.user_id)?.email ?? `Cuenta ${member.user_id}`;
      return <article key={member.user_id} className="ui-stack" style={{ overflowWrap: "anywhere" }}>
        <h3>{label}</h3>
        <p>{member.role === "owner" ? "Propietario" : "Administrador"} · {member.revoked_at ? "Acceso revocado" : "Acceso activo"}</p>
        {member.role === "admin" && !member.revoked_at && <RevokeAccessForm id={member.user_id} kind="administrator" label={label} />}
      </article>;
    })}
    <h2>Invitaciones</h2>
    {invitations.length === 0 && <p>No hay invitaciones para mostrar.</p>}
    {invitations.map((invitation) => {
      const status = invitation.accepted_at ? "Aceptada" : invitation.revoked_at ? "Revocada" : Date.parse(invitation.expires_at) <= loadedAt ? "Vencida" : "Pendiente";
      return <article key={invitation.id} className="ui-stack" style={{ overflowWrap: "anywhere" }}>
        <h3>{invitation.email}</h3><p>{status}</p>
        {status === "Pendiente" && <RevokeAccessForm id={invitation.id} kind="invitation" label={invitation.email} />}
      </article>;
    })}
  </section>;
}
