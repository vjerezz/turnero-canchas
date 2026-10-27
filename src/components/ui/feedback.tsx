import { CircleCheck, Info, TriangleAlert, CircleX } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "error" | "info";
export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span className={cn("ui-badge", className)} data-tone={tone} {...props} />;
}

export function Alert({ title, children, tone = "info", ...props }: Omit<ComponentProps<"div">, "title"> & { title: string; tone?: Exclude<Tone, "neutral"> }) {
  const Icon = { success: CircleCheck, warning: TriangleAlert, error: CircleX, info: Info }[tone];
  return <div className="ui-alert" data-tone={tone} {...props}><Icon aria-hidden="true" /><div><strong>{title}</strong>{children && <div>{children}</div>}</div></div>;
}

export function Skeleton({ label = "Cargando contenido" }: { label?: string }) {
  return <div role="status" aria-label={label} className="ui-skeleton-group"><span className="ui-skeleton" /><span className="ui-skeleton" /><span className="ui-skeleton ui-skeleton-short" /></div>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="ui-empty"><h3>{title}</h3><p>{children}</p>{action}</div>;
}
