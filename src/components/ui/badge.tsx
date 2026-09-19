import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

/** design-system: UI Primitives and Their States. */

type BadgeTone = "neutral" | "win" | "pending" | "live" | "info" | "loss";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-text-secondary",
  win: "bg-green-tint text-green-500",
  pending: "bg-amber-tint text-amber-500",
  live: "bg-blue-tint text-blue-500",
  info: "bg-blue-tint text-blue-500",
  loss: "bg-red-tint text-red-500",
};

export type BadgeProps = {
  children?: ReactNode;
  tone?: BadgeTone;
  icon?: IconName;
  dot?: boolean;
  pill?: boolean;
  className?: string;
};

export function Badge({
  children,
  tone = "neutral",
  icon,
  dot = false,
  pill = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-caption font-medium",
        pill ? "rounded-pill" : "rounded-control",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-pill bg-current" /> : null}
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}
