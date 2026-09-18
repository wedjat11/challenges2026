import { relations, sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * D1 is SQLite. Timestamps are stored as integers in `timestamp_ms` mode so
 * comparisons are numeric and Drizzle hands back real `Date` objects, which is
 * what the domain's challenge window expects.
 */
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

/** A person. Identity comes from Discord, because Riot does not offer it yet. */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: createdAt(),
});

/**
 * A Riot account a user says is theirs.
 *
 * `verified` is false for every row in v1 and exists so the schema does not
 * have to change when Riot Sign On becomes available. `puuid` is unique across
 * the table: the same Riot account cannot be claimed by two users, so the first
 * claim wins rather than both being silently tracked.
 */
export const riotAccounts = sqliteTable(
  "riot_accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    puuid: text("puuid").notNull().unique(),
    gameName: text("game_name").notNull(),
    tagLine: text("tag_line").notNull(),
    /** Platform shard for summoner-v4 and league-v4: la1, la2, na1, … */
    platform: text("platform").notNull(),
    /** Regional cluster for account-v1 and match-v5: americas, europe, asia. */
    region: text("region").notNull(),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [index("riot_accounts_user_idx").on(table.userId)],
);

/**
 * A challenge.
 *
 * `rulesJson` holds the shape defined in src/domain/rule-codec.ts: a list of
 * rules, each a target plus the criteria a match must satisfy in full. It is
 * validated on the way in and out rather than trusted, because a text column
 * accepts anything and a dropped criterion silently widens what counts.
 */
export const challenges = sqliteTable(
  "challenges",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Always "lol" in v1. The column exists so adding TFT is data, not a migration. */
    game: text("game").notNull().default("lol"),
    title: text("title").notNull(),
    rulesJson: text("rules_json").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
    visibility: text("visibility", { enum: ["public", "unlisted"] })
      .notNull()
      .default("unlisted"),
    createdAt: createdAt(),
  },
  (table) => [
    index("challenges_owner_idx").on(table.ownerId),
    // Polling asks "which challenges are open right now"; this is that query.
    index("challenges_window_idx").on(table.endsAt, table.startsAt),
  ],
);

/** One Riot account entered in one challenge. */
export const participants = sqliteTable(
  "participants",
  {
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    riotAccountId: text("riot_account_id")
      .notNull()
      .references(() => riotAccounts.id, { onDelete: "cascade" }),
    joinedAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.challengeId, table.riotAccountId] }),
    index("participants_account_idx").on(table.riotAccountId),
  ],
);

/**
 * Progress for one participant against one rule.
 *
 * `ruleIndex` points into the challenge's rules array. `current` is stored
 * uncapped, matching `evaluate`: 12 of 10 is information, not an error.
 */
export const progress = sqliteTable(
  "progress",
  {
    challengeId: text("challenge_id").notNull(),
    riotAccountId: text("riot_account_id").notNull(),
    ruleIndex: integer("rule_index").notNull(),
    current: integer("current").notNull().default(0),
    target: integer("target").notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    updatedAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.challengeId, table.riotAccountId, table.ruleIndex] }),
  ],
);

/**
 * Matches already fetched from Riot.
 *
 * Keyed by match AND player: one game produces a different summary for each
 * participant. This table is what stops two overlapping challenges costing two
 * identical Riot calls, and match data never changes once a game ends, so
 * caching it is free correctness rather than a staleness risk.
 */
export const matchCache = sqliteTable(
  "match_cache",
  {
    matchId: text("match_id").notNull(),
    puuid: text("puuid").notNull(),
    game: text("game").notNull().default("lol"),
    playedAt: integer("played_at", { mode: "timestamp_ms" }).notNull(),
    summaryJson: text("summary_json").notNull(),
    fetchedAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.matchId, table.puuid] }),
    // Evaluating a challenge asks for one player's matches inside a window.
    index("match_cache_player_idx").on(table.puuid, table.playedAt),
  ],
);

/**
 * Where polling got to for each tracked account.
 *
 * `lastMatchId` and `lastPolledAt` exist so a cycle fetches only what is new.
 * Re-reading a player's whole history every cycle is what exhausts the rate
 * limit. `nextPollAfter` lets idle players be backed off instead of polled at
 * the same cadence as someone mid-session.
 */
export const pollState = sqliteTable(
  "poll_state",
  {
    puuid: text("puuid").notNull(),
    game: text("game").notNull().default("lol"),
    lastMatchId: text("last_match_id"),
    lastPolledAt: integer("last_polled_at", { mode: "timestamp_ms" }),
    nextPollAfter: integer("next_poll_after", { mode: "timestamp_ms" }),
    failureCount: integer("failure_count").notNull().default(0),
    /**
     * The earliest match `startTime` this player's history has actually been
     * fetched from. `null` means nothing has ever been fetched.
     *
     * Paging normally picks up at `lastMatchId`, but that boundary says
     * nothing about how far *back* it goes — joining a challenge whose
     * `startsAt` is earlier than everything fetched so far needs a backfill
     * from the new, earlier start, which `lastMatchId` alone cannot express.
     * See `needsBackfill` in domain/polling.ts.
     */
    coveredFrom: integer("covered_from", { mode: "timestamp_ms" }),
  },
  (table) => [
    primaryKey({ columns: [table.puuid, table.game] }),
    // The producer's only question: who is due?
    index("poll_state_due_idx").on(table.nextPollAfter),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  riotAccounts: many(riotAccounts),
  challenges: many(challenges),
}));

export const riotAccountsRelations = relations(riotAccounts, ({ one, many }) => ({
  user: one(users, { fields: [riotAccounts.userId], references: [users.id] }),
  participations: many(participants),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  owner: one(users, { fields: [challenges.ownerId], references: [users.id] }),
  participants: many(participants),
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  challenge: one(challenges, {
    fields: [participants.challengeId],
    references: [challenges.id],
  }),
  riotAccount: one(riotAccounts, {
    fields: [participants.riotAccountId],
    references: [riotAccounts.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type RiotAccount = typeof riotAccounts.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type CachedMatch = typeof matchCache.$inferSelect;
export type PollState = typeof pollState.$inferSelect;
