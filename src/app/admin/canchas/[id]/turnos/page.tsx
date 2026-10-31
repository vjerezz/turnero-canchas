import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireComplex } from "@/features/auth/session";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { localDateSchema } from "@/features/courts/date-exceptions";
import { localToday, serviceDayPreview, shiftServiceDate } from "@/features/courts/service-day";
import { formatLocalMinute } from "@/features/courts/weekly-hours";

export default async function TurnsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ fecha?: string | string[] }> }) {
  const { supabase, complex } = await requireComplex();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const now = new Date();
  const requested = (await searchParams).fecha;
  const date = localDateSchema.safeParse(requested ?? localToday(now));
  if (!date.success || date.data < "2000-01-02" || date.data > "9998-12-30") return <section className="ui-card ui-stack"><h1>Turnos por fecha</h1><p role="alert">Ingresá una fecha válida entre 2000 y 9998.</p><Link href={`/admin/canchas/${id.data}/turnos`}>Volver a hoy</Link></section>;
  const { data: court, error: courtError } = await supabase.from("courts").select("*").eq("id", id.data).eq("complex_id", complex.id).maybeSingle();
  if (courtError) throw new Error("No pudimos cargar la cancha.");
  if (!court) notFound();
  const [weekly, exceptions] = await Promise.all([
    supabase.from("court_weekly_hours").select("*").eq("complex_id", complex.id).eq("court_id", court.id),
    supabase.from("court_date_exceptions").select("*").eq("complex_id", complex.id).eq("court_id", court.id).gte("service_date", shiftServiceDate(date.data, -1)).lte("service_date", shiftServiceDate(date.data, 1)),
  ]);
  if (weekly.error || exceptions.error) return <section className="ui-card ui-stack"><h1>Turnos por fecha</h1><p role="alert">No pudimos cargar los horarios. Volvé a intentarlo.</p></section>;
  const preview = serviceDayPreview(date.data, court.sport, weekly.data, exceptions.data, now);
  const special = exceptions.data.find((row) => row.service_date === date.data && row.active);
  const time = (minute: number) => `${formatLocalMinute(minute)}${minute >= 1440 ? " (día siguiente)" : ""}`;
  return <section className="ui-card ui-stack">
    <Link href="/admin/canchas">Volver a canchas</Link><p>{complex.name} · {court.name}</p><h1>Turnos por fecha</h1>
    <p>Revisá la jornada desde su apertura hasta el cierre, incluida la madrugada siguiente. Horas de Buenos Aires.</p>
    <form method="get" className="ui-stack" key={date.data}><Input label="Fecha de la jornada" type="date" name="fecha" defaultValue={date.data} min="2000-01-02" max="9998-12-30" required /><Button type="submit">Consultar jornada</Button></form>
    <p>Anticipación: mínimo 2 horas y máximo 30 días. Esta vista permite revisar la configuración; todavía no consulta reservas ni bloqueos.</p>
    {!court.active && <p role="alert">Cancha inactiva. Sus turnos no se ofrecen para reservar.</p>}
    <h2>{date.data.split("-").reverse().join("/")} · {special ? "Excepción por fecha" : "Horario semanal"}</h2>
    {!preview.window && <p role="status">Jornada cerrada. No se generan turnos para esta jornada ni su madrugada siguiente.</p>}
    {preview.conflict && <p role="alert">Este horario se superpone con una jornada vecina. Corregí los horarios antes de ofrecer turnos.</p>}
    {preview.window && !preview.turns.length && <p>La franja no alcanza para un turno completo.</p>}
    <ul className="ui-stack">{preview.turns.map((turn) => <li className="ui-card" key={turn.start}>
      <p>{time(turn.start)}–{time(turn.end)}</p>
      <p>{!court.active ? "Cancha inactiva" : preview.conflict ? "Revisar superposición" : turn.bookingWindow.allowed ? "Dentro del plazo de reserva" : turn.bookingWindow.reason === "too-soon" ? "Fuera de plazo: menos de 2 horas o turno pasado" : "Fuera de plazo: más de 30 días"}</p>
    </li>)}</ul>
    <Link href={`/admin/canchas/${court.id}/horarios`}>Editar horarios semanales</Link>
    <Link href={`/admin/canchas/${court.id}/excepciones`}>Editar excepciones</Link>
  </section>;
}
