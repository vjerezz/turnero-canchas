import Link from "next/link";
import { requireComplex } from "@/features/auth/session";
import { sports } from "@/features/courts/schedule";

export default async function CourtsPage() {
  const { supabase, complex } = await requireComplex();
  const { data, error } = await supabase.from("courts").select("*").eq("complex_id", complex.id).order("created_at");
  if (error) return <section className="ui-card ui-stack"><h1>Canchas</h1><p role="alert">No pudimos cargar las canchas. Si la configuración inicial está pendiente, contactá al responsable del alta.</p><Link href="/admin">Volver al panel</Link></section>;
  return <section className="intro-card ui-stack">
    <Link href="/admin">Volver al panel</Link><p className="eyebrow">{complex.name}</p><h1>Canchas</h1>
    <Link className="ui-button ui-button-primary" href="/admin/canchas/nueva">Agregar cancha</Link>
    {data.length === 0 && <p>Todavía no cargaste canchas. Agregá la primera para configurar su deporte y precio.</p>}
    {data.map((court) => <article className="ui-card ui-stack" key={court.id} style={{ overflowWrap: "anywhere" }}>
      <h2>{court.name}</h2><p>{sports[court.sport].label} · {court.duration_minutes} minutos · {court.active ? "Activa" : "Inactiva"}</p>
      <p>{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(court.price_in_cents / 100)} por turno</p>
      <Link href={`/admin/canchas/${court.id}`}>Editar {court.name}</Link>
      <Link href={`/admin/canchas/${court.id}/horarios`}>Configurar horarios de {court.name}</Link>
    </article>)}
  </section>;
}
