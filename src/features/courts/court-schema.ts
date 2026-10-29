import { z } from "zod";
import { sportSchema } from "./schedule";

// Entrada decimal en pesos sin separador de miles; conversión exacta a centavos.
export const turnPriceSchema = z.string().trim()
  .regex(/^\d{1,9}(?:[.,]\d{1,2})?$/, "Ingresá un importe sin separador de miles y con hasta dos decimales.")
  .transform((value) => {
    const [pesos, decimals = ""] = value.replace(",", ".").split(".");
    return Number(pesos) * 100 + Number(decimals.padEnd(2, "0"));
  });

export const courtInputSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre de la cancha.").max(80),
  sport: sportSchema,
  pricePesos: turnPriceSchema,
}).transform(({ pricePesos, ...court }) => ({ ...court, priceInCents: pricePesos, currency: "ARS" as const }));
