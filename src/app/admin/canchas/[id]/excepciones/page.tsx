import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireComplex } from "@/features/auth/session";
import { ExceptionForm } from "@/features/courts/exception-form";
import { RestoreHoursForm } from "@/features/courts/restore-hours-form";
import { formatLocalMinute } from "@/features/courts/weekly-hours";

export default async function ExceptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, complex } = await requireComplex();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const { data: court, error: courtError } = await supabase.from("courts").select("id, name").eq("id", id.data).eq("complex_id", complex.id).maybeSingle();
  if (courtError) throw new Error("No pudimos cargar la cancha.");
  if (!court) notFound();
  const { data, error } = await supabase.from("court_date_exceptions").select("*").eq("court_id", court.id).eq("complex_id", complex.id).order("service_date");
  return <section className="ui-card ui-stack auth-card">
    <Link href={`/admin/canchas/${court.id}/horarios`}>Volver a horarios semanales</Link>
    <p>{complex.name} · {court.name}</p><h1>Excepciones por fecha</h1>
    <p>La fecha corresponde al día en que empieza la jornada. Cerrar un martes también cierra su continuación en la madrugada del miércoles; conserva la madrugada que viene del lunes.</p>
    {error ? <p role="alert">No pudimos cargar las excepciones. La configuración inicial puede estar pendiente.</p> : <>
      <ExceptionForm courtId={court.id} />
      <h2>Excepciones guardadas</h2>
      {!data.length && <p>Todavía no hay excepciones.</p>}
      <ul className="ui-stack">{data.map((row) => <li key={row.service_date} className="ui-card ui-stack">
        <p>{row.service_date.split("-").reverse().join("/")}: {!row.active ? "Horario semanal restaurado" : row.closed ? "Jornada cerrada" : `${formatLocalMinute(row.opens_minute!)}–${formatLocalMinute(row.closes_minute!)}${row.closes_minute! >= 1440 ? " (cierre al día siguiente)" : ""}`}</p>
        {row.active && <RestoreHoursForm courtId={court.id} date={row.service_date} />}
      </li>)}</ul>
      <p className="ui-hint">Estos ajustes se aplicarán al calendario de reservas cuando esté disponible.</p>
    </>}
  </section>;
}
