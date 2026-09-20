import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * design-system: UI Primitives and Their States, No Gamification or Social
 * Surface. Reduced from the design export (D10) — `{ name, meta?, right? }`
 * only, no tier/rank/record/avatar/online props.
 *
 * **Deviation from design.md's exact signature**: an additive `divider`
 * prop (default `true`) was added so a caller can set it `false` on the
 * last row in a list. The design's own prose ("rows separated by
 * border-divider, none on the last") assumes the CSS `:last-child`
 * selector, which is invisible in `renderToStaticMarkup` output — every
 * row would carry an identical class string regardless of position, so a
 * RED→GREEN test could never prove the behaviour without a real browser
 * layout. Rendering an actual `<hr>` only when `divider` is true makes the
 * "none on the last" behaviour a structural, testable fact instead — same
 * precedent as `Card`'s `as` prop and `Button`'s `buttonClassName` export,
 * both additive beyond the design's original table.
 */

export type PlayerRowProps = {
  name: string;
  meta?: ReactNode;
  right?: ReactNode;
  /** Renders a divider below this row. Set `false` for the last row in a list. */
  divider?: boolean;
  className?: string;
};

export function PlayerRow({ name, meta, right, divider = true, className }: PlayerRowProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between gap-4 py-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-body font-medium text-text-primary">{name}</p>
          {meta ? <div className="text-body-sm text-text-secondary">{meta}</div> : null}
        </div>
        {right ? <div className="shrink-0 text-right">{right}</div> : null}
      </div>
      {divider ? <hr aria-hidden="true" className="border-t border-divider" /> : null}
    </div>
  );
}
