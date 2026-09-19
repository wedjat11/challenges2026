import type { ChallengeRepository } from "@/domain/ports/challenge-repository";
import type { RiotAccountRepository } from "@/domain/ports/riot-account-repository";

export type JoinChallengeInput = {
  userId: string;
  challengeId: string;
  riotAccountId: string;
};

export type JoinChallengeResult =
  | { kind: "joined" }
  | { kind: "already_joined" }
  | { kind: "challenge_not_found" }
  | { kind: "challenge_ended" }
  | { kind: "riot_account_not_owned" };

/**
 * Joins a signed-in user's Riot account to a challenge.
 *
 * The `already_joined` pre-check exists only to *report* the outcome
 * accurately; correctness against a race between two concurrent join
 * attempts is the adapter's `join`, which relies on `onConflictDoNothing` —
 * a race reports `joined` twice and still stores exactly one row, which is
 * the only part of the spec a race can affect.
 */
export function joinChallenge(deps: {
  challenges: ChallengeRepository;
  riotAccounts: RiotAccountRepository;
  now: () => Date;
}): (input: JoinChallengeInput) => Promise<JoinChallengeResult> {
  return async (input: JoinChallengeInput): Promise<JoinChallengeResult> => {
    const challenge = await deps.challenges.findById(input.challengeId);
    if (!challenge) return { kind: "challenge_not_found" };

    // Upcoming and live are both allowed; only a challenge whose window has
    // already ended refuses a join.
    if (deps.now().getTime() > challenge.endsAt.getTime()) {
      return { kind: "challenge_ended" };
    }

    const account = await deps.riotAccounts.findById(input.riotAccountId);
    if (!account || account.userId !== input.userId) {
      return { kind: "riot_account_not_owned" };
    }

    const participants = await deps.challenges.listParticipants(input.challengeId);
    if (participants.includes(input.riotAccountId)) {
      return { kind: "already_joined" };
    }

    await deps.challenges.join(input.challengeId, input.riotAccountId);
    return { kind: "joined" };
  };
}
