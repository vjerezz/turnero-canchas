"use client";

import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type FieldProps = { label: string; hint?: string; error?: string };

export function Input({ label, hint, error, id, className, ...props }: ComponentProps<"input"> & FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return <div className="ui-field">
    <label htmlFor={fieldId}>{label}</label>
    <input className={cn("ui-input", className)} id={fieldId} aria-invalid={!!error} aria-describedby={[hint && `${fieldId}-hint`, error && `${fieldId}-error`, props["aria-describedby"]].filter(Boolean).join(" ") || undefined} {...props} />
    {hint && <p className="ui-hint" id={`${fieldId}-hint`}>{hint}</p>}
    {error && <p role="alert" className="ui-field-error" id={`${fieldId}-error`}>{error}</p>}
  </div>;
}

// Native select keeps platform keyboard and touch-picker behavior.
export function Select({ label, hint, error, id, className, children, ...props }: ComponentProps<"select"> & FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return <div className="ui-field">
    <label htmlFor={fieldId}>{label}</label>
    <select className={cn("ui-input", className)} id={fieldId} aria-invalid={!!error} aria-describedby={[hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(" ") || undefined} {...props}>{children}</select>
    {hint && <p className="ui-hint" id={`${fieldId}-hint`}>{hint}</p>}
    {error && <p role="alert" className="ui-field-error" id={`${fieldId}-error`}>{error}</p>}
  </div>;
}
