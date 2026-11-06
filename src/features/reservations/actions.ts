"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireComplex } from "@/features/auth/session";
import { reservationInputSchema, reservationUrl } from "./contracts";

export async function createReservation(_state: { message: string }, form: FormData): Promise<{ message: string }> {
  const { supabase, complex } = await requireComplex();
  const parsed = reservationInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Revisá el nombre, email y los datos del turno." };
  const input = parsed.data;
  let error;
  try {
    ({ error } = await supabase.rpc("create_quoted_team_reservation", {
      target_complex: complex.id, target_court: input.court_id, target_date: input.service_date,
      target_minute: input.minute, guest_name: input.name, guest_email: input.email,
      idempotency_key: input.request_id, expected_total: input.expected_total,
    }));
  } catch {
    return { message: "No pudimos comprobar el resultado. Reintentá con los mismos datos: no se duplicará la reserva." };
  }
  if (error) {
    const messages: Record<string, string> = {
      "23P01": "El turno acaba de ocuparse. Volvé a disponibilidad y elegí otro horario.",
      "P0001": "El precio cambió. Recargá esta página para revisar el importe antes de reservar.",
      "42501": "No tenés acceso a esta cancha. Revisá el complejo seleccionado.",
      "22023": "El turno o la solicitud ya no son válidos. Revisá la disponibilidad; si reintentás, conservá los datos originales.",
    };
    return { message: messages[error.code] ?? "No pudimos comprobar el resultado. Reintentá con los mismos datos: no se duplicará la reserva." };
  }
  revalidatePath(`/admin/canchas/${input.court_id}/turnos`);
  redirect(reservationUrl(input.court_id, input.service_date, input.minute, input.request_id));
}
