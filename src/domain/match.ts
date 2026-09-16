/**
 * The position a player held in a League of Legends match.
 *
 * `unknown` is a real value, not a failure: Riot reports an empty position for
 * remakes and for modes that do not assign roles, and a challenge counting
 * "games played" should still see those matches.
 */
export const ROLES = ["top", "jungle", "middle", "bottom", "support", "unknown"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/**
 * The queues challenges distinguish between.
 *
 * Deliberately smaller than Riot's queue list: `other` absorbs rotating game
 * modes and everything a challenge has no reason to name. Widen this only when
 * a rule actually needs the distinction.
 */
export const QUEUES = [
  "ranked-solo",
  "ranked-flex",
  "normal-draft",
  "normal-blind",
  "aram",
  "other",
] as const;

export type Queue = (typeof QUEUES)[number];

export function isQueue(value: string): value is Queue {
  return (QUEUES as readonly string[]).includes(value);
}

/**
 * One finished League of Legends match, seen from one tracked player's side,
 * reduced to the facts a challenge rule can ask about.
 *
 * This is a domain type: nothing here mirrors Riot's response shape. The
 * adapter in T6 is responsible for the translation, which is what keeps rule
 * logic stable when Riot changes a field name.
 */
export type LolMatchSummary = {
  game: "lol";
  matchId: string;
  /** The tracked player this summary describes, not the whole lobby. */
  puuid: string;
  champion: string;
  role: Role;
  queue: Queue;
  win: boolean;
  durationSeconds: number;
  playedAt: Date;
};

/**
 * Widens to `LolMatchSummary | TftMatchSummary` when TFT lands in v2. Consumers
 * that already narrow on `game` keep working.
 */
export type MatchSummary = LolMatchSummary;
