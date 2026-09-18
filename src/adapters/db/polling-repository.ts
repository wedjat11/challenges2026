import { and, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";

import type { ChallengeDb } from "@/adapters/db/challenge-repository";
import * as schema from "@/db/schema";
import { parseMatchSummary, serialiseMatchSummary } from "@/domain/match-codec";
import type { MatchSummary } from "@/domain/match";
import type { PollState, PollTarget, PollingRepository } from "@/domain/ports/polling-repository";
import { PLATFORMS, isPlatform } from "@/domain/riot-id";

/** `poll_state` and `match_cache` only ever hold "lol" rows in v1 — see schema.ts. */
const GAME = "lol";

export function createPollingRepository(db: ChallengeDb): PollingRepository {
  return {
    async listDue(now: Date, limit: number): Promise<PollTarget[]> {
      const rows = await db
        .select({
          puuid: schema.riotAccounts.puuid,
          riotAccountId: schema.riotAccounts.id,
          platform: schema.riotAccounts.platform,
        })
        .from(schema.participants)
        .innerJoin(
          schema.challenges,
          eq(schema.participants.challengeId, schema.challenges.id),
        )
        .innerJoin(
          schema.riotAccounts,
          eq(schema.participants.riotAccountId, schema.riotAccounts.id),
        )
        .leftJoin(
          schema.pollState,
          and(
            eq(schema.pollState.puuid, schema.riotAccounts.puuid),
            eq(schema.pollState.game, GAME),
          ),
        )
        .where(
          and(
            lte(schema.challenges.startsAt, now),
            gte(schema.challenges.endsAt, now),
            or(isNull(schema.pollState.nextPollAfter), lte(schema.pollState.nextPollAfter, now)),
            // A row with an unrecognised platform is corrupt data, not a
            // player to poll — excluding it here means it is simply never
            // due, instead of poisoning the whole batch with a throw (see
            // the isPlatform check below, which is now unreachable from this
            // query and stays only as a defence against corruption from
            // elsewhere).
            inArray(schema.riotAccounts.platform, PLATFORMS),
          ),
        )
        // A player active in two challenges at once must only be enqueued once.
        .groupBy(schema.riotAccounts.puuid, schema.riotAccounts.id, schema.riotAccounts.platform)
        // SQLite sorts NULL before every other value in ascending order, which
        // is exactly "never polled" ranking at least as due as an expired lease.
        .orderBy(schema.pollState.nextPollAfter)
        .limit(limit);

      return rows.map((row) => {
        // The WHERE clause above already excludes any row whose platform is
        // not in PLATFORMS, so this can no longer trigger from this query —
        // it stays as a defence against corruption reaching this far in some
        // other way, since `row.platform` is still a plain string as far as
        // the type checker is concerned.
        if (!isPlatform(row.platform)) {
          throw new Error(
            `riot_accounts row for puuid ${row.puuid} has an unrecognised platform: "${row.platform}"`,
          );
        }
        return { puuid: row.puuid, riotAccountId: row.riotAccountId, platform: row.platform };
      });
    },

    async getState(puuid: string): Promise<PollState | null> {
      const [row] = await db
        .select()
        .from(schema.pollState)
        .where(and(eq(schema.pollState.puuid, puuid), eq(schema.pollState.game, GAME)))
        .limit(1);

      if (!row) return null;

      return {
        puuid: row.puuid,
        lastMatchId: row.lastMatchId,
        lastPolledAt: row.lastPolledAt,
        nextPollAfter: row.nextPollAfter,
        failureCount: row.failureCount,
        coveredFrom: row.coveredFrom,
      };
    },

    async saveState(state: PollState): Promise<void> {
      await db
        .insert(schema.pollState)
        .values({
          puuid: state.puuid,
          game: GAME,
          lastMatchId: state.lastMatchId,
          lastPolledAt: state.lastPolledAt,
          nextPollAfter: state.nextPollAfter,
          failureCount: state.failureCount,
          coveredFrom: state.coveredFrom,
        })
        .onConflictDoUpdate({
          target: [schema.pollState.puuid, schema.pollState.game],
          set: {
            lastMatchId: sql`excluded.last_match_id`,
            lastPolledAt: sql`excluded.last_polled_at`,
            nextPollAfter: sql`excluded.next_poll_after`,
            failureCount: sql`excluded.failure_count`,
            coveredFrom: sql`excluded.covered_from`,
          },
        });
    },

    async cacheMatches(matches: MatchSummary[]): Promise<void> {
      if (matches.length === 0) return;

      await db
        .insert(schema.matchCache)
        .values(
          matches.map((match) => ({
            matchId: match.matchId,
            puuid: match.puuid,
            game: match.game,
            playedAt: match.playedAt,
            summaryJson: serialiseMatchSummary(match),
          })),
        )
        .onConflictDoUpdate({
          target: [schema.matchCache.matchId, schema.matchCache.puuid],
          set: {
            game: sql`excluded.game`,
            playedAt: sql`excluded.played_at`,
            summaryJson: sql`excluded.summary_json`,
          },
        });
    },

    async listCached(puuid: string, from: Date, to: Date): Promise<MatchSummary[]> {
      const rows = await db
        .select()
        .from(schema.matchCache)
        .where(
          and(
            eq(schema.matchCache.puuid, puuid),
            gte(schema.matchCache.playedAt, from),
            lte(schema.matchCache.playedAt, to),
          ),
        )
        .orderBy(schema.matchCache.playedAt);

      // Validated, not trusted: summary_json is a text column and could hold
      // anything, the same reasoning as rules_json in challenge-repository.ts.
      return rows.map((row) => parseMatchSummary(row.summaryJson));
    },
  };
}
