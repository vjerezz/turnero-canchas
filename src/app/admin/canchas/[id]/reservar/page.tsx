import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireComplex } from "@/features/auth/session";
import { availabilitySchema, formatArs, reservationUrl, serviceDateSchema } from "@/features/reservations/contracts";
import { ReservationForm } from "@/features/reservations/reservation-form";
import { formatLocalMinute } from "@/features/courts/weekly-hours";

export default async function ReservePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fecha?: string; minuto?: string; solicitud?: string }>;
}) {
  const { supabase, complex, user } = await requireComplex();
  const query = await searchParams;
  const input = z.object({ id: z.uuid(), fecha: serviceDateSchema, minuto: z.string().regex(/^\d{1,4}$/).transform(Number).pipe(z.number().max(2879)), solicitud: z.uuid().optional() }).safeParse({ ...query, id: (await params).id });
  if (!input.success) notFound();
  const { id, fecha, minuto, solicitud } = input.data;
  const { data: court, error } = await supabase.from("courts").select("id,name").eq("complex_id", complex.id).eq("id", id).maybeSingle();
  if (error) throw new Error("No pudimos consultar la cancha.");
  if (!court) notFound();
  if (!solicitud) redirect(reservationUrl(id, fecha, minuto, randomUUID()));
  const [existing, result] = await Promise.all([
    supabase.from("reservations").select("*").eq("complex_id", complex.id).eq("court_id", id).eq("created_by", user.id).eq("request_id", solicitud).maybeSingle(),
    supabase.rpc("get_team_availability", { target_complex: complex.id, target_court: id, target_date: fecha }),
  ]);
  const availability = availabilitySchema.safeParse(result.data);
  if (existing.error || result.error || !availability.success) return <section className="ui-card ui-stack"><h1>Nueva reserva</h1><p role="alert">No pudimos comprobar la reserva. Recargá esta página para reintentar la misma solicitud.</p></section>;
  const reservation = existing.data;
  if (reservation && (reservation.service_date !== fecha || reservation.start_minute !== minuto)) notFound();
  const expired = reservation && (reservation.status === "expired" || (reservation.status === "pending_deposit" && Date.parse(reservation.expires_at) <= Date.parse(availability.data.server_now)));
  const slot = availability.data.slots.find((slot) => slot.minute === minuto);
  return <section className="ui-card ui-stack">
    <Link href={`/admin/canchas/${id}/turnos?fecha=${fecha}`}>Volver a disponibilidad</Link>
    <p>{complex.name} · {court.name}</p><h1>{reservation ? "Reserva registrada" : "Nueva reserva"}</h1>
    <p>Jornada {fecha.split("-").reverse().join("/")} · {formatLocalMinute(minuto)}{minuto >= 1440 ? " del día siguiente" : ""} · {reservation?.duration_minutes ?? availability.data.duration_minutes} minutos</p>
    {reservation ? <>
      <p role="status">{expired ? "Vencida: terminó el plazo para la seña." : reservation.status === "confirmed" ? "Confirmada" : "Pendiente de seña"}</p>
      <p>{reservation.customer_name} · {reservation.customer_email}</p>
      <p>Total: {formatArs(reservation.total_in_cents)} · Seña: {formatArs(reservation.deposit_in_cents)}</p>
      <p>Plazo de seña: {new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" }).format(new Date(reservation.expires_at))} (Buenos Aires).</p>
      <p>Volver a esta solicitud no crea otra reserva ni extiende el plazo. Los cobros y el envío de emails todavía no están integrados.</p>
    </> : slot?.state === "available" ? <>
      <p>Total: {formatArs(availability.data.total_in_cents)} · Seña del 30%: {formatArs(availability.data.deposit_in_cents)}</p>
      <ReservationForm court={id} date={fecha} minute={minuto} request={solicitud} total={availability.data.total_in_cents} />
    </> : <p role="status">Este turno ya no está disponible. Volvé a consultar los horarios.</p>}
  </section>;
}
