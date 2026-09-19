import type { ButtonHTMLAttributes } from "react";

import { Icon, type IconName } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

/**
 * design-system: UI Primitives and Their States.
 *
 * `label` is required (unlike the design export, where it was optional) —
 * an icon-only control with no accessible name is exactly the failure mode
 * this primitive exists to prevent, so it is not left to the caller to
 * remember.
 */

type IconButtonSize = "sm" | "md" | "lg";
type IconButtonVariant = "ghost" | "solid";

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost: "bg-transparent text-action-ghost-fg hover:bg-surface-2",
  solid: "bg-surface-2 text-text-primary hover:bg-surface-3",
};

export type IconButtonProps = {
  icon: IconName;
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  active?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

export function IconButton({
  icon,
  label,
  size = "md",
  variant = "ghost",
  active = false,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={active ? "true" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-control transition-colors",
        "focus-visible:outline-none disabled:opacity-38 disabled:cursor-not-allowed",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        active && "bg-surface-3 text-text-primary",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
