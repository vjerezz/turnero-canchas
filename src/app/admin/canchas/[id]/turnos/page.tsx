import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireComplex } from "@/features/auth/session";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { localDateSchema } from "@/features/courts/date-exceptions";
import { localToday } from "@/features/courts/service-day";
import { formatLocalMinute } from "@/features/courts/weekly-hours";
import { availabilitySchema } from "@/features/reservations/contracts";

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
  const result = await supabase.rpc("get_team_availability", { target_complex: complex.id, target_court: court.id, target_date: date.data });
  const parsed = availabilitySchema.safeParse(result.data);
  if (result.error || !parsed.success) return <section className="ui-card ui-stack"><h1>Turnos por fecha</h1><p role="alert">No pudimos consultar la disponibilidad. Volvé a intentarlo.</p></section>;
  const availability = parsed.data;
  const time = (minute: number) => `${formatLocalMinute(minute)}${minute >= 1440 ? " (día siguiente)" : ""}`;
  return <section className="ui-card ui-stack">
    <Link href="/admin/canchas">Volver a canchas</Link><p>{complex.name} · {court.name}</p><h1>Turnos por fecha</h1>
    <p>Revisá la jornada desde su apertura hasta el cierre, incluida la madrugada siguiente. Horas de Buenos Aires.</p>
    <form method="get" className="ui-stack" key={date.data}><Input label="Fecha de la jornada" type="date" name="fecha" defaultValue={date.data} min="2000-01-02" max="9998-12-30" required /><Button type="submit">Consultar jornada</Button></form>
    <p>Anticipación: mínimo 2 horas y máximo 30 días. La disponibilidad se comprueba nuevamente al crear la reserva.</p>
    <h2>{date.data.split("-").reverse().join("/")}</h2>
    {availability.reason === "inactive" && <p role="status">Cancha inactiva. No se ofrecen turnos.</p>}
    {availability.reason === "closed" && <p role="status">Jornada cerrada.</p>}
    {availability.reason === "schedule_conflict" && <p role="alert">Este horario se superpone con una jornada vecina. Corregí los horarios antes de reservar.</p>}
    {!availability.reason && !availability.slots.length && <p>No hay turnos completos para esta jornada.</p>}
    <ul className="ui-stack">{availability.slots.map((turn) => <li className="ui-card ui-stack" key={turn.minute}>
      <p>{time(turn.minute)}–{time(turn.minute + availability.duration_minutes)}</p>
      <p>{{ available: "Disponible", occupied: "Ocupado", too_soon: "Fuera de plazo: menos de 2 horas o turno pasado", too_late: "Fuera de plazo: más de 30 días" }[turn.state]}</p>
      {turn.state === "available" && <Button asChild><Link href={`/admin/canchas/${court.id}/reservar?fecha=${date.data}&minuto=${turn.minute}`}>Reservar {time(turn.minute)}</Link></Button>}
    </li>)}</ul>
    <Link href={`/admin/canchas/${court.id}/horarios`}>Editar horarios semanales</Link>
    <Link href={`/admin/canchas/${court.id}/excepciones`}>Editar excepciones</Link>
  </section>;
}
