import type { MatchSummary } from "@/domain/match";

/**
 * Builds a LoL match for tests. Defaults describe an ordinary won ranked solo
 * game; each spec overrides only the fields it is actually about.
 */
export function aMatch(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    game: "lol",
    matchId: "LA1_1234567890",
    puuid: "test-puuid",
    champion: "Lee Sin",
    role: "jungle",
    queue: "ranked-solo",
    win: true,
    durationSeconds: 1800,
    playedAt: new Date("2026-09-16T12:00:00Z"),
    ...overrides,
  };
}
