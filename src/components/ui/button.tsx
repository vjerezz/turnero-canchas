import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("ui-button", {
  variants: {
    variant: { primary: "ui-button-primary", secondary: "ui-button-secondary", ghost: "ui-button-ghost", destructive: "ui-button-destructive" },
  },
  defaultVariants: { variant: "primary" },
});

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { loading?: boolean; asChild?: boolean };

export function Button({ className, variant, loading, disabled, asChild, children, type = "button", ...props }: ButtonProps) {
  if (asChild) return <Slot.Root className={cn(buttonVariants({ variant }), className)} {...props}>{children}</Slot.Root>;
  return <button type={type} className={cn(buttonVariants({ variant }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading && <LoaderCircle className="ui-spin" aria-hidden="true" />}{children}
  </button>;
}
