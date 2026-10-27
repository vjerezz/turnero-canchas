"use client";

import { DropdownMenu as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { useArea } from "./area-provider";
import { cn } from "@/lib/utils";

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;
export function DropdownMenuContent({ className, ...props }: ComponentProps<typeof Primitive.Content>) {
  const area = useArea();
  return <Primitive.Portal><Primitive.Content data-area={area} sideOffset={8} collisionPadding={16} className={cn("ui-menu", className)} {...props} /></Primitive.Portal>;
}
export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof Primitive.Item>) {
  return <Primitive.Item className={cn("ui-menu-item", className)} {...props} />;
}
