import { and, eq } from "drizzle-orm";

import * as schema from "@/db/schema";
import type { ChallengeDb } from "@/adapters/db/challenge-repository";
import { isPlatform, regionForPlatform } from "@/domain/riot-id";
import type {
  LinkOutcome,
  NewRiotAccount,
  RiotAccount,
  RiotAccountRepository,
} from "@/domain/ports/riot-account-repository";

type RiotAccountRow = typeof schema.riotAccounts.$inferSelect;

/**
 * Turns a stored row into the domain shape, validating `platform` on the way
 * out. The write path only ever accepts a typed `Platform`, so a mismatch
 * here means the column was written outside this adapter — a corruption
 * guard, not a case the application is expected to hit.
 */
function toRiotAccount(row: RiotAccountRow): RiotAccount {
  if (!isPlatform(row.platform)) {
    throw new Error(
      `riot_accounts row ${row.id} has an unrecognised platform: "${row.platform}"`,
    );
  }

  // Derived from the platform rather than trusted from the column: the
  // platform is the one Riot's routing actually keys on. The stored `region`
  // column is still asserted against it, since the two are only ever written
  // together and a mismatch means the row was corrupted outside this adapter.
  const derivedRegion = regionForPlatform(row.platform);
  if (row.region !== derivedRegion) {
    throw new Error(
      `riot_accounts row ${row.id} has region "${row.region}" but platform "${row.platform}" implies "${derivedRegion}"`,
    );
  }

  return {
    id: row.id,
    userId: row.userId,
    puuid: row.puuid,
    gameName: row.gameName,
    tagLine: row.tagLine,
    platform: row.platform,
    region: derivedRegion,
    verified: row.verified,
    createdAt: row.createdAt,
  };
}

export function createRiotAccountRepository(db: ChallengeDb): RiotAccountRepository {
  return {
    async link(account: NewRiotAccount): Promise<LinkOutcome> {
      // No check-then-insert window: `puuid` is unique table-wide, so the
      // insert itself is the arbiter of who wins a race between two
      // concurrent links of the same Riot ID. `onConflictDoNothing` makes a
      // losing insert a no-op instead of an unhandled constraint violation,
      // and the select afterwards reads back whichever row the database
      // settled on — ours or a concurrent one — so the three outcomes below
      // are decided from that single row, never from a stale read taken
      // before the insert.
      const id = crypto.randomUUID();
      // Derived, not trusted from the caller: region is a pure function of
      // platform (see `regionForPlatform`), so deriving it here is the only
      // way the column can never disagree with it.
      const region = regionForPlatform(account.platform);
      await db
        .insert(schema.riotAccounts)
        .values({
          id,
          userId: account.userId,
          puuid: account.puuid,
          gameName: account.gameName,
          tagLine: account.tagLine,
          platform: account.platform,
          region,
        })
        .onConflictDoNothing({ target: schema.riotAccounts.puuid });

      const [row] = await db
        .select()
        .from(schema.riotAccounts)
        .where(eq(schema.riotAccounts.puuid, account.puuid))
        .limit(1);

      if (!row) {
        // The insert above always leaves exactly one matching row, whether
        // it won the race or lost it.
        throw new Error(`link: no row for puuid ${account.puuid} right after inserting it`);
      }

      if (row.id === id) return { kind: "linked", account: toRiotAccount(row) };

      if (row.userId === account.userId) {
        const identityChanged =
          row.gameName !== account.gameName ||
          row.tagLine !== account.tagLine ||
          row.platform !== account.platform;

        if (!identityChanged) return { kind: "already_linked", account: toRiotAccount(row) };

        // Riot IDs get renamed and players transfer platform shards — refresh
        // the stored identity (and its derived region) rather than keep
        // serving what the account used to be.
        await db
          .update(schema.riotAccounts)
          .set({
            gameName: account.gameName,
            tagLine: account.tagLine,
            platform: account.platform,
            region,
          })
          .where(eq(schema.riotAccounts.id, row.id));

        return {
          kind: "already_linked",
          account: toRiotAccount({
            ...row,
            gameName: account.gameName,
            tagLine: account.tagLine,
            platform: account.platform,
            region,
          }),
        };
      }

      return { kind: "claimed_by_other_user" };
    },

    async listByUser(userId: string): Promise<RiotAccount[]> {
      const rows = await db
        .select()
        .from(schema.riotAccounts)
        .where(eq(schema.riotAccounts.userId, userId))
        // `id` breaks ties: `createdAt` is stored with second, not
        // millisecond, resolution (see schema.ts), so two links submitted
        // close together can share the same value and would otherwise sort
        // in whatever order the table happens to return them.
        .orderBy(schema.riotAccounts.createdAt, schema.riotAccounts.id);

      return rows.map(toRiotAccount);
    },

    async findByPuuid(puuid: string): Promise<RiotAccount | null> {
      const [row] = await db
        .select()
        .from(schema.riotAccounts)
        .where(eq(schema.riotAccounts.puuid, puuid))
        .limit(1);

      return row ? toRiotAccount(row) : null;
    },

    async unlink(id: string, userId: string): Promise<boolean> {
      // Checked first rather than read from the delete's own result: D1 and
      // libsql report affected-row counts on incompatible shapes, and
      // `ChallengeDb` is typed generically across both (see its doc comment),
      // so neither shape is available without a cast.
      const [row] = await db
        .select({ id: schema.riotAccounts.id })
        .from(schema.riotAccounts)
        .where(and(eq(schema.riotAccounts.id, id), eq(schema.riotAccounts.userId, userId)))
        .limit(1);

      if (!row) return false;

      // Scoped by owner again, not just by id: the check above and this delete
      // are two statements, and a row must never be removable by anyone but
      // the user it belongs to, whatever happens in between.
      await db
        .delete(schema.riotAccounts)
        .where(and(eq(schema.riotAccounts.id, id), eq(schema.riotAccounts.userId, userId)));
      return true;
    },
  };
}
