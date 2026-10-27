import { Check, LockKeyhole, LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function FilterChip({ selected, className, children, ...props }: ComponentProps<"button"> & { selected: boolean }) {
  return <button type="button" className={cn("ui-chip", className)} aria-pressed={selected} {...props}>{selected && <Check aria-hidden="true" />}{children}</button>;
}

export function TimeSlot({ time, state = "available", className, ...props }: Omit<ComponentProps<"button">, "children"> & { time: string; state?: "available" | "selected" | "unavailable" | "loading" }) {
  const label = { available: "Disponible", selected: "Seleccionado", unavailable: "Ocupado", loading: "Cargando" }[state];
  return <button type="button" className={cn("ui-slot", className)} aria-pressed={state === "selected"} disabled={state === "unavailable" || state === "loading"} aria-busy={state === "loading" || undefined} {...props}>
    <span className="ui-row">{state === "selected" && <Check aria-hidden="true" />}{state === "unavailable" && <LockKeyhole aria-hidden="true" />}{state === "loading" && <LoaderCircle className="ui-spin" aria-hidden="true" />}<strong>{time}</strong></span><span>{label}</span>
  </button>;
}
