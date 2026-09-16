/**
 * Games this app can track.
 *
 * Only League of Legends in v1. Teamfight Tactics is deferred, not cancelled,
 * so the discriminant exists from the start: adding TFT later means widening
 * this tuple and adding a `MatchSummary` variant, not revisiting every consumer
 * of match data.
 */
export const SUPPORTED_GAMES = ["lol"] as const;

export type Game = (typeof SUPPORTED_GAMES)[number];

export function isSupportedGame(value: string): value is Game {
  return (SUPPORTED_GAMES as readonly string[]).includes(value);
}
