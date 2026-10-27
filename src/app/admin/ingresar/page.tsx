import Link from "next/link";
import { AuthForm } from "@/features/auth/form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_PUBLISHABLE_KEY;
  return <section className="ui-card ui-stack auth-card">
    <p className="eyebrow">Equipo del complejo</p><h1>Ingresá a Turnero</h1>
    <p className="intro-copy">Usá el email de tu cuenta del equipo. El acceso a cada complejo se habilita mediante el alta asistida o una invitación.</p>
    {error && <p role="alert">El enlace no es válido o venció. Solicitá uno nuevo.</p>}
    {configured ? <><AuthForm mode="login" /><Link href="/admin/recuperar-acceso">Olvidé mi contraseña</Link></> : <p role="status">El acceso del equipo todavía no está configurado en este entorno.</p>}
    {process.env.NODE_ENV === "development" && <Link href="/demo/admin">Ver demostración sin iniciar sesión</Link>}
  </section>;
}
