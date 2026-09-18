import { beforeEach, describe, expect, it } from "vitest";

import { createRiotAccountRepository } from "@/adapters/db/riot-account-repository";
import { createTestDb } from "@/adapters/db/test-db";
import * as schema from "@/db/schema";
import type { NewRiotAccount, RiotAccountRepository } from "@/domain/ports/riot-account-repository";

/** Seeds the users the FK on `riot_accounts.user_id` requires, then wraps a fresh db. */
async function freshRepository(): Promise<RiotAccountRepository> {
  const db = await createTestDb();
  await db.insert(schema.users).values([
    { id: "user-1", discordId: "d1", displayName: "Thoth" },
    { id: "user-2", discordId: "d2", displayName: "Someone Else" },
  ]);

  return createRiotAccountRepository(db);
}

const anAccount = (overrides: Partial<NewRiotAccount> = {}): NewRiotAccount => ({
  userId: "user-1",
  puuid: "puuid-1",
  gameName: "ThothMon",
  tagLine: "LAN1",
  platform: "la1",
  ...overrides,
});

let repository: RiotAccountRepository;
beforeEach(async () => {
  repository = await freshRepository();
});

describe("link", () => {
  it("inserts a new row and returns it as linked", async () => {
    const outcome = await repository.link(anAccount());

    expect(outcome.kind).toBe("linked");
    if (outcome.kind !== "linked") throw new Error("expected linked");
    expect(outcome.account.userId).toBe("user-1");
    expect(outcome.account.puuid).toBe("puuid-1");
    expect(outcome.account.gameName).toBe("ThothMon");
    expect(outcome.account.tagLine).toBe("LAN1");
    expect(outcome.account.platform).toBe("la1");
    expect(outcome.account.region).toBe("americas");
    expect(outcome.account.verified).toBe(false);
    expect(outcome.account.id).toEqual(expect.any(String));
    expect(outcome.account.createdAt).toBeInstanceOf(Date);
  });

  it("reports already_linked, with the original id, for the same user linking the same puuid again", async () => {
    const first = await repository.link(anAccount());
    expect(first.kind).toBe("linked");
    if (first.kind !== "linked") throw new Error("expected linked");

    const second = await repository.link(anAccount({ gameName: "ThothRenamed" }));

    expect(second.kind).toBe("already_linked");
    if (second.kind !== "already_linked") throw new Error("expected already_linked");
    expect(second.account.id).toBe(first.account.id);
  });

  it("reports claimed_by_other_user and inserts no new row when another user links the same puuid", async () => {
    await repository.link(anAccount());

    const outcome = await repository.link(anAccount({ userId: "user-2" }));

    expect(outcome).toEqual({ kind: "claimed_by_other_user" });
    expect(await repository.listByUser("user-2")).toEqual([]);
  });

  it("refreshes gameName, tagLine, platform and region when the same user re-links with a new identity", async () => {
    // Riot IDs get renamed and players transfer platform shards — the second
    // link for the same puuid should update the stored row rather than keep
    // serving the stale identity forever.
    const first = await repository.link(anAccount());
    if (first.kind !== "linked") throw new Error("expected linked");

    const second = await repository.link(anAccount({ gameName: "ThothRenamed", platform: "euw1" }));

    expect(second.kind).toBe("already_linked");
    if (second.kind !== "already_linked") throw new Error("expected already_linked");
    expect(second.account.id).toBe(first.account.id);
    expect(second.account.gameName).toBe("ThothRenamed");
    expect(second.account.platform).toBe("euw1");
    expect(second.account.region).toBe("europe");

    const persisted = await repository.findByPuuid("puuid-1");
    expect(persisted?.gameName).toBe("ThothRenamed");
    expect(persisted?.platform).toBe("euw1");
    expect(persisted?.region).toBe("europe");
  });

  it("leaves the claimed row's count and owner untouched when another user tries to link it", async () => {
    const first = await repository.link(anAccount());
    if (first.kind !== "linked") throw new Error("expected linked");

    await repository.link(anAccount({ userId: "user-2", gameName: "Impersonator" }));

    const rowsForOwner = await repository.listByUser("user-1");
    expect(rowsForOwner).toHaveLength(1);
    expect(rowsForOwner[0]?.id).toBe(first.account.id);
    expect(rowsForOwner[0]?.userId).toBe("user-1");
    expect(rowsForOwner[0]?.gameName).toBe("ThothMon");
  });
});

