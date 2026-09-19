import { deriveChallengeState, type ChallengeState } from "@/domain/challenge-state";
import type { ChallengeRepository } from "@/domain/ports/challenge-repository";
import type { PollingRepository } from "@/domain/ports/polling-repository";
import type { RiotAccountRepository } from "@/domain/ports/riot-account-repository";
import type { RuleProgress } from "@/domain/progress";
import { PLATFORM_LABELS } from "@/domain/riot-id";
import type { Rule } from "@/domain/rule";
import { rulesToSentences } from "@/domain/rule-text";

export type { ChallengeState };

export type ParticipantView = {
  riotAccountId: string;
  /** `"GameName#TAG"`, or `"Unknown account"` if the account row vanished after joining. */
  displayName: string;
  platformLabel: string;
  /** One entry per challenge rule, zero-filled when nothing has been evaluated yet. */
  rules: RuleProgress[];
  /** `poll_state.last_polled_at` for this account's puuid (A12) — `null` when never polled. */
  lastCheckedAt: Date | null;
};

export type ChallengeView = {
  id: string;
  ownerId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  visibility: "public" | "unlisted";
  state: ChallengeState;
  rules: Rule[];
  ruleText: string[];
  participants: ParticipantView[];
};

export type GetChallengeViewResult = { kind: "found"; view: ChallengeView } | { kind: "not_found" };

/**
 * Builds the read model for `/challenges/[id]`.
 *
 * `state` always derives from `now()` against the stored window — never from
 * a stored column, so it can never go stale between polls. Progress is
 * sourced only from stored `progress` rows (via `listProgressForChallenge`);
 * this use case never calls `evaluate`, matching the `challenge-view` spec's
 * "no computing progress from raw match data in the UI layer" requirement.
 */
export function getChallengeView(deps: {
  challenges: ChallengeRepository;
  riotAccounts: RiotAccountRepository;
  polling: PollingRepository;
  now: () => Date;
}): (challengeId: string) => Promise<GetChallengeViewResult> {
  return async (challengeId: string): Promise<GetChallengeViewResult> => {
    const challenge = await deps.challenges.findById(challengeId);
    if (!challenge) return { kind: "not_found" };

    const [participantIds, storedProgress] = await Promise.all([
      deps.challenges.listParticipants(challengeId),
      deps.challenges.listProgressForChallenge(challengeId),
    ]);

    const progressByParticipant = new Map(
      storedProgress.map((entry) => [entry.riotAccountId, entry.rules]),
    );

    const participants = await Promise.all(
      participantIds.map((riotAccountId) =>
        buildParticipantView(
          deps,
          riotAccountId,
          challenge.rules,
          progressByParticipant.get(riotAccountId),
        ),
      ),
    );

    participants.sort((a, b) =>
      a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()),
    );

    return {
      kind: "found",
      view: {
        id: challenge.id,
        ownerId: challenge.ownerId,
        title: challenge.title,
        startsAt: challenge.startsAt,
        endsAt: challenge.endsAt,
        visibility: challenge.visibility,
        state: deriveChallengeState(challenge, deps.now()),
        rules: challenge.rules,
        ruleText: rulesToSentences(challenge.rules),
        participants,
      },
    };
  };
}

async function buildParticipantView(
  deps: { riotAccounts: RiotAccountRepository; polling: PollingRepository },
  riotAccountId: string,
  rules: Rule[],
  storedRuleProgress: RuleProgress[] | undefined,
): Promise<ParticipantView> {
  const account = await deps.riotAccounts.findById(riotAccountId);

  // The Riot account row can vanish (unlink) after a challenge join. Degrade
  // to a visible placeholder rather than throwing or dropping the
  // participant: the stored progress and the join itself are still real —
  // only the identity used to label them is gone. lastCheckedAt naturally
  // stays null in this branch since there is no puuid left to poll a state
  // for.
  const displayName = account ? `${account.gameName}#${account.tagLine}` : "Unknown account";
  const platformLabel = account ? PLATFORM_LABELS[account.platform] : "Unknown";
  const pollState = account ? await deps.polling.getState(account.puuid) : null;

  const ruleProgress =
    storedRuleProgress ??
    rules.map((rule): RuleProgress => ({ current: 0, target: rule.target, completed: false }));

  return {
    riotAccountId,
    displayName,
    platformLabel,
    rules: ruleProgress,
    lastCheckedAt: pollState?.lastPolledAt ?? null,
  };
}
