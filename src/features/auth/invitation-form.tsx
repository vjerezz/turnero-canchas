"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { acceptInvitation } from "./accept-invitation";

export function InvitationForm() {
  const [state, action, pending] = useActionState(acceptInvitation, { message: "" });
  return <form action={action} className="ui-stack">
    <Input label="Código de invitación" name="token" type="password" autoComplete="off" spellCheck={false} required minLength={72} maxLength={72} hint="Pegá el código completo de la invitación." />
    {state.message && <p role="alert" className="ui-field-error">{state.message}</p>}
    <Button type="submit" loading={pending}>Aceptar invitación</Button>
  </form>;
}
