import { beforeEach, describe, expect, it } from "vitest";

import { drizzle as drizzleD1 } from "drizzle-orm/d1";

import { createChallengeRepository } from "@/adapters/db/challenge-repository";
import type { ChallengeDb } from "@/adapters/db/challenge-repository";
import { createTestDb } from "@/adapters/db/test-db";
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
 * Seeds a fresh in-memory database with the user and Riot accounts these
 * specs join and save progress against, then wraps it in the repository.
 *
 * What this does not cover is driver-level behaviour, which is why the
 * poller is also exercised against real D1 later.
 */
async function freshRepository(): Promise<ChallengeRepository> {
  const db = await createTestDb();
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

describe("listPublic", () => {
  it("includes a public challenge whose window contains now", async () => {
    await repository.create(aChallenge({ visibility: "public" }));

    const listed = await repository.listPublic(new Date("2026-09-16T12:00:00Z"), 10);

    expect(listed.map((c) => c.id)).toEqual(["challenge-1"]);
  });

  it("excludes an unlisted challenge regardless of its window", async () => {
    await repository.create(aChallenge({ visibility: "unlisted" }));

    const listed = await repository.listPublic(new Date("2026-09-16T12:00:00Z"), 10);

    expect(listed).toEqual([]);
  });

  it("excludes a public challenge that has not started yet", async () => {
    await repository.create(aChallenge({ visibility: "public" }));

    const listed = await repository.listPublic(new Date("2026-09-13T00:00:00Z"), 10);

    expect(listed).toEqual([]);
  });

  it("excludes a public challenge that has already ended", async () => {
    await repository.create(aChallenge({ visibility: "public" }));

    const listed = await repository.listPublic(new Date("2026-09-22T00:00:00Z"), 10);

    expect(listed).toEqual([]);
  });

  it("includes a public challenge exactly at startsAt", async () => {
    await repository.create(aChallenge({ visibility: "public" }));

    const listed = await repository.listPublic(WINDOW.startsAt, 10);

    expect(listed.map((c) => c.id)).toEqual(["challenge-1"]);
  });

  it("includes a public challenge exactly at endsAt", async () => {
    await repository.create(aChallenge({ visibility: "public" }));

    const listed = await repository.listPublic(WINDOW.endsAt, 10);

    expect(listed.map((c) => c.id)).toEqual(["challenge-1"]);
  });

  it("orders results by endsAt ascending", async () => {
    await repository.create(
      aChallenge({
        id: "challenge-late",
        visibility: "public",
        endsAt: new Date("2026-09-25T00:00:00Z"),
      }),
    );
    await repository.create(
      aChallenge({
        id: "challenge-early",
        visibility: "public",
        endsAt: new Date("2026-09-18T00:00:00Z"),
      }),
    );

    const listed = await repository.listPublic(new Date("2026-09-16T12:00:00Z"), 10);

    expect(listed.map((c) => c.id)).toEqual(["challenge-early", "challenge-late"]);
  });

  it("breaks a tie on endsAt by ordering on id ascending", async () => {
    await repository.create(
      aChallenge({ id: "challenge-z", visibility: "public", endsAt: WINDOW.endsAt }),
    );
    await repository.create(
      aChallenge({ id: "challenge-a", visibility: "public", endsAt: WINDOW.endsAt }),
    );

    const listed = await repository.listPublic(new Date("2026-09-16T12:00:00Z"), 10);

    expect(listed.map((c) => c.id)).toEqual(["challenge-a", "challenge-z"]);
  });

  it("respects the limit", async () => {
    await repository.create(
      aChallenge({ id: "challenge-a", visibility: "public", endsAt: new Date("2026-09-17T00:00:00Z") }),
    );
    await repository.create(
      aChallenge({ id: "challenge-b", visibility: "public", endsAt: new Date("2026-09-18T00:00:00Z") }),
    );

    const listed = await repository.listPublic(new Date("2026-09-16T12:00:00Z"), 1);

    expect(listed.map((c) => c.id)).toEqual(["challenge-a"]);
  });

  it("returns an empty array, not an error, when nothing matches", async () => {
    const listed = await repository.listPublic(new Date("2026-09-16T12:00:00Z"), 10);

    expect(listed).toEqual([]);
  });
});

describe("listProgressForChallenge", () => {
  it("returns each participant's own rows", async () => {
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");
    await repository.join("challenge-1", "account-2");
    await repository.saveProgress("challenge-1", "account-1", {
      rules: [{ current: 4, target: 10, completed: false }],
      completed: false,
    });
    await repository.saveProgress("challenge-1", "account-2", {
      rules: [{ current: 10, target: 10, completed: true }],
      completed: true,
    });

    const progress = await repository.listProgressForChallenge("challenge-1");

    expect(progress).toEqual(
      expect.arrayContaining([
        {
          riotAccountId: "account-1",
          rules: [{ current: 4, target: 10, completed: false }],
        },
        {
          riotAccountId: "account-2",
          rules: [{ current: 10, target: 10, completed: true }],
        },
      ]),
    );
    expect(progress).toHaveLength(2);
  });

  it("preserves ruleIndex order within a participant", async () => {
    await repository.create(
      aChallenge({
        rules: [
          { target: 10, criteria: [] },
          { target: 5, criteria: [{ kind: "won" }] },
        ],
      }),
    );
    await repository.join("challenge-1", "account-1");
    await repository.saveProgress("challenge-1", "account-1", {
      rules: [
        { current: 3, target: 10, completed: false },
        { current: 1, target: 5, completed: false },
      ],
      completed: false,
    });

    const [participant] = await repository.listProgressForChallenge("challenge-1");

    expect(participant?.rules).toEqual([
      { current: 3, target: 10, completed: false },
      { current: 1, target: 5, completed: false },
    ]);
  });

  it("maps a null completedAt to completed: false", async () => {
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");
    await repository.saveProgress("challenge-1", "account-1", {
      rules: [{ current: 4, target: 10, completed: false }],
      completed: false,
    });

    const [participant] = await repository.listProgressForChallenge("challenge-1");

    expect(participant?.rules[0]?.completed).toBe(false);
  });

  it("omits a participant who joined but has no progress rows", async () => {
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");
    await repository.join("challenge-1", "account-2");
    await repository.saveProgress("challenge-1", "account-1", {
      rules: [{ current: 4, target: 10, completed: false }],
      completed: false,
    });

    const progress = await repository.listProgressForChallenge("challenge-1");

    expect(progress.map((p) => p.riotAccountId)).toEqual(["account-1"]);
  });

  it("returns an empty array for an unknown challenge id", async () => {
    expect(await repository.listProgressForChallenge("nope")).toEqual([]);
  });
});

describe("finding what one account should be polled for", () => {
  it("includes a challenge the account joined that is active now", async () => {
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");

    const active = await repository.listActiveForAccount(
      "account-1",
      new Date("2026-09-16T12:00:00Z"),
    );

    expect(active.map((c) => c.id)).toEqual(["challenge-1"]);
  });

  it("excludes a challenge the account has not joined", async () => {
    await repository.create(aChallenge());

    const active = await repository.listActiveForAccount(
      "account-1",
      new Date("2026-09-16T12:00:00Z"),
    );

    expect(active).toEqual([]);
  });

  it("excludes a joined challenge outside its window", async () => {
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");

    expect(
      await repository.listActiveForAccount("account-1", new Date("2026-09-13T00:00:00Z")),
    ).toEqual([]);
    expect(
      await repository.listActiveForAccount("account-1", new Date("2026-09-22T00:00:00Z")),
    ).toEqual([]);
  });

  it("includes a joined challenge exactly on its boundaries", async () => {
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-1");

    expect(await repository.listActiveForAccount("account-1", WINDOW.startsAt)).toHaveLength(1);
    expect(await repository.listActiveForAccount("account-1", WINDOW.endsAt)).toHaveLength(1);
  });

  it("does not return a challenge only a different account joined", async () => {
    await repository.create(aChallenge());
    await repository.join("challenge-1", "account-2");

    const active = await repository.listActiveForAccount(
      "account-1",
      new Date("2026-09-16T12:00:00Z"),
    );

    expect(active).toEqual([]);
  });
});
