import Link from "next/link";

import type { ChallengeSummary } from "@/application/list-public-challenges";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChallengeCard } from "@/components/ui/challenge-card";

/**
 * `/challenges`'s testable presentational half. `page.tsx` stays a thin,
 * untested server root (imports `@/lib/db` — Cloudflare context — like the
 * other route roots in this codebase); everything with behaviour lives
 * here so it can render under `renderToStaticMarkup` with no Cloudflare
 * bindings, matching `login-panel.tsx`'s split from `page.tsx`.
 *
 * challenge-discovery: Listing Scope — Active Public Challenges Only
 * (ordering is `listPublicChallenges`' responsibility, not this
 * component's — it renders whatever order it is given), Empty State,
 * No Gamification Chrome on the Browse List (no tabs, stat tiles, ranking
 * module, or participant count is rendered here or anywhere in this file).
 */
export function BrowseList({ challenges }: { challenges: ChallengeSummary[] }) {
  if (challenges.length === 0) {
    return (
      <Card padding="lg" className="mx-auto max-w-md text-center">
        <p className="text-body text-text-secondary">No challenges are running right now.</p>
        <Link href="/challenges/new" className={cta()}>
          Create a challenge
        </Link>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {challenges.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          href={`/challenges/${challenge.id}`}
          title={challenge.title}
          state={challenge.state}
          ruleText={challenge.ruleText}
          endsAt={challenge.endsAt}
        />
      ))}
    </ul>
  );
}

/**
 * The empty state's CTA must be a link (its target is a route, not a form
 * submission) but styled like `Button`'s primary variant — `buttonClassName`
 * (an additive export on the S1 `Button` primitive, see button.tsx) reuses
 * `Button`'s own class maps so the two can never render inconsistent
 * styling. Nesting a `<button>` inside this `<a>` would be invalid HTML and
 * two competing interactive elements, so `Button` itself is never rendered
 * here.
 */
function cta(): string {
  return buttonClassName({ variant: "primary", size: "md", className: "mt-4" });
}
