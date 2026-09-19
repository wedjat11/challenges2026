import { createElement } from "react";

import { ICON_PATHS } from "@/components/icons/paths";

/**
 * design-system: Vendored Icons, No External Icon CDN.
 *
 * Inline `<svg>`, no `unpkg.com` fetch and no runtime `innerHTML` — the
 * opposite of the design export's `<i data-lucide>` + CDN-script pattern.
 * Server component, no `"use client"` (D8): every glyph is static markup.
 */

export type IconName = keyof typeof ICON_PATHS;

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  className,
  title,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Omit for decoration (renders aria-hidden); supply when the glyph is the only label. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
    >
      {title ? <title>{title}</title> : null}
      {ICON_PATHS[name].map(([tag, attrs], index) =>
        // `tag` is a runtime string ("path" | "circle" | ...), so it cannot
        // be written as a JSX element name — JSX only resolves lowercase
        // tags as literal strings, never as a variable reference.
        createElement(tag, { key: index, ...attrs }),
      )}
    </svg>
  );
}
