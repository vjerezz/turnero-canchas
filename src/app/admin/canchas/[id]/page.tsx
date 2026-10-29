import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireComplex } from "@/features/auth/session";
import { CourtForm } from "@/features/courts/court-form";
export default async function EditCourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, complex } = await requireComplex();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const { data, error } = await supabase.from("courts").select("*").eq("id", id.data).eq("complex_id", complex.id).maybeSingle();
  if (error) throw new Error("No pudimos cargar la cancha. Volvé a intentarlo.");
  if (!data) notFound();
  return <section className="ui-card ui-stack auth-card"><Link href="/admin/canchas">Volver a canchas</Link><p>{complex.name}</p><h1>Editar cancha</h1><CourtForm court={data} /></section>;
}
