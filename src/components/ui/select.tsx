import type { SelectHTMLAttributes } from "react";

import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

/**
 * design-system: UI Primitives and Their States (Input error state is
 * visually distinct, applied identically to Select). D9 — uncontrolled
 * native `<select>`, no `value`/`onChange`.
 */

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  label: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & { id?: string };

export function Select({
  label,
  hint,
  error,
  options,
  id,
  name,
  className,
  ...rest
}: SelectProps) {
  const fieldId = id ?? name;
  const errorId = error && fieldId ? `${fieldId}-error` : undefined;
  const hintId = !error && hint && fieldId ? `${fieldId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-body-sm font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative flex items-center">
        <select
          id={fieldId}
          name={name}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId ?? hintId}
          className={cn(
            "h-10 w-full appearance-none rounded-control border bg-surface-1 px-3 pr-9 text-body text-text-primary",
            "focus-visible:outline-none",
            error ? "border-red-500" : "border-border-subtle",
            className,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="pointer-events-none absolute right-3 text-text-muted">
          <Icon name="chevron-down" size={16} />
        </span>
      </div>
      {error ? (
        <p id={errorId} className="text-caption text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
