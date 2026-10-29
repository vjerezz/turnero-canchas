"use client";
import { useActionState } from "react";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { CourtRow } from "@/lib/supabase/app-database";
import { sports } from "./schedule";
import { saveCourt } from "./actions";

export function CourtForm({ court }: { court?: CourtRow }) {
  const [state, action, pending] = useActionState(saveCourt, { message: "" });
  return <form action={action} className="ui-stack">
    {court && <input type="hidden" name="id" value={court.id} />}
    <Input label="Nombre de la cancha" name="name" required minLength={2} maxLength={80} defaultValue={court?.name} />
    <Select label="Deporte y duración" name="sport" defaultValue={court?.sport ?? "football-5"}>
      {Object.entries(sports).map(([value, sport]) => <option key={value} value={value}>{sport.label} · {sport.durationMinutes} minutos</option>)}
    </Select>
    <Input label="Precio por turno (ARS)" name="pricePesos" inputMode="decimal" required defaultValue={court ? (court.price_in_cents / 100).toFixed(2) : undefined} hint="Precio del turno completo. Sin separador de miles, por ejemplo: 15000,50." />
    {court && <label className="ui-row"><input type="checkbox" name="active" defaultChecked={court.active} />Cancha activa</label>}
    {court && <p className="ui-hint">Desactivarla conserva sus datos.</p>}
    {state.message && <p role="alert" className="ui-field-error">{state.message}</p>}
    <Button type="submit" loading={pending}>{court ? "Guardar cambios" : "Crear cancha"}</Button>
  </form>;
}
