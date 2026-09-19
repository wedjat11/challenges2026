import { safeParseRules } from "@/domain/rule-codec";
import type { ChallengeRepository } from "@/domain/ports/challenge-repository";
import type { RiotAccountRepository } from "@/domain/ports/riot-account-repository";

const MAX_RULES = 5;
const MAX_CRITERIA_PER_RULE = 4;

export type CreateChallengeInput = {
  ownerId: string;
  title: string;
  /** Raw `<input type="datetime-local">` value. */
  startsAt: string;
  endsAt: string;
  /** Raw form value, validated against the closed `public | unlisted` set below. */
  visibility: string;
  /** The one hidden field carrying the builder's draft (see design D13). */
  rulesJson: string;
  joinAsRiotAccountId: string | null;
};

export type CreateChallengeResult =
  | { kind: "created"; id: string }
  | { kind: "invalid_title" }
  | { kind: "invalid_window"; reason: "unparseable" | "end_not_after_start" }
  | { kind: "invalid_visibility" }
  | { kind: "invalid_rules"; ruleIndex: number | null; field: string | null }
  | { kind: "too_many_rules"; limit: 5 }
  | { kind: "too_many_criteria"; ruleIndex: number; limit: 4 }
  | { kind: "riot_account_not_owned" };

/**
 * Creates a challenge, validating cheapest and most user-visible checks
 * first, storage last. `newId` is injected (the composition root defaults it
 * to `crypto.randomUUID`) so a test can assert the stored id, the same reason
 * `linkRiotAccount` injects `matchProviderFor`.
 *
 * Create-then-join is **not** transactional across `ChallengeRepository`: if
 * `join` were to reject after `create` succeeded, the challenge would exist
 * with zero participants. The poller already tolerates that (it iterates
 * participants), and the creator can join from the challenge page afterward —
 * so this is documented rather than papered over with a compensating delete.
 */
export function createChallenge(deps: {
  challenges: ChallengeRepository;
  riotAccounts: RiotAccountRepository;
  newId: () => string;
}): (input: CreateChallengeInput) => Promise<CreateChallengeResult> {
  return async (input: CreateChallengeInput): Promise<CreateChallengeResult> => {
    const title = input.title.trim();
    if (title.length === 0) return { kind: "invalid_title" };

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return { kind: "invalid_window", reason: "unparseable" };
    }
    if (!(endsAt.getTime() > startsAt.getTime())) {
      return { kind: "invalid_window", reason: "end_not_after_start" };
    }

    if (input.visibility !== "public" && input.visibility !== "unlisted") {
      return { kind: "invalid_visibility" };
    }
    const visibility = input.visibility;

    const parsed = safeParseRules(input.rulesJson);
    if (!parsed.ok) {
      return { kind: "invalid_rules", ruleIndex: parsed.ruleIndex, field: parsed.field };
    }
    const { rules } = parsed;

    // Re-checked server-side even though the builder enforces these caps: a
    // Server Function is reachable by direct POST, and rule-codec.ts places
    // no upper bound on rule or criteria count.
    if (rules.length > MAX_RULES) return { kind: "too_many_rules", limit: MAX_RULES };
    const overCriteria = rules.findIndex((rule) => rule.criteria.length > MAX_CRITERIA_PER_RULE);
    if (overCriteria !== -1) {
      return { kind: "too_many_criteria", ruleIndex: overCriteria, limit: MAX_CRITERIA_PER_RULE };
    }

    if (input.joinAsRiotAccountId !== null) {
      const account = await deps.riotAccounts.findById(input.joinAsRiotAccountId);
      if (!account || account.userId !== input.ownerId) {
        return { kind: "riot_account_not_owned" };
      }
    }

    const id = deps.newId();
    await deps.challenges.create({
      id,
      ownerId: input.ownerId,
      title,
      rules,
      startsAt,
      endsAt,
      visibility,
    });

    if (input.joinAsRiotAccountId !== null) {
      await deps.challenges.join(id, input.joinAsRiotAccountId);
    }

    return { kind: "created", id };
  };
}
