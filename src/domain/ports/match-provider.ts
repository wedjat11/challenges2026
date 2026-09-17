import type { MatchSummary } from "@/domain/match";

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
