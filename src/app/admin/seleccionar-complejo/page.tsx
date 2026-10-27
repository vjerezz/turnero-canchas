import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getUserMemberships } from "@/features/auth/session";
import { selectComplex, signOut } from "@/features/auth/actions";

export default async function SelectComplexPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { memberships } = await getUserMemberships();
  const { error } = await searchParams;
  return <section className="ui-card ui-stack auth-card"><p className="eyebrow">Tu equipo</p><h1>Elegí un complejo</h1>
    {error && <p role="alert">No tenés acceso a ese complejo. Elegí uno de la lista.</p>}
    {memberships.length === 0 && <p className="notice">Tu cuenta está verificada, pero todavía no tenés un complejo asignado. Pedile al responsable del alta que habilite tu acceso.</p>}
    {memberships.map((membership) => <form action={selectComplex} key={membership.complex_id} className="ui-stack">
      <input type="hidden" name="complex_id" value={membership.complex_id} />
      <Button type="submit">{membership.complexes?.name ?? "Abrir complejo"}</Button><p className="ui-hint">{membership.role === "owner" ? "Propietario" : "Administrador"}</p>
    </form>)}
    <Link href="/admin/invitaciones/aceptar">Tengo una invitación</Link>
    <form action={signOut}><Button type="submit" variant="secondary">Cerrar sesión</Button></form>
  </section>;
}
