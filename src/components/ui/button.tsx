import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

/**
 * design-system: UI Primitives and Their States (Disabled primitive is
 * non-interactive; Button loading state blocks resubmission).
 *
 * No client-boundary directive (D8): hover/press/focus states are Tailwind variants,
 * not React state. No `onClick` prop — the type omits it, so a caller
 * relies on `type="submit"` inside a `<form action>` or a native `formAction`,
 * matching every form pattern already in this repo (`/account`).
 */

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-control font-body font-medium " +
  "transition-colors focus-visible:outline-none disabled:opacity-38 disabled:cursor-not-allowed";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-action-primary text-action-primary-fg hover:bg-action-primary-hover active:bg-action-primary-active",
  secondary: "bg-action-secondary text-action-secondary-fg hover:bg-action-secondary-hover",
  ghost: "bg-transparent text-action-ghost-fg hover:bg-surface-2",
  outline: "border border-border-strong bg-transparent text-text-primary hover:bg-surface-2",
  danger: "bg-red-500 text-text-inverse hover:bg-red-400 active:bg-red-600",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-body-sm",
  md: "h-10 px-4 text-body",
  lg: "h-12 px-6 text-body-lg",
};

export type ButtonProps = {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconAfter?: IconName;
  fullWidth?: boolean;
  loading?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

/**
 * Additive export (S5a deviation, see apply-progress.md) — `Button` renders
 * a `<button>` and has no `href`, so a caller that needs a `<a>`/`next/link`
 * styled identically (e.g. a primary call-to-action link) cannot render
 * `<Button>` at all without nesting an invalid `<button>` inside an `<a>`.
 * Reuses the exact same class maps `Button` renders from, so the two never
 * drift apart — see the `buttonClassName` describe block in
 * `button.test.tsx`, which asserts this by comparing against `Button`'s own
 * rendered `class` attribute rather than pinning a literal string.
 */
export function buttonClassName(options: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  const { variant = "primary", size = "md", fullWidth = false, className } = options;

  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], fullWidth && "w-full", className);
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconAfter,
  fullWidth = false,
  loading = false,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? "true" : undefined}
      className={cn(
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Icon name="loader-circle" className="motion-safe:animate-spin motion-reduce:animate-none" />
      ) : icon ? (
        <Icon name={icon} />
      ) : null}
      {children}
      {!loading && iconAfter ? <Icon name={iconAfter} /> : null}
    </button>
  );
}
