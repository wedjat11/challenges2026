import Link from "next/link";

import { AuthStatus } from "@/components/auth-status";

/**
 * Present on every route (design-system: Header Navigation). Exactly three
 * destinations — Challenges, Create, Account — plus <AuthStatus />. No
 * `BottomNav` (A10): three items do not need one.
 *
 * Server component, no `"use client"` (D8): every element here is a link or
 * plain markup, so it inherits the client boundary of whoever it renders
 * (`AuthStatus` signs in/out with zero client JS of its own).
 *
 * Below `sm:` the three nav links collapse to icon-only buttons so the
 * header fits the 390px mobile-first contract without wrapping; labels
 * reappear from `sm:` up. The glyphs below are small inline placeholders —
 * S1 (`src/components/icons/`) introduces the vendored, licensed Lucide
 * `Icon`/`IconButton` primitives this header is designed to adopt; wiring
 * them in is out of S0's scope (S0 has no dependency on S1's components).
 */

const NAV_ITEMS = [
  { href: "/challenges", label: "Challenges", glyph: <GridGlyph /> },
  { href: "/challenges/new", label: "Create", glyph: <PlusGlyph /> },
  { href: "/account", label: "Account", glyph: <UserGlyph /> },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border-hairline bg-bg-canvas/88 backdrop-blur-[20px]">
      <div className="mx-auto flex h-14 w-full max-w-container-max items-center justify-between gap-2 px-5 lg:px-10">
        <Link
          href="/"
          className="shrink-0 font-display text-title-3 font-semibold tracking-title text-text-primary"
        >
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
              <span className="sm:hidden" aria-hidden="true">
                {item.glyph}
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

function GridGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function UserGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}
