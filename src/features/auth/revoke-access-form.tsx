"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { revokeTeamAccess } from "./team-actions";

export function RevokeAccessForm({ id, kind, label }: { id: string; kind: "administrator" | "invitation"; label: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(revokeTeamAccess, { message: "" });
  return <div className="ui-stack">
    {!confirming ? <Button variant="secondary" onClick={() => setConfirming(true)} aria-label={`Revocar acceso de ${label}`}>Revocar acceso</Button> :
      <form action={action} className="ui-stack">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="kind" value={kind} />
        <p>¿Revocar el acceso de {label}? {kind === "administrator" ? "Dejará de poder operar en este complejo." : "Ya no podrá aceptar esta invitación."}</p>
        <Button type="submit" variant="destructive" loading={pending}>Confirmar revocación</Button>
        <Button variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>Cancelar</Button>
      </form>}
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
  </div>;
}
