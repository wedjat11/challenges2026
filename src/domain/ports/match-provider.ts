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
   */
  listMatchIds(puuid: string, options?: { count?: number; startTime?: Date }): Promise<string[]>;

  /** One match, reduced to the facts a challenge rule can ask about. */
  fetchMatch(matchId: string, puuid: string): Promise<MatchSummary>;
};
