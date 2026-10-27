"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { signIn, recoverAccess, updatePassword } from "./actions";

export function AuthForm({ mode }: { mode: "login" | "recover" | "password" }) {
  const action = mode === "login" ? signIn : mode === "recover" ? recoverAccess : updatePassword;
  const [state, formAction, pending] = useActionState(action, { message: "" });
  return <form action={formAction} className="ui-stack">
    {mode !== "password" && <Input label="Email" name="email" type="email" autoComplete="email" required maxLength={254} />}
    {mode !== "recover" && <Input label={mode === "password" ? "Nueva contraseña" : "Contraseña"} name="password" type="password" autoComplete={mode === "password" ? "new-password" : "current-password"} minLength={mode === "password" ? 12 : 1} maxLength={mode === "password" ? 128 : 256} required hint={mode === "password" ? "Usá al menos 12 caracteres." : undefined} />}
    {mode === "password" && <Input label="Repetir contraseña" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />}
    {state.message && <p role={state.success ? "status" : "alert"} className={state.success ? "notice" : "ui-field-error"}>{state.message}</p>}
    <Button type="submit" loading={pending}>{mode === "login" ? "Ingresar" : mode === "recover" ? "Enviar enlace" : "Guardar contraseña"}</Button>
  </form>;
}
