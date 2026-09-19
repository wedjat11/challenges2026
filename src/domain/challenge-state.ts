import type { ChallengeWindow } from "@/domain/progress";

/** A challenge's computed lifecycle state, derived from its window and the clock — never stored. */
export type ChallengeState = "upcoming" | "live" | "ended";

/**
 * Derives a challenge's display state from `now` against its window, with
 * both bounds inclusive: `startsAt <= now <= endsAt` is "live". Shared by
 * `getChallengeView` and `listPublicChallenges` — both need the identical
 * rule, and `evaluate` in `progress.ts` already established the convention
 * that a window-vs-clock pure function belongs in `src/domain`, not in an
 * application-layer use case, so a third consumer only has to import it, not
 * re-derive it.
 */
export function deriveChallengeState(window: ChallengeWindow, now: Date): ChallengeState {
  if (now.getTime() < window.startsAt.getTime()) return "upcoming";
  if (now.getTime() > window.endsAt.getTime()) return "ended";
  return "live";
}
