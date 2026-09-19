import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * design-system: UI Primitives and Their States. Uncontrolled native
 * `<input type="radio">` (D9).
 */

export type RadioProps = {
  label: string;
  description?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & { id?: string };

export function Radio({ label, description, id, name, className, ...rest }: RadioProps) {
  const fieldId = id ?? name;

  return (
    <label htmlFor={fieldId} className="flex items-start gap-2.5">
      <input
        id={fieldId}
        name={name}
        type="radio"
        className={cn(
          "peer mt-0.5 h-4 w-4 shrink-0 rounded-pill border border-border-strong bg-surface-1",
          "checked:border-action-primary focus-visible:outline-none",
          className,
        )}
        {...rest}
      />
      <span className="flex flex-col">
        <span className="text-body-sm text-text-primary">{label}</span>
        {description ? (
          <span className="text-caption text-text-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
