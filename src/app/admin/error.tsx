"use client";
import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { reset: () => void }) {
  return <section className="ui-card ui-stack"><h1>No pudimos cargar el acceso</h1><p role="alert">Revisá la conexión y volvé a intentarlo. Si el problema sigue, contactá al responsable del alta.</p><Button onClick={reset}>Reintentar</Button></section>;
}
