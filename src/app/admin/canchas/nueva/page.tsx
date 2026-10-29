import Link from "next/link";
import { requireComplex } from "@/features/auth/session";
import { CourtForm } from "@/features/courts/court-form";
export default async function NewCourtPage() {
  const { complex } = await requireComplex();
  return <section className="ui-card ui-stack auth-card"><Link href="/admin/canchas">Volver a canchas</Link><p>{complex.name}</p><h1>Nueva cancha</h1><CourtForm /></section>;
}