describe("listByUser", () => {
  it("only returns that user's rows, ordered by createdAt", async () => {
    const db = await createTestDb();
    await db.insert(schema.users).values([
      { id: "user-1", discordId: "d1", displayName: "Thoth" },
      { id: "user-2", discordId: "d2", displayName: "Someone Else" },
    ]);
    // Distinct, out-of-insertion-order timestamps, inserted directly: `link`
    // stores `createdAt` with second resolution (see schema.ts), too coarse
    // to reliably tell two rows apart within one test.
    await db.insert(schema.riotAccounts).values([
      {
        id: "account-1",
        userId: "user-1",
        puuid: "puuid-1",
        gameName: "ThothMon",
        tagLine: "LAN1",
        platform: "la1",
        region: "americas",
        createdAt: new Date("2026-09-18T00:00:00.000Z"),
      },
      {
        id: "account-2",
        userId: "user-1",
        puuid: "puuid-2",
        gameName: "ThothTwo",
        tagLine: "LAN1",
        platform: "la1",
        region: "americas",
        createdAt: new Date("2026-09-18T00:00:01.000Z"),
      },
      {
        id: "account-3",
        userId: "user-2",
        puuid: "puuid-3",
        gameName: "SomeoneElse",
        tagLine: "LAN1",
        platform: "la1",
        region: "americas",
        createdAt: new Date("2026-09-18T00:00:02.000Z"),
      },
    ]);
    const repo = createRiotAccountRepository(db);

    const accounts = await repo.listByUser("user-1");

    expect(accounts.map((a) => a.puuid)).toEqual(["puuid-1", "puuid-2"]);
  });

  it("is empty for a user with no linked accounts", async () => {
    expect(await repository.listByUser("user-2")).toEqual([]);
  });

  it("breaks a tie on createdAt by ordering on id", async () => {
    const db = await createTestDb();
    await db.insert(schema.users).values({ id: "user-1", discordId: "d1", displayName: "Thoth" });
    const sameInstant = new Date("2026-09-18T00:00:00.000Z");
    // Inserted directly, bypassing `link`, so both rows can share the exact
    // same `createdAt` — the scenario `link`'s own timestamp granularity
    // makes easy to hit for two links submitted close together.
    await db.insert(schema.riotAccounts).values([
      {
        id: "z-account",
        userId: "user-1",
        puuid: "puuid-z",
        gameName: "ZeroCool",
        tagLine: "LAN1",
        platform: "la1",
        region: "americas",
        createdAt: sameInstant,
      },
      {
        id: "a-account",
        userId: "user-1",
        puuid: "puuid-a",
        gameName: "AcidBurn",
        tagLine: "LAN1",
        platform: "la1",
        region: "americas",
        createdAt: sameInstant,
      },
    ]);
    const repo = createRiotAccountRepository(db);

    const accounts = await repo.listByUser("user-1");

    expect(accounts.map((a) => a.id)).toEqual(["a-account", "z-account"]);
  });
});

describe("findByPuuid", () => {
  it("finds a linked account by puuid", async () => {
    await repository.link(anAccount());

    const found = await repository.findByPuuid("puuid-1");

    expect(found?.puuid).toBe("puuid-1");
  });

  it("returns null when nobody has linked that puuid", async () => {
    expect(await repository.findByPuuid("nope")).toBeNull();
  });
});

describe("unlink", () => {
  it("deletes a row owned by that user and returns true", async () => {
    const linked = await repository.link(anAccount());
    if (linked.kind !== "linked") throw new Error("expected linked");

    const deleted = await repository.unlink(linked.account.id, "user-1");

    expect(deleted).toBe(true);
    expect(await repository.listByUser("user-1")).toEqual([]);
  });

  it("returns false for another user's row and leaves it in place", async () => {
    const linked = await repository.link(anAccount());
    if (linked.kind !== "linked") throw new Error("expected linked");

    const deleted = await repository.unlink(linked.account.id, "user-2");

    expect(deleted).toBe(false);
    expect(await repository.listByUser("user-1")).toHaveLength(1);
  });

  it("returns false for an id that does not exist", async () => {
    expect(await repository.unlink("nope", "user-1")).toBe(false);
  });
});

describe("reading a corrupted platform or region", () => {
  it("throws a descriptive error rather than silently returning bad data", async () => {
    const db = await createTestDb();
    await db.insert(schema.users).values({ id: "user-1", discordId: "d1", displayName: "Thoth" });
    // Only reachable by writing outside the typed port, which is the point:
    // the write path only ever accepts a validated Platform, so this row
    // simulates external corruption of the column.
    await db.insert(schema.riotAccounts).values({
      id: "account-1",
      userId: "user-1",
      puuid: "puuid-1",
      gameName: "ThothMon",
      tagLine: "LAN1",
      platform: "mars1",
      region: "americas",
    });
    const repo = createRiotAccountRepository(db);

    await expect(repo.listByUser("user-1")).rejects.toThrow(/mars1/);
  });

  it("throws a descriptive error when the stored region disagrees with the platform", async () => {
    const db = await createTestDb();
    await db.insert(schema.users).values({ id: "user-1", discordId: "d1", displayName: "Thoth" });
    // `platform: "la1"` derives to region "americas", but the row was written
    // (outside the typed port) with "europe" — the two must agree.
    await db.insert(schema.riotAccounts).values({
      id: "account-1",
      userId: "user-1",
      puuid: "puuid-1",
      gameName: "ThothMon",
      tagLine: "LAN1",
      platform: "la1",
      region: "europe",
    });
    const repo = createRiotAccountRepository(db);

    await expect(repo.findByPuuid("puuid-1")).rejects.toThrow(/europe/);
  });
});
