"use client";
import { useActionState, useState } from "react";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveDateException } from "./exception-actions";

export function ExceptionForm({ courtId }: { courtId: string }) {
  const [mode, setMode] = useState("closed");
  const [state, action, pending] = useActionState(saveDateException, { message: "" });
  return <form action={action} className="ui-stack">
    <input type="hidden" name="court_id" value={courtId} />
    <fieldset disabled={pending} className="ui-stack">
      <legend>Agregar o reemplazar excepción</legend>
      <Input label="Fecha de la jornada" name="service_date" type="date" required />
      <Select label="Tipo de excepción" name="mode" value={mode} onChange={(event) => setMode(event.target.value)}>
        <option value="closed">Jornada cerrada</option><option value="special">Horario especial</option>
      </Select>
      {mode === "special" && <>
        <Input label="Apertura especial" name="opens" type="time" step={60} required />
        <Input label="Cierre especial" name="closes" type="time" step={60} required />
        <label className="ui-row"><input name="overnight" type="checkbox" />Cierra al día siguiente</label>
      </>}
      <p className="ui-hint">Si la fecha ya tiene una excepción, se reemplazará al guardar.</p>
      <Button type="submit" loading={pending}>Guardar excepción</Button>
    </fieldset>
    {state.message && <p role="status">{state.message}</p>}
  </form>;
}
