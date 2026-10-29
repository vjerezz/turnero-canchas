import { z } from "zod";

export const sportSchema = z.enum(["football-5", "football-6", "padel"]);
export type Sport = z.infer<typeof sportSchema>;
export const sports = {
  "football-5": { label: "Fútbol 5", durationMinutes: 60 },
  "football-6": { label: "Fútbol 6", durationMinutes: 60 },
  padel: { label: "Pádel", durationMinutes: 90 },
} as const satisfies Record<Sport, { label: string; durationMinutes: number }>;

// Recibe instantes ya resueltos por el calendario del complejo.
// Genera turnos completos y contiguos; no certifica disponibilidad ni precio.
export function contiguousSlots(sport: Sport, start: Date, end: Date) {
  const parsedSport = sportSchema.parse(sport);
  const first = start.getTime();
  const last = end.getTime();
  if (!Number.isFinite(first) || !Number.isFinite(last) || first >= last) {
    throw new Error("El horario de cierre debe ser posterior al de apertura.");
  }
  const duration = sports[parsedSport].durationMinutes * 60_000;
  const slots: { start: Date; end: Date }[] = [];
  for (let cursor = first; cursor + duration <= last; cursor += duration) {
    slots.push({ start: new Date(cursor), end: new Date(cursor + duration) });
  }
  return slots;
}
