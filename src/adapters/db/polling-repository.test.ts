import { beforeEach, describe, expect, it } from "vitest";

import { createPollingRepository } from "@/adapters/db/polling-repository";
import { createTestDb } from "@/adapters/db/test-db";
import * as schema from "@/db/schema";
import { aMatch } from "@/domain/match.fixture";
import type { PollingRepository, PollState } from "@/domain/ports/polling-repository";

const WINDOW = {
  startsAt: new Date("2026-09-14T00:00:00Z"),
  endsAt: new Date("2026-09-21T00:00:00Z"),
};

const NOW = new Date("2026-09-16T12:00:00Z");

let repository: PollingRepository;
let db: Awaited<ReturnType<typeof createTestDb>>;

/**
 * Seeds a user, two Riot accounts and one active challenge both accounts join,
 * then wraps a fresh in-memory database in the repository. `db` stays
 * available so individual specs can add whatever extra rows (a second
 * challenge, poll state, cached matches) their scenario needs.
 */
beforeEach(async () => {
  db = await createTestDb();
  await db.insert(schema.users).values({ id: "user-1", discordId: "d1", displayName: "Owner" });
  await db.insert(schema.riotAccounts).values([
    {
      id: "account-1",
      userId: "user-1",
      puuid: "puuid-1",
      gameName: "ThothMon",
      tagLine: "LAN",
      platform: "la1",
      region: "americas",
    },
    {
      id: "account-2",
      userId: "user-1",
      puuid: "puuid-2",
      gameName: "Someone",
      tagLine: "LAN",
      platform: "la1",
      region: "americas",
    },
  ]);
  await db.insert(schema.challenges).values({
    id: "challenge-1",
    ownerId: "user-1",
    title: "Win 10 ranked games as Jungle",
    rulesJson: '[{"target":10,"criteria":[]}]',
    startsAt: WINDOW.startsAt,
    endsAt: WINDOW.endsAt,
    visibility: "unlisted",
  });
  await db
    .insert(schema.participants)
    .values([{ challengeId: "challenge-1", riotAccountId: "account-1" }]);

  repository = createPollingRepository(db);
});

describe("listDue", () => {
  it("includes a participant with no poll_state row", async () => {
    const due = await repository.listDue(NOW, 50);
    expect(due).toEqual([{ puuid: "puuid-1", riotAccountId: "account-1", platform: "la1" }]);
  });

  it("excludes one whose next_poll_after is in the future", async () => {
    await db.insert(schema.pollState).values({
      puuid: "puuid-1",
      game: "lol",
      nextPollAfter: new Date("2026-09-16T13:00:00Z"),
    });

    expect(await repository.listDue(NOW, 50)).toEqual([]);
  });

  it("includes one whose next_poll_after has already passed", async () => {
    await db.insert(schema.pollState).values({
      puuid: "puuid-1",
      game: "lol",
      nextPollAfter: new Date("2026-09-16T11:00:00Z"),
    });

    const due = await repository.listDue(NOW, 50);
    expect(due.map((t) => t.puuid)).toEqual(["puuid-1"]);
  });

  it("excludes participants of a challenge outside its window", async () => {
    expect(await repository.listDue(new Date("2026-09-22T00:00:00Z"), 50)).toEqual([]);
  });

  it("respects the limit", async () => {
    await db.insert(schema.participants).values({
      challengeId: "challenge-1",
      riotAccountId: "account-2",
    });

    const due = await repository.listDue(NOW, 1);
    expect(due).toHaveLength(1);
  });

  it("filters out a participant whose riot_accounts.platform is not recognised, instead of throwing", async () => {
    await db.insert(schema.riotAccounts).values({
      id: "account-corrupt",
      userId: "user-1",
      puuid: "puuid-corrupt",
      gameName: "Corrupt",
      tagLine: "LAN",
      platform: "mars1",
      region: "americas",
    });
    await db
      .insert(schema.participants)
      .values({ challengeId: "challenge-1", riotAccountId: "account-corrupt" });

    const due = await repository.listDue(NOW, 50);

    expect(due.map((t) => t.puuid)).toEqual(["puuid-1"]);
  });

  it("lists a player with two active challenges once", async () => {
    await db.insert(schema.challenges).values({
      id: "challenge-2",
      ownerId: "user-1",
      title: "Play 20 games",
      rulesJson: '[{"target":20,"criteria":[]}]',
      startsAt: WINDOW.startsAt,
      endsAt: WINDOW.endsAt,
      visibility: "unlisted",
    });
    await db
      .insert(schema.participants)
      .values({ challengeId: "challenge-2", riotAccountId: "account-1" });

    const due = await repository.listDue(NOW, 50);
    expect(due.map((t) => t.puuid)).toEqual(["puuid-1"]);
  });
});

