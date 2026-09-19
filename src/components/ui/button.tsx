import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

/**
 * design-system: UI Primitives and Their States (Disabled primitive is
 * non-interactive; Button loading state blocks resubmission).
 *
 * No `"use client"` (D8): hover/press/focus states are Tailwind variants,
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
