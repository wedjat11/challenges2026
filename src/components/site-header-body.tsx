import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClassName } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/icons/icon";

/**
 * Presentational half of the header (design-system: Header Navigation;
 * public landing and session-gated navigation). `site-header.tsx` stays a
 * thin async root that awaits `auth()` and passes the result down, because
 * `@/auth` cannot be imported under Vitest — every branch with real
 * behaviour lives here instead, where it is testable via
 * `renderToStaticMarkup`.
 *
 * Signed out: only the wordmark and a single "Log in" control — no `nav`,
 * no app routes. Signed in: the three navigation links (Challenges, Create,
 * Account) plus the caller-supplied `authSlot` (`<AuthStatus />`), unchanged
 * from the previous always-on header.
 *
 * Below `sm:` the three nav links collapse to icon-only 36px tap targets so
 * the header fits the 390px mobile-first contract without wrapping; labels
 * reappear from `sm:` up.
 */

const NAV_ITEMS: readonly { href: string; label: string; icon: IconName }[] = [
  { href: "/challenges", label: "Challenges", icon: "layout-grid" },
  { href: "/challenges/new", label: "Create", icon: "plus" },
  { href: "/account", label: "Account", icon: "user" },
] as const;

export function SiteHeaderBody({
  signedIn,
  authSlot,
}: {
  signedIn: boolean;
  authSlot: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border-hairline bg-bg-canvas/88 backdrop-blur-[20px]">
      <div className="mx-auto flex h-14 w-full max-w-container-max items-center justify-between gap-2 px-5 lg:px-10">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-title-3 font-semibold tracking-title text-text-primary"
        >
          <Icon name="swords" size={20} />
          <span className="sm:hidden">BAL</span>
          <span className="hidden sm:inline">BECOME A LEGEND</span>
        </Link>

        {signedIn ? (
          <nav
            aria-label="Primary"
            className="flex shrink-0 items-center gap-1 sm:gap-4"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="flex h-9 w-9 items-center justify-center rounded-control text-text-muted transition-colors hover:text-text-primary sm:h-auto sm:w-auto sm:px-2 sm:py-1 sm:text-body-sm sm:font-medium"
              >
                <span className="sm:hidden">
                  <Icon name={item.icon} />
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="min-w-0 shrink-0">
          {signedIn ? (
            authSlot
          ) : (
            <Link href="/login" className={buttonClassName({ variant: "outline", size: "sm" })}>
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
