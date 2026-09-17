import { readFileSync } from "node:fs";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { beforeEach, describe, expect, it } from "vitest";

import { drizzle as drizzleD1 } from "drizzle-orm/d1";

import { createChallengeRepository } from "@/adapters/db/challenge-repository";
import type { ChallengeDb } from "@/adapters/db/challenge-repository";
import * as schema from "@/db/schema";
import type { ChallengeRepository, NewChallenge } from "@/domain/ports/challenge-repository";

/**
 * These specs drive SQLite in memory, so nothing here would notice if the
 * adapter stopped accepting a real D1 database — the production path. This
 * assignment is checked by `tsc` and fails the build if that ever drifts.
 */
type D1Drizzle = ReturnType<typeof drizzleD1<typeof schema>>;
const _d1SatisfiesTheAdapter: ChallengeDb = null as unknown as D1Drizzle;
void _d1SatisfiesTheAdapter;

/**
 * Runs against SQLite in memory, applying the same migration file D1 runs.
 *
 * D1 is SQLite, so the SQL under test is the SQL that ships. What this does not
 * cover is driver-level behaviour, which is why the poller is also exercised
 * against real D1 later.
 */
async function freshRepository(): Promise<ChallengeRepository> {
  const client = createClient({ url: ":memory:" });
  const migration = readFileSync("drizzle/0000_initial_schema.sql", "utf8");

  for (const statement of migration.split("--> statement-breakpoint")) {
    const sql = statement.trim();
    if (sql) await client.execute(sql);
  }

  const db = drizzle(client, { schema });
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

  return createChallengeRepository(db);
}

const WINDOW = {
  startsAt: new Date("2026-09-14T00:00:00Z"),
  endsAt: new Date("2026-09-21T00:00:00Z"),
};

const aChallenge = (overrides: Partial<NewChallenge> = {}): NewChallenge => ({
  id: "challenge-1",
  ownerId: "user-1",
  title: "Win 10 ranked games as Jungle",
  rules: [
    {
      target: 10,
      criteria: [
        { kind: "won" },
        { kind: "queue", queue: "ranked-solo" },
        { kind: "role", role: "jungle" },
      ],
    },
  ],
  ...WINDOW,
  visibility: "unlisted",
  ...overrides,
});

let repository: ChallengeRepository;
beforeEach(async () => {
  repository = await freshRepository();
});

describe("storing and reading a challenge", () => {
  it("returns rules as domain objects, not JSON", async () => {
    await repository.create(aChallenge());
    const found = await repository.findById("challenge-1");

    expect(found?.rules[0]?.criteria).toEqual([
      { kind: "won" },
      { kind: "queue", queue: "ranked-solo" },
      { kind: "role", role: "jungle" },
    ]);
  });

  it("round trips the window as Date objects", async () => {
    await repository.create(aChallenge());
    const found = await repository.findById("challenge-1");

    expect(found?.startsAt).toEqual(WINDOW.startsAt);
    expect(found?.endsAt).toEqual(WINDOW.endsAt);
  });

  it("returns null for a challenge that does not exist", async () => {
    expect(await repository.findById("nope")).toBeNull();
  });
});

describe("joining", () => {
  it("lists a participant once they join", async () => {
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");

    expect(await repository.listParticipants("challenge-1")).toEqual(["account-1"]);
  });

  it("treats joining twice as a no-op", async () => {
    // Double-clicking a join button must not create a second row or throw.
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");
    await repository.join("challenge-1", "account-1");

    expect(await repository.listParticipants("challenge-1")).toEqual(["account-1"]);
  });

  it("keeps participants of different challenges apart", async () => {
    await repository.create(aChallenge());
    await repository.create(aChallenge({ id: "challenge-2" }));
    await repository.join("challenge-1", "account-1");
    await repository.join("challenge-2", "account-2");

    expect(await repository.listParticipants("challenge-1")).toEqual(["account-1"]);
  });
});

describe("progress", () => {
  const progress = {
    rules: [{ current: 4, target: 10, completed: false }],
    completed: false,
  };

  it("is empty before anything is evaluated", async () => {
    await repository.create(aChallenge());
    expect(await repository.findProgress("challenge-1", "account-1")).toEqual([]);
  });

  it("stores and reads back what evaluate produced", async () => {
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");
    await repository.saveProgress("challenge-1", "account-1", progress);

    expect(await repository.findProgress("challenge-1", "account-1")).toEqual(progress.rules);
  });

  it("replaces earlier progress rather than accumulating rows", async () => {
    // Every poll re-evaluates from scratch, so saving twice must overwrite.
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");
    await repository.saveProgress("challenge-1", "account-1", progress);
    await repository.saveProgress("challenge-1", "account-1", {
      rules: [{ current: 10, target: 10, completed: true }],
      completed: true,
    });

    expect(await repository.findProgress("challenge-1", "account-1")).toEqual([
      { current: 10, target: 10, completed: true },
    ]);
  });

  it("keeps each participant's progress separate", async () => {
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");
    await repository.join("challenge-1", "account-2");
    await repository.saveProgress("challenge-1", "account-1", progress);

    expect(await repository.findProgress("challenge-1", "account-2")).toEqual([]);
  });
});

describe("finding what the poller should work on", () => {
  it("includes a challenge whose window contains now", async () => {
    await repository.create(aChallenge());
    const active = await repository.listActiveAt(new Date("2026-09-16T12:00:00Z"));

    expect(active.map((c) => c.id)).toEqual(["challenge-1"]);
  });

  it("excludes one that has not started or has ended", async () => {
    await repository.create(aChallenge());
    expect(await repository.listActiveAt(new Date("2026-09-13T00:00:00Z"))).toEqual([]);
    expect(await repository.listActiveAt(new Date("2026-09-22T00:00:00Z"))).toEqual([]);
  });

  it("includes a challenge exactly on its boundaries", async () => {
    // evaluate() treats both bounds as inclusive; storage must agree, or a
    // challenge would stop being polled on the day it ends.
    await repository.create(aChallenge());
    expect(await repository.listActiveAt(WINDOW.startsAt)).toHaveLength(1);
    expect(await repository.listActiveAt(WINDOW.endsAt)).toHaveLength(1);
  });
});
