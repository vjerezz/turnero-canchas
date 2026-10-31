import { expect, it } from "vitest";
import { dateExceptionSchema, hoursForServiceDate } from "./date-exceptions";
const weekly = [0, 1].map((weekday) => ({ weekday, opens_minute: 1080, closes_minute: 1560 }));
const closed = { service_date: "2026-11-03", closed: true, opens_minute: null, closes_minute: null };
it("cerrar martes suprime su madrugada del miércoles y conserva la jornada del lunes", () => {
  expect(hoursForServiceDate("2026-11-03", weekly, [closed])).toBeNull();
  expect(hoursForServiceDate("2026-11-02", weekly, [closed])).toEqual(weekly[0]);
});
it("reemplaza la franja habitual por el horario especial nocturno", () => {
  expect(hoursForServiceDate("2026-11-03", weekly, [{ ...closed, closed: false, opens_minute: 1200, closes_minute: 1500 }])).toEqual({ weekday: 1, opens_minute: 1200, closes_minute: 1500 });
});
it("permite abrir una jornada habitualmente cerrada", () => {
  expect(hoursForServiceDate("2026-11-03", [], [{ ...closed, closed: false, opens_minute: 600, closes_minute: 720 }])).not.toBeNull();
});
it.each(["2026-02-29", "2026-11-31", "03/11/2026"])("rechaza fecha inexistente o ambigua %s", (date) => {
  expect(() => hoursForServiceDate(date, weekly, [])).toThrow();
});
it.each([
  { ...closed, opens_minute: 600 },
  { ...closed, closed: false },
  { ...closed, closed: false, opens_minute: 600, closes_minute: 600 },
  { ...closed, closed: false, opens_minute: 600, closes_minute: 2041 },
])("rechaza horarios contradictorios", (input) => {
  expect(dateExceptionSchema.safeParse(input).success).toBe(false);
});

it("restaurar la jornada recupera el horario semanal sin afectar otras fechas", () => {
  expect(hoursForServiceDate("2026-11-03", weekly, [{ ...closed, active: false }])).toEqual(weekly[1]);
});
