import { z } from "zod";
import { localDateSchema } from "../courts/date-exceptions";

export const serviceDateSchema = localDateSchema.refine((date) => date >= "2000-01-02" && date <= "9998-12-30");
export const availabilitySchema = z.object({
  server_now: z.string().datetime({ offset: true }),
  reason: z.enum(["closed", "inactive", "schedule_conflict"]).nullable(),
  court_name: z.string(), duration_minutes: z.union([z.literal(60), z.literal(90)]),
  total_in_cents: z.number().int().nonnegative().max(99999999999),
  deposit_in_cents: z.number().int().nonnegative(),
  slots: z.array(z.object({ minute: z.number().int().min(0).max(2879),
    starts_at: z.string().datetime({ offset: true }), ends_at: z.string().datetime({ offset: true }),
    state: z.enum(["available", "occupied", "too_soon", "too_late"]),
  })),
});
export const reservationInputSchema = z.object({
  court_id: z.uuid(), service_date: serviceDateSchema,
  minute: z.coerce.number().int().min(0).max(2879), request_id: z.uuid(),
  name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  expected_total: z.coerce.number().int().nonnegative().max(99999999999),
});
export function reservationUrl(court: string, date: string, minute: number, request: string) {
  return `/admin/canchas/${court}/reservar?${new URLSearchParams({ fecha: date, minuto: String(minute), solicitud: request })}`;
}
export function formatArs(cents: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(cents / 100);
}
