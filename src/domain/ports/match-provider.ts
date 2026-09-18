import type { MatchSummary } from "@/domain/match";

/**
 * The one failure a provider is allowed to surface with detail: the upstream
 * answered, and the status says why. Declared with the port, not the Riot
 * client, so application code can branch on it (404 means "no such Riot ID")
 * without importing an adapter. The message stays generic on purpose, so a
 * secret or request detail can never travel in it.
 */
export class MatchProviderError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Match provider request failed with ${status}`);
    this.name = "MatchProviderError";
    this.status = status;
  }
}

/**
 * What the application needs from a source of match data, stated in the
 * domain's own terms.
 *
 * Defined here rather than in the adapter on purpose: the domain says what it
 * needs, and Riot's client is one way to satisfy it. That is also what makes a
 * fake provider possible in tests and a TFT provider possible in v2.
 */
export type MatchProvider = {
  /** Riot ID (`gameName#tagLine`) to Riot's internal player identifier. */
  resolvePuuid(gameName: string, tagLine: string): Promise<string>;

  /**
   * Most recent match ids for a player, newest first.
   *
   * `startTime` exists so polling fetches only what is new. Re-reading a
   * player's whole history on every cycle is what exhausts the rate limit.
   * `start` is the paging offset into that same newest-first list — Riot's
   * own pagination parameter — so a caller that found more new matches than
   * fit in one page can page through the rest (see `pollPlayer`, which pages
   * up to `MAX_PAGES` times).
   *
   * `endTime` bounds the same window from the other side: `pollPlayer`'s
   * backward pass uses it (paired with `startTime`) to page only the slice
   * between the challenge's own start and however far back coverage already
   * reaches (`coveredFrom`), instead of re-walking ground already covered.
   * Omitted, as `startTime` is, when there is nothing to bound.
   */
  listMatchIds(
    puuid: string,
    options?: { count?: number; start?: number; startTime?: Date; endTime?: Date },
  ): Promise<string[]>;

  /** One match, reduced to the facts a challenge rule can ask about. */
  fetchMatch(matchId: string, puuid: string): Promise<MatchSummary>;
};
