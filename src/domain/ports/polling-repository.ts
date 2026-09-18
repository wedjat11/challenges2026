import type { MatchSummary } from "@/domain/match";
import type { Platform } from "@/domain/riot-id";

/** A tracked player, as the poller needs to see them. */
export type PollTarget = { puuid: string; riotAccountId: string; platform: Platform };

/** Where polling got to for one player. See `poll_state` in schema.ts. */
export type PollState = {
  puuid: string;
  lastMatchId: string | null;
  lastPolledAt: Date | null;
  nextPollAfter: Date | null;
  failureCount: number;
  /**
   * The earliest match `startTime` this player's history has been fetched
   * from, or `null` if nothing has ever been fetched. See `needsBackfill` in
   * domain/polling.ts.
   */
  coveredFrom: Date | null;
};

/**
 * What the polling pipeline needs from storage, in the domain's terms.
 *
 * Split from `ChallengeRepository` on purpose: this port only knows about
 * players and match data, never about challenge rules or progress, which
 * keeps `pollPlayer` free to depend on both ports for what each actually
 * owns instead of one repository doing everything.
 */
export type PollingRepository = {
  /**
   * Players who participate in a challenge active at `now` and whose poll
   * state is missing or due (`next_poll_after` null or <= now). Ordered by
   * `next_poll_after` ascending, nulls first — nobody polled yet is at least
   * as due as anybody whose lease already expired. Limited to `limit` rows so
   * one cron tick can bound how much of the day's Queue budget it spends.
   */
  listDue(now: Date, limit: number): Promise<PollTarget[]>;

  getState(puuid: string): Promise<PollState | null>;

  /** Upsert by `(puuid, game)`; `game` is always `"lol"` in v1. */
  saveState(state: PollState): Promise<void>;

  /** Upsert by `(matchId, puuid)` — a repeated match summary replaces, not duplicates. */
  cacheMatches(matches: MatchSummary[]): Promise<void>;

  /** Cached matches for a player with `playedAt` in `[from, to]`, oldest first. */
  listCached(puuid: string, from: Date, to: Date): Promise<MatchSummary[]>;
};
