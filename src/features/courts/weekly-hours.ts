import { z } from "zod";
import { sports, type Sport } from "./schedule";

export const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
const windowSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  opens_minute: z.number().int().min(0).max(1439),
  closes_minute: z.number().int().min(1).max(2879),
}).refine((w) => w.closes_minute > w.opens_minute && w.closes_minute <= w.opens_minute + 1440, "El cierre debe ser posterior a la apertura y la franja no puede superar 24 horas.");
export const weeklyHoursSchema = z.array(windowSchema).max(7).superRefine((windows, ctx) => {
  if (new Set(windows.map((w) => w.weekday)).size !== windows.length) {
    ctx.addIssue({ code: "custom", message: "Solo se admite una franja por día." });
  }
  for (let i = 0; i < windows.length; i++) for (let j = i + 1; j < windows.length; j++) {
    const a = windows[i], b = windows[j];
    for (const shift of [-10080, 0, 10080]) {
      if (a.weekday * 1440 + a.opens_minute < b.weekday * 1440 + b.closes_minute + shift &&
          b.weekday * 1440 + b.opens_minute + shift < a.weekday * 1440 + a.closes_minute) {
        ctx.addIssue({ code: "custom", message: "Hay horarios superpuestos entre días consecutivos." });
        return;
      }
    }
  }
});
export type WeeklyWindow = z.infer<typeof windowSchema>;
export const localTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).transform((time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3)));
export function formatLocalMinute(minute: number) {
  return `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
export function weeklyTurnPreview(window: WeeklyWindow, sport: Sport) {
  const duration = sports[sport].durationMinutes;
  const turns: { start: number; end: number }[] = [];
  for (let start = window.opens_minute; start + duration <= window.closes_minute; start += duration) {
    turns.push({ start, end: start + duration });
  }
  return turns;
}
