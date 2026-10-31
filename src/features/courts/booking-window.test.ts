import { expect, it } from "vitest";
import { checkBookingWindow } from "./booking-window";

const now = new Date("2026-10-29T23:00:00-03:00");
it.each([
  [-1, "too-soon"],
  [0, "too-soon"],
  [2 * 60 * 60_000 - 1, "too-soon"],
  [30 * 24 * 60 * 60_000 + 1, "too-far"],
])("rechaza un inicio a %i ms del reloj del servidor", (offset, reason) => {
  expect(checkBookingWindow(new Date(now.getTime() + offset), now)).toEqual({ allowed: false, reason });
});
it.each([2 * 60 * 60_000, 30 * 24 * 60 * 60_000])("incluye el límite de %i ms", (offset) => {
  expect(checkBookingWindow(new Date(now.getTime() + offset), now)).toEqual({ allowed: true });
});
it("calcula el mínimo aunque el turno empiece al día siguiente", () => {
  expect(checkBookingWindow(new Date("2026-10-30T01:00:00-03:00"), now)).toEqual({ allowed: true });
});
it("usa instantes equivalentes independientemente de su zona de origen", () => {
  expect(checkBookingWindow(new Date("2026-10-30T04:00:00Z"), now)).toEqual({ allowed: true });
});
it.each([[new Date(NaN), now], [now, new Date(NaN)]])("rechaza fechas inválidas", (start, clock) => {
  expect(checkBookingWindow(start, clock)).toEqual({ allowed: false, reason: "invalid-date" });
});
