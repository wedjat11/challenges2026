import Link from "next/link";

import { RIOT_DISCLAIMER } from "@/lib/legal";

/**
 * Carries the Riot disclaimer, which their developer policy requires to be
 * visible on the product, plus the legal links their production key review
 * looks for. Rendered on every page from the root layout.
 *
 * Restyled in S6 onto the same `max-w-container-max` container as
 * `SiteHeader`, with `border-divider` (design.md §5) — the header uses
 * `border-border-hairline` for its own bottom edge, but the footer's rule
 * is the design's `border-divider` token instead.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-divider">
      <div className="mx-auto flex w-full max-w-container-max flex-col gap-4 px-5 py-8 text-body-sm lg:px-10">
        <nav className="flex gap-6">
          <Link className="underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="underline underline-offset-4" href="/privacy">
            Privacy Policy
          </Link>
        </nav>
        <p className="text-caption leading-relaxed text-text-muted">{RIOT_DISCLAIMER}</p>
      </div>
    </footer>
  );
}
