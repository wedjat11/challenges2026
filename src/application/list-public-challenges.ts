import { deriveChallengeState, type ChallengeState } from "@/domain/challenge-state";
import type { ChallengeRepository } from "@/domain/ports/challenge-repository";
import { rulesToSentences } from "@/domain/rule-text";

export type ChallengeSummary = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  state: ChallengeState;
  ruleText: string[];
};

/** `/challenges` shows at most this many summaries when the caller passes no explicit limit. */
export const DEFAULT_PUBLIC_LIMIT = 50;

/**
 * Lists active public challenges for the browse page.
 *
 * Returns a plain array, not a `{ kind }` union: the house rule is typed
 * results for *outcomes*, and this query has exactly one — an empty result
 * is a normal, non-exceptional answer (no participant count is included
 * either, per D15). Every listed challenge is `live` by construction
 * (`listPublic` already filters to the active window), but `state` is
 * still computed via the shared `deriveChallengeState` so `ChallengeCard`
 * renders through one code path in every context, including `getChallengeView`.
 */
export function listPublicChallenges(deps: {
  challenges: ChallengeRepository;
  now: () => Date;
}): (limit?: number) => Promise<ChallengeSummary[]> {
  return async (limit: number = DEFAULT_PUBLIC_LIMIT): Promise<ChallengeSummary[]> => {
    const now = deps.now();
    const challenges = await deps.challenges.listPublic(now, limit);

    return challenges.map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      startsAt: challenge.startsAt,
      endsAt: challenge.endsAt,
      state: deriveChallengeState(challenge, now),
      ruleText: rulesToSentences(challenge.rules),
    }));
  };
}
