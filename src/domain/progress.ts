import type { MatchSummary } from "@/domain/match";
import type { Rule } from "@/domain/rule";
import { qualifies } from "@/domain/rule";

/**
 * Games ending before this are remakes or early surrenders, not played games.
 *
 * Counting them would make "play 20 games" farmable by remaking twenty times,
 * so a challenge tracker has to draw the line somewhere. LoL allows a remake at
 * three minutes; five gives that a margin.
 */
export const MINIMUM_COUNTED_DURATION_SECONDS = 300;

/** The period during which a match counts towards a challenge. Both ends inclusive. */
export type ChallengeWindow = {
  startsAt: Date;
  endsAt: Date;
};

export type RuleProgress = {
  /** Qualifying matches found. Not clamped: overshooting the target is real information. */
  current: number;
  target: number;
  completed: boolean;
};

export type ChallengeProgress = {
  rules: RuleProgress[];
  /** True when every rule is complete. A challenge with no rules is trivially complete. */
  completed: boolean;
};

function withinWindow(match: MatchSummary, window: ChallengeWindow): boolean {
  const playedAt = match.playedAt.getTime();
  return playedAt >= window.startsAt.getTime() && playedAt <= window.endsAt.getTime();
}

function isCountable(match: MatchSummary, window: ChallengeWindow): boolean {
  return (
    match.durationSeconds >= MINIMUM_COUNTED_DURATION_SECONDS && withinWindow(match, window)
  );
}

/**
 * Deduplicates by match id. The match cache is shared across overlapping
 * challenges, so the same match can arrive twice; counting it twice would
 * complete a challenge early.
 */
function countableMatches(matches: MatchSummary[], window: ChallengeWindow): MatchSummary[] {
  const seen = new Map<string, MatchSummary>();
  for (const match of matches) {
    if (isCountable(match, window) && !seen.has(match.matchId)) {
      seen.set(match.matchId, match);
    }
  }
  return [...seen.values()];
}

/**
 * Works out how far a set of rules has progressed over a player's matches.
 *
 * Pure: no clock, no network, no storage. Every input that affects the answer is
 * an argument, which is what makes the interesting half of this app testable
 * while the Riot production key application is still pending.
 */
export function evaluate(
  rules: Rule[],
  matches: MatchSummary[],
  window: ChallengeWindow,
): ChallengeProgress {
  const countable = countableMatches(matches, window);

  const ruleProgress = rules.map((rule): RuleProgress => {
    const current = countable.filter((match) => qualifies(rule, match)).length;
    return { current, target: rule.target, completed: current >= rule.target };
  });

  return {
    rules: ruleProgress,
    completed: ruleProgress.every((progress) => progress.completed),
  };
}
