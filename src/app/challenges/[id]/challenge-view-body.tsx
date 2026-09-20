import type { ReactNode } from "react";

import { CopyLink } from "@/app/challenges/[id]/copy-link";
import type {
  ChallengeState,
  ChallengeView,
  ParticipantView,
} from "@/application/get-challenge-view";
import { Icon } from "@/components/icons/icon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlayerRow } from "@/components/ui/player-row";
import { StatTile } from "@/components/ui/stat-tile";

/**
 * `/challenges/[id]`'s testable presentational half. `page.tsx` stays a
 * thin, untested server root (imports `@/lib/db` — Cloudflare context —
 * like the other route roots in this codebase); everything with behaviour
 * lives here so it can render under `renderToStaticMarkup` with no
 * Cloudflare bindings, matching `browse-list.tsx`'s split from `page.tsx`.
 *
 * challenge-view: Challenge Summary and Computed State, Rules Rendered in
 * Words, Every Participant's Progress from Stored Rows, Per-Participant
 * Freshness Signal, Share URL Affordance, No Gamification Rendering on the
 * View Page (no coin/tier/XP/ranking/friends/notification element anywhere
 * in this file).
 *
 * `lg:` restates the layout exactly once (design-system: Mobile-First
 * Responsive Contract) — a sticky summary column (title, state, rules,
 * share, join) beside the participants list, no intermediate breakpoint.
 */

const STATE_BADGE: Record<ChallengeState, { label: string; tone: "pending" | "live" | "neutral" }> = {
  upcoming: { label: "Upcoming", tone: "pending" },
  live: { label: "Live", tone: "live" },
  ended: { label: "Ended", tone: "neutral" },
};

/** Fixed locale + UTC, matching `challenge-card.tsx`'s `END_TIME_FORMAT` — deterministic across machines. */
const WINDOW_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export type ChallengeViewBodyProps = {
  view: ChallengeView;
  shareUrl: string;
  /** Injected so the freshness label's relative time is deterministic, never wall-clock dependent. */
  now: Date;
  /**
   * Lets S5b-ii mount the join form without reshaping this layout: the
   * summary column always reserves a "Join" section and renders whatever
   * this slot contains — nothing, until the join action/form land.
   */
  joinSlot?: ReactNode;
};

export function ChallengeViewBody({ view, shareUrl, now, joinSlot }: ChallengeViewBodyProps) {
  const badge = STATE_BADGE[view.state];

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:w-[360px] lg:shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-title-2 tracking-title text-text-primary">
            {view.title}
          </h1>
          <div className="flex items-center gap-2">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            <p className="text-body-sm text-text-secondary">
              <time dateTime={view.startsAt.toISOString()}>{WINDOW_FORMAT.format(view.startsAt)}</time>
              {" – "}
              <time dateTime={view.endsAt.toISOString()}>{WINDOW_FORMAT.format(view.endsAt)}</time>
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-body-sm font-medium text-text-secondary">Goals</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {view.ruleText.map((sentence, index) => (
              <li key={index} className="text-body text-text-primary">
                {sentence}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-body-sm font-medium text-text-secondary">Share</h2>
          <div className="mt-2">
            <CopyLink url={shareUrl} />
          </div>
        </div>

        <div>
          <h2 className="text-body-sm font-medium text-text-secondary">Join</h2>
          <div className="mt-2">{joinSlot}</div>
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-body-sm font-medium text-text-secondary">Participants</h2>
        {view.participants.length === 0 ? (
          <Card padding="md" className="mt-3">
            <p className="text-body-sm text-text-secondary">No one has joined yet.</p>
          </Card>
        ) : (
          <ul className="mt-3 flex flex-col">
            {view.participants.map((participant, index) => (
              <li key={participant.riotAccountId}>
                <ParticipantRow
                  participant={participant}
                  ruleText={view.ruleText}
                  now={now}
                  divider={index < view.participants.length - 1}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ParticipantRow({
  participant,
  ruleText,
  now,
  divider,
}: {
  participant: ParticipantView;
  ruleText: string[];
  now: Date;
  divider: boolean;
}) {
  return (
    <PlayerRow
      name={participant.displayName}
      divider={divider}
      meta={
        <span className="flex flex-col gap-0.5">
          <span>{participant.platformLabel}</span>
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={14} />
            {freshnessLabel(participant.lastCheckedAt, now)}
          </span>
        </span>
      }
      right={
        <div className="flex flex-col items-end gap-2">
          {participant.rules.map((progress, index) => (
            <StatTile
              key={index}
              label={ruleText[index] ?? `Rule ${index + 1}`}
              value={`${progress.current} / ${progress.target}`}
            />
          ))}
        </div>
      }
    />
  );
}

/**
 * challenge-view: Per-Participant Freshness Signal. Exact copy: "account
 * last checked" when the Riot account has a poll state, "not checked yet"
 * when it does not — never a blank field or an error. The relative time is
 * derived only from the injected `now` and `lastCheckedAt`, so it is
 * deterministic and testable, never `Date.now()`.
 */
function freshnessLabel(lastCheckedAt: Date | null, now: Date): string {
  if (!lastCheckedAt) return "not checked yet";
  return `account last checked ${formatRelative(lastCheckedAt, now)}`;
}

function formatRelative(past: Date, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - past.getTime()) / 60_000));

  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.round(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.round(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}
