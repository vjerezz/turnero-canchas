import { expect, it } from "vitest";
import { contiguousSlots, type Sport } from "./schedule";

it.each(["football-5", "football-6"] as Sport[])("genera turnos de fútbol contiguos que caben en la apertura: %s", (sport) => {
  const start = new Date("2026-10-28T20:00:00Z");
  const slots = contiguousSlots(sport, start, new Date("2026-10-28T23:30:00Z"));
  expect(slots).toHaveLength(3);
  expect(slots[0].end).toEqual(slots[1].start);
  expect(slots[2].end.toISOString()).toBe("2026-10-28T23:00:00.000Z");
  expect(start.toISOString()).toBe("2026-10-28T20:00:00.000Z");
});
it("pádel dura 90 minutos y respeta el cierre exacto incluso entre fechas UTC", () => {
  const slots = contiguousSlots("padel", new Date("2026-10-28T23:00:00Z"), new Date("2026-10-29T02:00:00Z"));
  expect(slots).toHaveLength(2);
  expect(slots[0].end.toISOString()).toBe("2026-10-29T00:30:00.000Z");
  expect(slots[1].start).toEqual(slots[0].end);
  expect(slots[1].end.toISOString()).toBe("2026-10-29T02:00:00.000Z");
});
it("no ofrece un turno parcial si la franja es más corta", () => {
  expect(contiguousSlots("padel", new Date(0), new Date(60 * 60_000))).toEqual([]);
});
it.each([[new Date(NaN), new Date(1)], [new Date(1), new Date(1)], [new Date(2), new Date(1)]])("rechaza franjas inválidas", (start, end) => {
  expect(() => contiguousSlots("padel", start, end)).toThrow();
});
