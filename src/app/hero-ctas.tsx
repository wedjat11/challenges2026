import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";

/**
 * Landing page's calls to action — the "Not open yet" panel is replaced by
 * real CTAs now that T12 ships create/browse/join (proposal.md's `/` screen
 * mapping). Split out from `page.tsx` so this new behaviour renders under
 * `renderToStaticMarkup`; `page.tsx` itself stays untested because it
 * renders `<AuthStatus />`, an async Server Component (`await auth()`) —
 * the same reason `SiteHeader` stays untested (see apply-progress.md's S1
 * evidence table). `buttonClassName` (not `<Button>`) because these are
 * links to routes, not form submissions — same reasoning as
 * `browse-list.tsx`'s empty-state CTA.
 */
export function HeroCtas() {
  return (
    <div className="mt-12 flex flex-col gap-3 sm:flex-row">
      <Link href="/challenges/new" className={buttonClassName({ variant: "primary", size: "lg" })}>
        Create a challenge
      </Link>
      <Link href="/challenges" className={buttonClassName({ variant: "outline", size: "lg" })}>
        Browse challenges
      </Link>
    </div>
  );
}
