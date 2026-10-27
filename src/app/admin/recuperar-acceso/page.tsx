import Link from "next/link";
import { AuthForm } from "@/features/auth/form";

export default function RecoverPage() {
  return <section className="ui-card ui-stack auth-card"><p className="eyebrow">Cuenta del equipo</p><h1>Recuperá tu acceso</h1><p className="intro-copy">Ingresá el email que usás para administrar el complejo.</p><AuthForm mode="recover" /><Link href="/admin/ingresar">Volver al ingreso</Link></section>;
}
