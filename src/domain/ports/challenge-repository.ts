import type { ChallengeProgress, RuleProgress } from "@/domain/progress";
import type { Rule } from "@/domain/rule";

/** A challenge as the application asks for it to be stored. */
export type NewChallenge = {
  id: string;
  ownerId: string;
  title: string;
  rules: Rule[];
  startsAt: Date;
  endsAt: Date;
  visibility: "public" | "unlisted";
};

/** A challenge as it comes back, with its rules already validated. */
export type StoredChallenge = NewChallenge & {
  game: "lol";
  createdAt: Date;
};

/**
 * What the application needs from storage, in the domain's terms.
 *
 * Rules cross this boundary as `Rule[]`, never as JSON. Serialisation is the
 * adapter's problem, which is what keeps `rules_json` from leaking upward.
 */
export type ChallengeRepository = {
  create(challenge: NewChallenge): Promise<void>;
  findById(id: string): Promise<StoredChallenge | null>;

  /** Idempotent: joining twice is a no-op, not an error or a duplicate row. */
  join(challengeId: string, riotAccountId: string): Promise<void>;
  listParticipants(challengeId: string): Promise<string[]>;

  /** Replaces the stored progress for one participant across every rule. */
  saveProgress(
    challengeId: string,
    riotAccountId: string,
    progress: ChallengeProgress,
  ): Promise<void>;

  /** Empty when nothing has been evaluated yet. */
  findProgress(challengeId: string, riotAccountId: string): Promise<RuleProgress[]>;

  /** Challenges whose window contains `now`, for the poller to work through. */
  listActiveAt(now: Date): Promise<StoredChallenge[]>;

  /**
   * Challenges the given Riot account participates in, whose window contains
   * `now`. What `pollPlayer` asks to find out which rules to evaluate for one
   * player, without loading every other account's challenges to filter them
   * out in application code.
   */
  listActiveForAccount(riotAccountId: string, now: Date): Promise<StoredChallenge[]>;
};
