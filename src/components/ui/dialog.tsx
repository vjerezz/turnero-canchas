"use client";

import { Dialog as Primitive } from "radix-ui";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { useArea } from "./area-provider";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export const DialogTitle = Primitive.Title;
export const DialogDescription = Primitive.Description;

export function DialogContent({ children, className, variant = "dialog", ...props }: ComponentProps<typeof Primitive.Content> & { variant?: "dialog" | "sheet" }) {
  const area = useArea();
  return <Primitive.Portal><Primitive.Overlay className="ui-overlay" /><Primitive.Content data-area={area} className={cn("ui-dialog", variant === "sheet" && "ui-sheet", className)} {...props}>
    {children}<Primitive.Close asChild><Button variant="ghost" className="ui-dialog-close" aria-label="Cerrar"><X aria-hidden="true" /></Button></Primitive.Close>
  </Primitive.Content></Primitive.Portal>;
}
