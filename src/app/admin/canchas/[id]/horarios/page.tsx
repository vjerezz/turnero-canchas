import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireComplex } from "@/features/auth/session";
import { HoursForm } from "@/features/courts/hours-form";
import { weekdays, formatLocalMinute, weeklyTurnPreview } from "@/features/courts/weekly-hours";

export default async function HoursPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ guardado?: string }> }) {
  const { supabase, complex } = await requireComplex();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const { data: court, error: courtError } = await supabase.from("courts").select("*").eq("id", id.data).eq("complex_id", complex.id).maybeSingle();
  if (courtError) throw new Error("No pudimos cargar la cancha.");
  if (!court) notFound();
  const { data: windows, error } = await supabase.from("court_weekly_hours").select("weekday, opens_minute, closes_minute").eq("court_id", id.data).eq("complex_id", complex.id).order("weekday");
  if (error) return <section className="ui-card ui-stack"><h1>Horarios</h1><p role="alert">No pudimos cargar los horarios. La configuración inicial puede estar pendiente.</p><Link href="/admin/canchas">Volver a canchas</Link></section>;
  const { guardado } = await searchParams;
  return <section className="ui-card ui-stack auth-card">
    <Link href={`/admin/canchas/${court.id}`}>Volver a la cancha</Link><p>{complex.name} · {court.name}</p><h1>Horarios semanales</h1>
    <p>Hora de Buenos Aires. Una franja por día, con turnos consecutivos de {court.duration_minutes} minutos. Desmarcá los días cerrados.</p>
    <Link href={`/admin/canchas/${court.id}/excepciones`}>Configurar excepciones por fecha</Link>
    {!court.active && <p className="notice">La cancha está inactiva. Podés preparar sus horarios.</p>}
    {guardado === "1" && <p role="status">Los horarios se guardaron.</p>}
    <HoursForm key={court.hours_version} courtId={court.id} version={court.hours_version} windows={windows} />
    <h2>Turnos según los horarios guardados</h2><p>Esta vista muestra los horarios posibles. La disponibilidad y las reservas se incorporarán en la siguiente fase.</p>
    {windows.length === 0 && <p>Todos los días están cerrados hasta que cargues horarios.</p>}
    {windows.map((window) => {
      const turns = weeklyTurnPreview(window, court.sport);
      const label = (minute: number) => `${formatLocalMinute(minute)}${minute >= 1440 ? " (día siguiente)" : ""}`;
      return <section key={window.weekday} className="ui-stack"><h3>{weekdays[window.weekday]}</h3>
        {turns.length === 0 ? <p>La franja no alcanza para un turno completo.</p> : <ul>{turns.map((turn) => <li key={turn.start}>{label(turn.start)}–{label(turn.end)}</li>)}</ul>}
        {!!turns.length && turns[turns.length - 1].end < window.closes_minute && <p className="ui-hint">El tiempo restante hasta el cierre no alcanza para otro turno completo.</p>}
      </section>;
    })}
  </section>;
}
