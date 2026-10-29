import { expect, it } from "vitest";
import { courtInputSchema, turnPriceSchema } from "./court-schema";

it.each([["12000", 1200000], ["12000,50", 1200050], ["0.29", 29], ["1,2", 120]])("convierte %s pesos sin redondeo binario", (value, expected) => {
  expect(turnPriceSchema.parse(value)).toBe(expected);
});
it.each(["-1", "1.234,50", "1e3", "NaN", "1.001", "", "1000000000"])("rechaza importes ambiguos o inválidos: %s", (value) => {
  expect(turnPriceSchema.safeParse(value).success).toBe(false);
});
it("construye una cancha con precio fijo en ARS y descarta campos no confiables", () => {
  expect(courtInputSchema.parse({ name: " Cancha 1 ", sport: "padel", pricePesos: "15000", complex_id: "foreign", duration: 30 }))
    .toEqual({ name: "Cancha 1", sport: "padel", priceInCents: 1500000, currency: "ARS" });
});
