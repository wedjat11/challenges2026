import { eq } from "drizzle-orm";

import * as schema from "@/db/schema";
import type { ChallengeDb } from "@/adapters/db/challenge-repository";
import type { DiscordIdentity, User, UserRepository } from "@/domain/ports/user-repository";

type UserRow = typeof schema.users.$inferSelect;

function toUser(row: UserRow): User {
  return {
    id: row.id,
    discordId: row.discordId,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
  };
}

export function createUserRepository(db: ChallengeDb): UserRepository {
  return {
    async upsertFromDiscord(identity: DiscordIdentity): Promise<User> {
      // The generated id is only used on the insert branch: onConflictDoUpdate
      // never touches `id`, so a repeated sign-in keeps the original one.
      await db
        .insert(schema.users)
        .values({
          id: crypto.randomUUID(),
          discordId: identity.discordId,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
        })
        .onConflictDoUpdate({
          target: schema.users.discordId,
          set: {
            displayName: identity.displayName,
            avatarUrl: identity.avatarUrl,
          },
        });

      const [row] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.discordId, identity.discordId))
        .limit(1);

      if (!row) {
        // The insert-or-update above always leaves exactly one matching row.
        throw new Error(`upsertFromDiscord: no row for discordId ${identity.discordId}`);
      }

      return toUser(row);
    },

    async findById(id: string): Promise<User | null> {
      const [row] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);

      return row ? toUser(row) : null;
    },
  };
}
