import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

import * as schema from "@/db/schema";
import { parseRules, serialiseRules } from "@/domain/rule-codec";
import type {
  ChallengeRepository,
  NewChallenge,
  StoredChallenge,
} from "@/domain/ports/challenge-repository";
import type { ChallengeProgress, RuleProgress } from "@/domain/progress";

/**
 * Any async SQLite database Drizzle can drive against this schema.
 *
 * Typed by what this adapter uses rather than pinned to `DrizzleD1Database`,
 * so the same code runs against D1 in production and against SQLite in memory
 * under test. Pinning would have forced the tests to cast, and a cast in a test
 * is a lie about what the code accepts.
 */
export type ChallengeDb = BaseSQLiteDatabase<"async", unknown, typeof schema>;

type ChallengeRow = typeof schema.challenges.$inferSelect;

function toStoredChallenge(row: ChallengeRow): StoredChallenge {
  return {
    id: row.id,
    ownerId: row.ownerId,
    game: "lol",
    title: row.title,
    // Validated, not trusted: the column is text and could hold anything.
    rules: parseRules(row.rulesJson),
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    visibility: row.visibility,
    createdAt: row.createdAt,
  };
}

export function createChallengeRepository(db: ChallengeDb): ChallengeRepository {
  return {
    async create(challenge: NewChallenge): Promise<void> {
      await db.insert(schema.challenges).values({
        id: challenge.id,
        ownerId: challenge.ownerId,
        title: challenge.title,
        rulesJson: serialiseRules(challenge.rules),
        startsAt: challenge.startsAt,
        endsAt: challenge.endsAt,
        visibility: challenge.visibility,
      });
    },

    async findById(id: string): Promise<StoredChallenge | null> {
      const [row] = await db
        .select()
        .from(schema.challenges)
        .where(eq(schema.challenges.id, id))
        .limit(1);

      return row ? toStoredChallenge(row) : null;
    },

    async join(challengeId: string, riotAccountId: string): Promise<void> {
      // Joining twice is a double-clicked button, not an error worth surfacing.
      await db
        .insert(schema.participants)
        .values({ challengeId, riotAccountId })
        .onConflictDoNothing();
    },

    async listParticipants(challengeId: string): Promise<string[]> {
      const rows = await db
        .select({ riotAccountId: schema.participants.riotAccountId })
        .from(schema.participants)
        .where(eq(schema.participants.challengeId, challengeId));

      return rows.map((row) => row.riotAccountId);
    },

    async saveProgress(
      challengeId: string,
      riotAccountId: string,
      progress: ChallengeProgress,
    ): Promise<void> {
      if (progress.rules.length === 0) return;

      // Every poll re-evaluates from scratch, so this overwrites rather than
      // accumulating. Upserting on the composite key keeps one row per rule.
      await db
        .insert(schema.progress)
        .values(
          progress.rules.map((rule, ruleIndex) => ({
            challengeId,
            riotAccountId,
            ruleIndex,
            current: rule.current,
            target: rule.target,
            completedAt: rule.completed ? new Date() : null,
          })),
        )
        .onConflictDoUpdate({
          target: [
            schema.progress.challengeId,
            schema.progress.riotAccountId,
            schema.progress.ruleIndex,
          ],
          set: {
            current: sql`excluded.current`,
            target: sql`excluded.target`,
            completedAt: sql`excluded.completed_at`,
            updatedAt: sql`(unixepoch() * 1000)`,
          },
        });
    },

    async findProgress(challengeId: string, riotAccountId: string): Promise<RuleProgress[]> {
      const rows = await db
        .select()
        .from(schema.progress)
        .where(
          and(
            eq(schema.progress.challengeId, challengeId),
            eq(schema.progress.riotAccountId, riotAccountId),
          ),
        )
        .orderBy(schema.progress.ruleIndex);

      return rows.map((row) => ({
        current: row.current,
        target: row.target,
        completed: row.completedAt !== null,
      }));
    },

    async listActiveAt(now: Date): Promise<StoredChallenge[]> {
      // Both bounds inclusive, matching evaluate(). If storage disagreed, a
      // challenge would stop being polled on the day it ends.
      const rows = await db
        .select()
        .from(schema.challenges)
        .where(
          and(lte(schema.challenges.startsAt, now), gte(schema.challenges.endsAt, now)),
        );

      return rows.map(toStoredChallenge);
    },

    async listActiveForAccount(riotAccountId: string, now: Date): Promise<StoredChallenge[]> {
      const rows = await db
        .select({ challenge: schema.challenges })
        .from(schema.participants)
        .innerJoin(schema.challenges, eq(schema.participants.challengeId, schema.challenges.id))
        .where(
          and(
            eq(schema.participants.riotAccountId, riotAccountId),
            lte(schema.challenges.startsAt, now),
            gte(schema.challenges.endsAt, now),
          ),
        );

      return rows.map((row) => toStoredChallenge(row.challenge));
    },
  };
}
