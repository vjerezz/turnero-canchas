import { expect, it } from "vitest";
import { formatLocalMinute, localTimeSchema, weeklyHoursSchema, weeklyTurnPreview } from "./weekly-hours";

it("genera turnos de pádel continuos durante una franja nocturna", () => {
  const window = { weekday: 0, opens_minute: 18 * 60, closes_minute: 26 * 60 };
  expect(weeklyHoursSchema.safeParse([window]).success).toBe(true);
  const turns = weeklyTurnPreview(window, "padel");
  expect(turns).toHaveLength(5);
  expect(turns[3]).toEqual({ start: 1350, end: 1440 });
  expect(turns[4]).toEqual({ start: 1440, end: 1530 });
  expect(formatLocalMinute(1530)).toBe("01:30");
});
it("rechaza solapamiento entre domingo y lunes", () => {
  expect(weeklyHoursSchema.safeParse([{ weekday: 6, opens_minute: 1200, closes_minute: 1560 }, { weekday: 0, opens_minute: 60, closes_minute: 180 }]).success).toBe(false);
});
it("permite franjas contiguas entre domingo y lunes", () => {
  expect(weeklyHoursSchema.safeParse([{ weekday: 6, opens_minute: 1200, closes_minute: 1560 }, { weekday: 0, opens_minute: 120, closes_minute: 180 }]).success).toBe(true);
});
it.each([
  [{ weekday: 0, opens_minute: 600, closes_minute: 600 }],
  [{ weekday: 0, opens_minute: 600, closes_minute: 500 }],
  [{ weekday: 0, opens_minute: 0, closes_minute: 1500 }],
  [{ weekday: 0, opens_minute: 0, closes_minute: 60 }, { weekday: 0, opens_minute: 60, closes_minute: 120 }],
])("rechaza franjas inválidas o días duplicados", (...windows) => {
  expect(weeklyHoursSchema.safeParse(windows).success).toBe(false);
});
it.each(["24:00", "25:10", "12:60", "1:30", "12:30:00", ""])("rechaza horas inválidas: %s", (time) => {
  expect(localTimeSchema.safeParse(time).success).toBe(false);
});
it("convierte la hora local sin interpretar fechas ni UTC", () => {
  expect(localTimeSchema.parse("01:30")).toBe(90);
  expect(weeklyHoursSchema.parse([])).toEqual([]);
});
