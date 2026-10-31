"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { restoreWeeklyHours } from "./exception-actions";

export function RestoreHoursForm({ courtId, date }: { courtId: string; date: string }) {
  const [state, action, pending] = useActionState(restoreWeeklyHours, { message: "" });
  return <form action={action} className="ui-stack">
    <input type="hidden" name="court_id" value={courtId} />
    <input type="hidden" name="service_date" value={date} />
    <label className="ui-row"><input type="checkbox" name="confirm" required disabled={pending} />Confirmo volver al horario semanal del {date.split("-").reverse().join("/")}</label>
    <Button type="submit" loading={pending}>Volver al horario semanal</Button>
    {state.message && <p role="status">{state.message}</p>}
  </form>;
}
