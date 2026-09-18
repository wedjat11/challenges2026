import { z } from "zod";

import { QUEUES, ROLES } from "@/domain/match";
import type { MatchSummary } from "@/domain/match";

/**
 * The boundary between untrusted JSON and a `MatchSummary`.
 *
 * `match_cache.summary_json` is a text column, so what comes back is whatever
 * was written — possibly by an older or newer version of this app, or by a
 * game this app does not track yet. Validating on the way out means a
 * corrupted or unrecognised row fails loudly instead of quietly handing
 * `evaluate` a match it misreads. Mirrors `rule-codec.ts`.
 */
const matchSummarySchema = z.object({
  game: z.literal("lol"),
  matchId: z.string().min(1),
  puuid: z.string().min(1),
  champion: z.string().min(1),
  role: z.enum(ROLES),
  queue: z.enum(QUEUES),
  win: z.boolean(),
  durationSeconds: z.number().int().nonnegative(),
  // Stored as whatever JSON.stringify makes of a Date (an ISO string);
  // coerced back into one on the way out rather than left as a string, since
  // every consumer of MatchSummary expects a real Date.
  playedAt: z.coerce.date(),
});

export function parseMatchSummary(json: string): MatchSummary {
  return matchSummarySchema.parse(JSON.parse(json));
}

export function serialiseMatchSummary(match: MatchSummary): string {
  return JSON.stringify(matchSummarySchema.parse(match));
}
