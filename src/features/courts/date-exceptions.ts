import { z } from "zod";
import type { WeeklyWindow } from "./weekly-hours";

export const localDateSchema = z.iso.date();
export const dateExceptionSchema = z.object({
  service_date: localDateSchema,
  closed: z.boolean(),
  opens_minute: z.number().int().min(0).max(1439).nullable(),
  closes_minute: z.number().int().min(1).max(2879).nullable(),
}).refine((x) => x.closed
  ? x.opens_minute === null && x.closes_minute === null
  : x.opens_minute !== null && x.closes_minute !== null && x.closes_minute > x.opens_minute && x.closes_minute <= x.opens_minute + 1440,
"Indicá una apertura y un cierre posterior, con una duración máxima de 24 horas.");
export type DateException = z.infer<typeof dateExceptionSchema>;

// La fecha identifica la jornada de apertura, también cuando termina al día siguiente.
export function hoursForServiceDate(date: string, weekly: WeeklyWindow[], exceptions: (DateException & { active?: boolean })[]) {
  const validDate = localDateSchema.parse(date);
  const weekday = (new Date(`${validDate}T12:00:00Z`).getUTCDay() + 6) % 7;
  const override = exceptions.find((x) => x.service_date === validDate && x.active !== false);
  if (override) {
    const parsed = dateExceptionSchema.parse(override);
    return parsed.closed ? null : { weekday, opens_minute: parsed.opens_minute!, closes_minute: parsed.closes_minute! };
  }
  return weekly.find((x) => x.weekday === weekday) ?? null;
}
