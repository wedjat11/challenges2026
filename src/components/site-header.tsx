import Link from "next/link";

import { AuthStatus } from "@/components/auth-status";
import { Icon, type IconName } from "@/components/icons/icon";

/**
 * Present on every route (design-system: Header Navigation). Exactly three
 * destinations — Challenges, Create, Account — plus <AuthStatus />. No
 * `BottomNav` (A10): three items do not need one.
 *
 * Server component, no `"use client"` (D8): every element here is a link or
 * plain markup, so it inherits the client boundary of whoever it renders
 * (`AuthStatus` signs in/out with zero client JS of its own).
 *
 * Below `sm:` the three nav links collapse to icon-only 36px tap targets so
 * the header fits the 390px mobile-first contract without wrapping; labels
 * reappear from `sm:` up. S1 resolves the S0 deviation: the glyphs are now
 * the vendored, licensed `Icon` primitive (`src/components/icons/`), not
 * inline placeholder SVGs — the wordmark also gains the `swords` glyph the
 * design's icon table names for the header lockup (design.md §3).
 */

const NAV_ITEMS: readonly { href: string; label: string; icon: IconName }[] = [
  { href: "/challenges", label: "Challenges", icon: "layout-grid" },
  { href: "/challenges/new", label: "Create", icon: "plus" },
  { href: "/account", label: "Account", icon: "user" },
] as const;

export function SiteHeader() {
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

        <div className="min-w-0 shrink-0">
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
