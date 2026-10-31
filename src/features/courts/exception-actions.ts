"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireComplex } from "@/features/auth/session";
import type { AuthState } from "@/features/auth/actions";
import { dateExceptionSchema, localDateSchema } from "./date-exceptions";
import { localTimeSchema } from "./weekly-hours";

export async function saveDateException(_previous: AuthState, form: FormData): Promise<AuthState> {
  const { supabase, complex } = await requireComplex();
  const court = z.uuid().safeParse(form.get("court_id"));
  const mode = z.enum(["closed", "special"]).safeParse(form.get("mode"));
  if (!court.success || !mode.success) return { message: "Revisá la cancha y el tipo de excepción." };
  const closed = mode.data === "closed";
  const opens = localTimeSchema.safeParse(form.get("opens"));
  const closes = localTimeSchema.safeParse(form.get("closes"));
  const input = dateExceptionSchema.safeParse({ service_date: form.get("service_date"), closed,
    opens_minute: closed ? null : opens.success ? opens.data : null,
    closes_minute: closed ? null : closes.success ? closes.data + (form.get("overnight") === "on" ? 1440 : 0) : null });
  if (!input.success) return { message: input.error.issues[0]?.message ?? "Revisá los datos." };
  const { data: existingCourt, error: courtError } = await supabase.from("courts").select("id").eq("id", court.data).eq("complex_id", complex.id).maybeSingle();
  if (courtError || !existingCourt) return { message: "No pudimos verificar tu acceso a la cancha." };
  const { service_date, ...values } = input.data;
  const updated = await supabase.from("court_date_exceptions").update({ ...values, active: true }).eq("complex_id", complex.id).eq("court_id", court.data).eq("service_date", service_date).select("service_date").maybeSingle();
  if (updated.error) return { message: "No pudimos guardar la excepción. Revisá la configuración y tu acceso." };
  if (!updated.data) {
    const { error } = await supabase.from("court_date_exceptions").insert({ ...input.data, court_id: court.data, complex_id: complex.id });
    if (error) return { message: "No pudimos crear la excepción. Actualizá la página y volvé a intentarlo." };
  }
  revalidatePath(`/admin/canchas/${court.data}/excepciones`);
  return { message: "La excepción se guardó." };
}

export async function restoreWeeklyHours(_previous: AuthState, form: FormData): Promise<AuthState> {
  const { supabase, complex } = await requireComplex();
  const court = z.uuid().safeParse(form.get("court_id"));
  const date = localDateSchema.safeParse(form.get("service_date"));
  if (!court.success || !date.success || form.get("confirm") !== "on") return { message: "Confirmá la fecha para volver al horario semanal." };
  const { data, error } = await supabase.from("court_date_exceptions").update({ active: false }).eq("complex_id", complex.id).eq("court_id", court.data).eq("service_date", date.data).select("service_date").maybeSingle();
  if (error || !data) return { message: "No pudimos restaurar el horario. Actualizá la página y revisá tu acceso." };
  revalidatePath(`/admin/canchas/${court.data}/excepciones`);
  return { message: "Se restauró el horario semanal para esa jornada." };
}
