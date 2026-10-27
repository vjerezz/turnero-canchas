"use client";

import { Toast as Primitive } from "radix-ui";
import { X } from "lucide-react";
import { useArea } from "./area-provider";
import { Button } from "./button";

export function Toast({ open, onOpenChange, title, description }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string }) {
  const area = useArea();
  return <Primitive.Provider duration={6000} label="Aviso"><Primitive.Root data-area={area} className="ui-toast" open={open} onOpenChange={onOpenChange}>
    <div><Primitive.Title className="ui-toast-title">{title}</Primitive.Title><Primitive.Description>{description}</Primitive.Description></div>
    <Primitive.Close asChild><Button variant="ghost" aria-label="Cerrar aviso"><X aria-hidden="true" /></Button></Primitive.Close>
  </Primitive.Root><Primitive.Viewport className="ui-toast-viewport" label="Avisos ({hotkey})" /></Primitive.Provider>;
}
