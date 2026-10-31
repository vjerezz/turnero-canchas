import { hoursForServiceDate, localDateSchema, type DateException } from "./date-exceptions";
import { weeklyTurnPreview, type WeeklyWindow } from "./weekly-hours";
import type { Sport } from "./schedule";
import { checkBookingWindow } from "./booking-window";

export const courtTimeZone = "America/Argentina/Buenos_Aires";
const localParts = new Intl.DateTimeFormat("en-CA", { timeZone: courtTimeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
function parts(instant: Date) {
  return Object.fromEntries(localParts.formatToParts(instant).map((part) => [part.type, part.value]));
}
export function localToday(now: Date) {
  const p = parts(now);
  return `${p.year}-${p.month}-${p.day}`;
}
export function shiftServiceDate(date: string, days: number) {
  const shifted = new Date(`${localDateSchema.parse(date)}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}
// Resuelve hora de pared mediante la zona IANA, sin depender de la zona del host.
export function serviceMinuteToInstant(date: string, minute: number) {
  if (!Number.isInteger(minute) || minute < 0 || minute > 2879) throw new Error("Minuto inválido.");
  const target = new Date(`${localDateSchema.parse(date)}T00:00:00Z`).getTime() + minute * 60_000;
  let candidate = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const p = parts(new Date(candidate));
    const wall = new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`).getTime();
    if (wall === target) return new Date(candidate);
    candidate += target - wall;
  }
  throw new Error("La hora local no se puede resolver en Buenos Aires.");
}

export function serviceDayPreview(date: string, sport: Sport, weekly: WeeklyWindow[], exceptions: (DateException & { active?: boolean })[], now: Date) {
  const window = hoursForServiceDate(date, weekly, exceptions);
  if (!window) return { window: null, conflict: false, turns: [] };
  const before = hoursForServiceDate(shiftServiceDate(date, -1), weekly, exceptions);
  const after = hoursForServiceDate(shiftServiceDate(date, 1), weekly, exceptions);
  const conflict = !!((before && before.closes_minute - 1440 > window.opens_minute) || (after && window.closes_minute > after.opens_minute + 1440));
  const turns = weeklyTurnPreview(window, sport).map((turn) => ({ ...turn,
    startsAt: serviceMinuteToInstant(date, turn.start), endsAt: serviceMinuteToInstant(date, turn.end),
    bookingWindow: checkBookingWindow(serviceMinuteToInstant(date, turn.start), now),
  }));
  return { window, conflict, turns };
}
