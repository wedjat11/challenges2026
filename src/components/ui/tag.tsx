import type { ReactNode } from "react";

import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

/**
 * design-system: UI Primitives and Their States.
 *
 * No `"use client"` here (D8) — `onRemove` stays a plain optional prop, so
 * a server component can render `Tag` with no interactivity at all, and
 * only a client ancestor (the rule builder, `"use client"`) that actually
 * wires `onRemove` pulls this component into a client-rendered subtree.
 */

export type TagProps = {
  children?: ReactNode;
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
};

export function Tag({ children, selected = false, removable = false, onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-caption font-medium",
        selected
          ? "border-border-accent bg-action-primary text-action-primary-fg"
          : "border-border-subtle bg-surface-2 text-text-secondary",
        className,
      )}
    >
      {children}
      {removable ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="inline-flex h-4 w-4 items-center justify-center rounded-pill text-current"
        >
          <Icon name="x" size={12} />
        </button>
      ) : null}
    </span>
  );
}
