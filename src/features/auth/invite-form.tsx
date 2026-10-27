"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { inviteAdministrator } from "./invite-administrator";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteAdministrator, { message: "" });
  return <form action={action} className="ui-stack">
    <Input label="Email del administrador" name="email" type="email" required maxLength={254} autoComplete="email" hint="Necesita una cuenta con este email verificado para aceptar." />
    <Button type="submit" loading={pending}>Enviar invitación</Button>
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
  </form>;
}
