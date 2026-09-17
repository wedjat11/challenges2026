import Link from "next/link";

import { RIOT_DISCLAIMER } from "@/lib/legal";

/**
 * Carries the Riot disclaimer, which their developer policy requires to be
 * visible on the product, plus the legal links their production key review
 * looks for. Rendered on every page from the root layout.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/10 dark:border-white/15">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-8 text-sm">
        <nav className="flex gap-6">
          <Link className="underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="underline underline-offset-4" href="/privacy">
            Privacy Policy
          </Link>
        </nav>
        <p className="text-xs leading-relaxed text-black/60 dark:text-white/60">
          {RIOT_DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}
