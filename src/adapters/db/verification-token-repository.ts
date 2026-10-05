import { and, eq, lt } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

import * as schema from "@/db/schema";
import type {
  VerificationToken,
  VerificationTokenRepository,
} from "@/domain/ports/verification-token-repository";

/**
 * Any async SQLite database Drizzle can drive against this schema.
 *
 * Typed by what the auth repositories use rather than pinned to
 * `DrizzleD1Database`, matching `ChallengeDb`'s reasoning
 * (src/adapters/db/challenge-repository.ts): the same code then runs against
 * D1 in production and against SQLite in memory under test, and a cast in a
 * test is a lie about what the code accepts (D6).
 */
export type AuthDb = BaseSQLiteDatabase<"async", unknown, typeof schema>;

export function createVerificationTokenRepository(db: AuthDb): VerificationTokenRepository {
  return {
    async create(token: VerificationToken): Promise<void> {
      await db.insert(schema.verificationTokens).values({
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      });

      // Opportunistic reap, scoped to this identifier and to rows already
      // expired as of now: a live token for this identifier must survive,
      // because requesting a second link must not invalidate the first (A6).
      // Insert-first means the row just written can never match `expires <
      // now`, so this can never reap what it just inserted (D7).
      await db
        .delete(schema.verificationTokens)
        .where(
          and(
            eq(schema.verificationTokens.identifier, token.identifier),
            lt(schema.verificationTokens.expires, new Date()),
          ),
        );
    },

    async consume(lookup: {
      identifier: string;
      token: string;
    }): Promise<VerificationToken | null> {
      // One DELETE ... RETURNING statement (D6): atomic in SQLite, so a
      // second consume attempt on the same pair always deletes nothing, with
      // no transaction and no read-then-delete window a concurrent click
      // could land inside. Expiry is deliberately not compared here — Auth.js
      // owns that comparison (@auth/core/lib/actions/callback/index.js:147).
      const [row] = await db
        .delete(schema.verificationTokens)
        .where(
          and(
            eq(schema.verificationTokens.identifier, lookup.identifier),
            eq(schema.verificationTokens.token, lookup.token),
          ),
        )
        .returning();

      if (!row) return null;

      return { identifier: row.identifier, token: row.token, expires: row.expires };
    },
  };
}
