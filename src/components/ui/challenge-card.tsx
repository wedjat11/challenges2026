import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ChallengeState } from "@/domain/challenge-state";

/**
 * design-system: UI Primitives and Their States, No Gamification or Social
 * Surface. Reduced from the design export's coin/tier/stake props (D10) —
 * `{ href, title, state, ruleText, endsAt }` only. No participant count
 * either (D15's `ChallengeSummary` carries none for this card to render).
 *
 * The whole card is one `next/link`: `Card as="li"` provides the list
 * semantics and `accentEdge`/`interactive` styling with zero JS, and the
 * single `<Link>` inside is the only interactive/anchor element in the
 * card, matching the design's "whole card is a next/link" note and the
 * "no nested interactive element besides the anchor" constraint.
 */

const STATE_BADGE: Record<ChallengeState, { label: string; tone: "pending" | "live" | "neutral" }> = {
  upcoming: { label: "Upcoming", tone: "pending" },
  live: { label: "Live", tone: "live" },
  ended: { label: "Ended", tone: "neutral" },
};

/**
 * Fixed locale + `timeZone: "UTC"` so the rendered text is identical on
 * every server/CI machine regardless of local timezone or OS locale, and
 * so a static-render test can assert an exact string rather than a
 * wall-clock-dependent relative phrase ("in 3 days").
 */
const END_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export type ChallengeCardProps = {
  href: string;
  title: string;
  state: ChallengeState;
  ruleText: string[];
  endsAt: Date;
};

export function ChallengeCard({ href, title, state, ruleText, endsAt }: ChallengeCardProps) {
  const badge = STATE_BADGE[state];

  return (
    <Card as="li" padding="none" interactive accentEdge={state === "live"}>
      <Link href={href} className="block p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-title-3 text-text-primary">{title}</h3>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          {ruleText.map((sentence, index) => (
            <p key={index} className="text-body-sm text-text-secondary">
              {sentence}
            </p>
          ))}
        </div>

        <p className="mt-3 text-caption text-text-muted">
          Ends{" "}
          <time dateTime={endsAt.toISOString()}>{END_TIME_FORMAT.format(endsAt)}</time>
        </p>
      </Link>
    </Card>
  );
}
