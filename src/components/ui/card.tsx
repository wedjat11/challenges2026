import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * design-system: UI Primitives and Their States.
 *
 * No `onClick` (dropped vs the design export, D10) — `interactive` is a
 * pure hover-state Tailwind variant, no JS. `as` lets a caller render list
 * items (`<li>`) or semantic sections (`<article>`) without a wrapper.
 */

type CardSurface = "1" | "2" | "3";
type CardPadding = "none" | "sm" | "md" | "lg";
type CardElevation = 0 | 1 | 2 | 3;
type CardElement = "div" | "article" | "li";

const SURFACE_CLASSES: Record<CardSurface, string> = {
  "1": "bg-surface-1",
  "2": "bg-surface-2",
  "3": "bg-surface-3",
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

const ELEVATION_CLASSES: Record<CardElevation, string> = {
  0: "shadow-none",
  1: "shadow-1",
  2: "shadow-2",
  3: "shadow-3",
};

export type CardProps = {
  children?: ReactNode;
  surface?: CardSurface;
  padding?: CardPadding;
  accentEdge?: boolean;
  elevation?: CardElevation;
  interactive?: boolean;
  as?: CardElement;
  className?: string;
};

export function Card({
  children,
  surface = "1",
  padding = "md",
  accentEdge = false,
  elevation = 1,
  interactive = false,
  as: Element = "div",
  className,
}: CardProps) {
  return (
    <Element
      className={cn(
        "rounded-card border border-border-hairline",
        SURFACE_CLASSES[surface],
        PADDING_CLASSES[padding],
        ELEVATION_CLASSES[elevation],
        accentEdge && "border-t-2 border-t-action-primary",
        interactive && "hover:bg-surface-3 transition-colors",
        className,
      )}
    >
      {children}
    </Element>
  );
}
