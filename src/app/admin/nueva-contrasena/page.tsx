import { AuthForm } from "@/features/auth/form";
import { requireUser } from "@/features/auth/session";

export default async function PasswordPage() {
  await requireUser();
  return <section className="ui-card ui-stack auth-card"><p className="eyebrow">Cuenta del equipo</p><h1>Elegí tu contraseña</h1><AuthForm mode="password" /></section>;
}
