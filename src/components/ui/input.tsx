import type { InputHTMLAttributes, ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

/**
 * design-system: UI Primitives and Their States (Input error state is
 * visually distinct). D9 — uncontrolled, native `name`/`defaultValue`, no
 * `value`/`onChange`; the server action is the only validator.
 *
 * `aria-describedby` derives from `id ?? name` rather than `useId()`, which
 * only works inside a client component render — this stays server-
 * renderable, per the design's accessibility note.
 */

export type InputProps = {
  label: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  suffix?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & { id?: string };

export function Input({
  label,
  hint,
  error,
  icon,
  suffix,
  id,
  name,
  className,
  ...rest
}: InputProps) {
  const fieldId = id ?? name;
  const errorId = error && fieldId ? `${fieldId}-error` : undefined;
  const hintId = !error && hint && fieldId ? `${fieldId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-body-sm font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon ? (
          <span className="pointer-events-none absolute left-3 text-text-muted">
            <Icon name={icon} size={16} />
          </span>
        ) : null}
        <input
          id={fieldId}
          name={name}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId ?? hintId}
          className={cn(
            "h-10 w-full rounded-control border bg-surface-1 px-3 text-body text-text-primary",
            "placeholder:text-text-faint focus-visible:outline-none",
            icon && "pl-9",
            Boolean(suffix) && "pr-9",
            error ? "border-red-500" : "border-border-subtle",
            className,
          )}
          {...rest}
        />
        {suffix ? <span className="absolute right-3 text-text-muted">{suffix}</span> : null}
        {error ? (
          <span aria-hidden="true" className="absolute right-3 text-red-500">
            <Icon name="circle-alert" size={16} />
          </span>
        ) : null}
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