describe("state", () => {
  const state: PollState = {
    puuid: "puuid-1",
    lastMatchId: "LA1_10",
    lastPolledAt: NOW,
    nextPollAfter: new Date("2026-09-16T12:15:00Z"),
    failureCount: 0,
    coveredFrom: WINDOW.startsAt,
  };

  it("returns null before any state is saved", async () => {
    expect(await repository.getState("puuid-1")).toBeNull();
  });

  it("round trips through saveState and getState", async () => {
    await repository.saveState(state);
    expect(await repository.getState("puuid-1")).toEqual(state);
  });

  it("overwrites earlier state rather than accumulating rows", async () => {
    await repository.saveState(state);
    await repository.saveState({ ...state, lastMatchId: "LA1_20", failureCount: 1 });

    expect(await repository.getState("puuid-1")).toEqual({
      ...state,
      lastMatchId: "LA1_20",
      failureCount: 1,
    });
  });

  it("round trips a null coveredFrom", async () => {
    await repository.saveState({ ...state, coveredFrom: null });
    expect(await repository.getState("puuid-1")).toEqual({ ...state, coveredFrom: null });
  });
});

describe("cacheMatches and listCached", () => {
  it("caches a match and reads it back", async () => {
    const match = aMatch({ puuid: "puuid-1", matchId: "LA1_1", playedAt: NOW });
    await repository.cacheMatches([match]);

    const cached = await repository.listCached(
      "puuid-1",
      WINDOW.startsAt,
      WINDOW.endsAt,
    );
    expect(cached).toEqual([match]);
  });

  it("upserts rather than duplicating on a repeated (matchId, puuid)", async () => {
    const first = aMatch({ puuid: "puuid-1", matchId: "LA1_1", playedAt: NOW, win: false });
    const updated = { ...first, win: true };

    await repository.cacheMatches([first]);
    await repository.cacheMatches([updated]);

    const cached = await repository.listCached("puuid-1", WINDOW.startsAt, WINDOW.endsAt);
    expect(cached).toEqual([updated]);
  });

  it("filters by the playedAt window", async () => {
    const before = aMatch({
      puuid: "puuid-1",
      matchId: "LA1_early",
      playedAt: new Date("2026-09-13T00:00:00Z"),
    });
    const inside = aMatch({ puuid: "puuid-1", matchId: "LA1_inside", playedAt: NOW });
    const after = aMatch({
      puuid: "puuid-1",
      matchId: "LA1_late",
      playedAt: new Date("2026-09-22T00:00:00Z"),
    });
    await repository.cacheMatches([before, inside, after]);

    const cached = await repository.listCached("puuid-1", WINDOW.startsAt, WINDOW.endsAt);
    expect(cached.map((m) => m.matchId)).toEqual(["LA1_inside"]);
  });

  it("orders results oldest played first", async () => {
    const earlier = aMatch({
      puuid: "puuid-1",
      matchId: "LA1_earlier",
      playedAt: new Date("2026-09-15T00:00:00Z"),
    });
    const later = aMatch({
      puuid: "puuid-1",
      matchId: "LA1_later",
      playedAt: new Date("2026-09-16T00:00:00Z"),
    });
    // Cached out of chronological order on purpose.
    await repository.cacheMatches([later, earlier]);

    const cached = await repository.listCached("puuid-1", WINDOW.startsAt, WINDOW.endsAt);
    expect(cached.map((m) => m.matchId)).toEqual(["LA1_earlier", "LA1_later"]);
  });

  it("keeps different players' cached matches apart", async () => {
    await repository.cacheMatches([
      aMatch({ puuid: "puuid-1", matchId: "LA1_1", playedAt: NOW }),
      aMatch({ puuid: "puuid-2", matchId: "LA1_2", playedAt: NOW }),
    ]);

    const cached = await repository.listCached("puuid-1", WINDOW.startsAt, WINDOW.endsAt);
    expect(cached.map((m) => m.matchId)).toEqual(["LA1_1"]);
  });
});
