"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createReservation } from "./actions";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function ReservationForm({ court, date, minute, request, total, submitAction = createReservation }: { court: string; date: string; minute: number; request: string; total: number; submitAction?: typeof createReservation }) {
  const [state, action, pending] = useActionState(submitAction, { message: "" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Avoid accepting input before React attaches handlers: hydration could erase it.
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  return <form action={action} className="ui-stack">
    <input type="hidden" name="court_id" value={court} /><input type="hidden" name="service_date" value={date} />
    <input type="hidden" name="minute" value={minute} /><input type="hidden" name="request_id" value={request} />
    <input type="hidden" name="expected_total" value={total} />
    <Input label="Nombre del cliente" name="name" autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} disabled={!ready || pending} />
    <Input label="Email del cliente" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} disabled={!ready || pending} />
    <p>La reserva quedará pendiente de seña durante 15 minutos. Todavía no se generan cobros ni se envían emails desde este formulario.</p>
    {state.message && <p role="alert" className="ui-field-error">{state.message}</p>}
    {!ready && <p role="status">Preparando formulario…</p>}
    <Button type="submit" loading={pending} disabled={!ready}>Crear reserva pendiente</Button>
  </form>;
}
