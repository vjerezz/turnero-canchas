import Link from "next/link";
import { requireComplex } from "@/features/auth/session";
import { signOut } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const { complex, membership } = await requireComplex();
  return (
    <section className="intro-card">
      <p className="eyebrow">{membership.role === "owner" ? "Propietario" : "Administrador"}</p>
      <h1>{complex.name}</h1>
      <p className="intro-copy">Tu acceso al complejo está habilitado. La agenda y la configuración operativa se incorporarán en las próximas fases.</p>
      <Link href="/admin/seleccionar-complejo">Cambiar de complejo</Link>
      <Link href="/admin/canchas">Administrar canchas</Link>
      {membership.role === "owner" && <Link href="/admin/equipo">Administrar equipo</Link>}
      {process.env.NODE_ENV === "development" && <p>La demostración usa datos ficticios de otro complejo. <Link href="/demo/admin">Ver demo de Los Álamos</Link></p>}
      <form action={signOut}><Button type="submit" variant="secondary">Cerrar sesión</Button></form>
    </section>
  );
}
