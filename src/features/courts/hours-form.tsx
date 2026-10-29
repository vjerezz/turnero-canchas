"use client";
import { useActionState, useState } from "react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { weekdays, formatLocalMinute, type WeeklyWindow } from "./weekly-hours";
import { saveWeeklyHours } from "./hours-actions";

export function HoursForm({ courtId, version, windows }: { courtId: string; version: number; windows: WeeklyWindow[] }) {
  const [enabled, setEnabled] = useState(() => weekdays.map((_, day) => windows.some((w) => w.weekday === day)));
  const [state, action, pending] = useActionState(saveWeeklyHours, { message: "" });
  return <form action={action} className="ui-stack">
    <input type="hidden" name="court_id" value={courtId} /><input type="hidden" name="version" value={version} />
    {weekdays.map((day, index) => {
      const window = windows.find((w) => w.weekday === index);
      return <fieldset key={day} className="ui-card ui-stack" disabled={pending}>
        <legend>{day}</legend>
        <label className="ui-row"><input type="checkbox" name={`enabled_${index}`} checked={enabled[index]} onChange={(event) => setEnabled((values) => values.map((value, i) => i === index ? event.target.checked : value))} />Abierto</label>
        <Input label={`Apertura del ${day.toLowerCase()}`} name={`opens_${index}`} type="time" step={60} required={enabled[index]} disabled={!enabled[index]} defaultValue={window ? formatLocalMinute(window.opens_minute) : ""} />
        <Input label={`Cierre del ${day.toLowerCase()}`} name={`closes_${index}`} type="time" step={60} required={enabled[index]} disabled={!enabled[index]} defaultValue={window ? formatLocalMinute(window.closes_minute) : ""} />
        <label className="ui-row"><input type="checkbox" name={`overnight_${index}`} disabled={!enabled[index]} defaultChecked={!!window && window.closes_minute >= 1440} />Cierra al día siguiente</label>
      </fieldset>;
    })}
    {state.message && <p role="alert" className="ui-field-error">{state.message}</p>}
    <Button type="submit" loading={pending}>Guardar horarios</Button>
  </form>;
}
