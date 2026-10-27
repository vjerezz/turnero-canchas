"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Alert, Badge, EmptyState, Skeleton } from "@/components/ui/feedback";

export function DemoLink({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Button variant={secondary ? "secondary" : "primary"} asChild><Link href={`/demo${href}`}>{children}<ArrowRight aria-hidden="true" /></Link></Button>;
}
export function Back({ href, children }: { href: string; children: ReactNode }) { return <Link className="demo-back" href={`/demo${href}`}><ArrowLeft aria-hidden="true" />{children}</Link>; }
export function CourtArt({ variant = "volt", padel = false }: { variant?: "volt" | "blue" | "ink"; padel?: boolean }) {
  return <div className={`court-art court-art-${variant}`} aria-hidden="true"><svg viewBox="0 0 360 180" fill="none"><rect x="18" y="18" width="324" height="144" rx="8" /><path d="M180 18v144" />{padel ? <><path d="M18 54h324M18 126h324M18 90h324" /></> : <><circle cx="180" cy="90" r="29" /><path d="M18 54h46v72H18M342 54h-46v72h46" /></>}</svg></div>;
}
export function BookingBadge({ status }: { status: string }) { return <Badge tone={status === "Confirmada" ? "info" : status === "Pendiente" ? "warning" : status === "Cancelada" ? "error" : "neutral"}>{status}</Badge>; }
export function PreviewState({ children, emptyTitle = "No hay resultados", emptyText = "Probá con otra fecha o cambiá los filtros." }: { children: ReactNode; emptyTitle?: string; emptyText?: string }) {
  const [state, setState] = useState("normal");
  return <><details className="demo-scenarios"><summary>Estados de esta pantalla</summary><Select label="Escenario de demostración" value={state} onChange={(event) => setState(event.target.value)}><option value="normal">Con datos</option><option value="loading">Cargando</option><option value="empty">Vacío</option><option value="error">Error</option><option value="stale">Datos desactualizados</option></Select></details>{state === "normal" ? children : state === "loading" ? <div className="demo-results"><Skeleton /><Skeleton /><Skeleton /><Button variant="secondary" onClick={() => setState("normal")}>Terminar carga de ejemplo</Button></div> : state === "empty" ? <EmptyState title={emptyTitle} action={<Button variant="secondary" onClick={() => setState("normal")}>Restablecer ejemplo</Button>}>{emptyText}</EmptyState> : <Alert tone={state === "error" ? "error" : "warning"} title={state === "error" ? "No pudimos cargar la información" : "La información cambió"}><p>Tu selección sigue disponible. Actualizá para continuar.</p><Button variant="secondary" onClick={() => setState("normal")}>Reintentar</Button></Alert>}</>;
}
