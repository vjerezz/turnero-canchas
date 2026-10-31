import { expect, it } from "vitest";
import { localToday, serviceDayPreview, serviceMinuteToInstant, shiftServiceDate } from "./service-day";
const weekly = Array.from({ length: 7 }, (_, weekday) => ({ weekday, opens_minute: 1080, closes_minute: 1560 }));
const now = new Date("2026-10-29T15:00:00Z");
const closure = { service_date: "2026-10-30", closed: true, opens_minute: null, closes_minute: null, active: true };
it("resuelve medianoche local sin depender del huso horario del proceso", () => {
  expect(serviceMinuteToInstant("2026-10-30", 0).toISOString()).toBe("2026-10-30T03:00:00.000Z");
  expect(serviceMinuteToInstant("2026-10-30", 1500).toISOString()).toBe("2026-10-31T04:00:00.000Z");
  expect(localToday(new Date("2026-10-30T02:59:00Z"))).toBe("2026-10-29");
});
it("calcula fechas vecinas en cambios de mes, año y bisiesto", () => {
  expect(shiftServiceDate("2026-12-31", 1)).toBe("2027-01-01");
  expect(shiftServiceDate("2028-03-01", -1)).toBe("2028-02-29");
});
it("cerrar viernes elimina su madrugada de sábado y conserva la jornada del jueves", () => {
  expect(serviceDayPreview("2026-10-30", "football-5", weekly, [closure], now).turns).toEqual([]);
  const previous = serviceDayPreview("2026-10-29", "football-5", weekly, [closure], now);
  expect(previous.turns).toHaveLength(8);
  expect(previous.turns[7].endsAt.toISOString()).toBe("2026-10-30T05:00:00.000Z");
});
it("restaurar una excepción recupera ocho turnos de la semana", () => {
  expect(serviceDayPreview("2026-10-30", "football-5", weekly, [{ ...closure, active: false }], now).turns).toHaveLength(8);
});
it("ofrece solo turnos completos de pádel en la franja especial", () => {
  const result = serviceDayPreview("2026-10-30", "padel", weekly, [{ ...closure, closed: false, opens_minute: 1200, closes_minute: 1430 }], now);
  expect(result.turns).toHaveLength(2);
  expect(result.turns[1].end).toBe(1380);
});
it("advierte solapamiento con el día anterior pero permite extremos contiguos", () => {
  const special = { ...closure, closed: false, opens_minute: 60, closes_minute: 180 };
  expect(serviceDayPreview("2026-10-30", "football-5", weekly, [special], now).conflict).toBe(true);
  expect(serviceDayPreview("2026-10-30", "football-5", weekly, [{ ...special, opens_minute: 120 }], now).conflict).toBe(false);
});
it("advierte solapamiento con una apertura especial del día siguiente", () => {
  expect(serviceDayPreview("2026-10-29", "football-5", weekly, [{ ...closure, closed: false, opens_minute: 60, closes_minute: 180 }], now).conflict).toBe(true);
});
it("aplica el reloj del servidor a cada turno incluido el nocturno", () => {
  const result = serviceDayPreview("2026-10-29", "football-5", weekly, [], new Date("2026-10-30T01:00:00Z"));
  expect(result.turns[5].bookingWindow.allowed).toBe(false);
  expect(result.turns[6].bookingWindow.allowed).toBe(true);
});
it.each([-1, 2880, 2.5])("rechaza minuto inválido %s", (minute) => {
  expect(() => serviceMinuteToInstant("2026-10-30", minute)).toThrow();
});
