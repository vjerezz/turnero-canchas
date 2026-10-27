import Link from "next/link";
import { requireUser } from "@/features/auth/session";
import { InvitationForm } from "@/features/auth/invitation-form";

export default async function AcceptInvitationPage() {
  const { user } = await requireUser();
  return <section className="ui-card ui-stack auth-card">
    <p className="eyebrow">Equipo del complejo</p>
    <h1>Aceptar invitación</h1>
    <p style={{ overflowWrap: "anywhere" }}>Ingresaste como {user.email}. La invitación debe estar dirigida a este email.</p>
    <InvitationForm />
    <Link href="/admin/seleccionar-complejo">Volver a mis complejos</Link>
  </section>;
}
