import { beforeEach, describe, expect, it } from "vitest";

import { createVerificationTokenRepository } from "@/adapters/db/verification-token-repository";
import { createTestDb } from "@/adapters/db/test-db";
import * as schema from "@/db/schema";
import type {
  VerificationToken,
  VerificationTokenRepository,
} from "@/domain/ports/verification-token-repository";

// 15 minutes from the real clock, matching the actual TTL — never a fixed
// calendar date, which would silently become "already expired" once enough
// real time has passed and trip the reap step in `create` on its own insert.
const FIFTEEN_MINUTES_MS = 15 * 60_000;

const aToken = (overrides: Partial<VerificationToken> = {}): VerificationToken => ({
  identifier: "player@example.com",
  token: "hashed-token-1",
  expires: new Date(Date.now() + FIFTEEN_MINUTES_MS),
  ...overrides,
});

let db: Awaited<ReturnType<typeof createTestDb>>;
let repository: VerificationTokenRepository;
beforeEach(async () => {
  db = await createTestDb();
  repository = createVerificationTokenRepository(db);
});

/**
 * Inserts a row directly, bypassing `repository.create`'s own reap step.
 * Only `create` is allowed to assume a freshly-created row's `expires` is in
 * the future (D7); seeding an already-expired row through it would get
 * reaped by its own insert before the test gets to observe anything, which
 * tests the reap mechanism, not the scenario the test names.
 */
async function seedExpired(token: VerificationToken): Promise<void> {
  await db.insert(schema.verificationTokens).values(token);
}

describe("create/consume round trip", () => {
  it("returns exactly what was stored", async () => {
    const token = aToken();
    await repository.create(token);

    const consumed = await repository.consume({
      identifier: token.identifier,
      token: token.token,
    });

    expect(consumed).toEqual(token);
  });
});

describe("single use", () => {
  it("returns null on the second consume of the same token", async () => {
    const token = aToken();
    await repository.create(token);
    await repository.consume({ identifier: token.identifier, token: token.token });

    const second = await repository.consume({ identifier: token.identifier, token: token.token });

    expect(second).toBeNull();
  });
});

describe("wrong lookup", () => {
  it("returns null for a wrong token under a known identifier", async () => {
    const token = aToken();
    await repository.create(token);

    const result = await repository.consume({ identifier: token.identifier, token: "wrong-token" });

    expect(result).toBeNull();
  });

  it("returns null for a wrong identifier with a known token", async () => {
    const token = aToken();
    await repository.create(token);

    const result = await repository.consume({
      identifier: "someone-else@example.com",
      token: token.token,
    });

    expect(result).toBeNull();
  });
});

describe("expiry is not this repository's concern", () => {
  it("still returns an already-expired row from consume — Auth.js owns the expiry comparison", async () => {
    const expired = aToken({
      token: "expired-token",
      expires: new Date("2020-01-01T00:00:00.000Z"),
    });
    await seedExpired(expired);

    const result = await repository.consume({ identifier: expired.identifier, token: expired.token });

    expect(result).toEqual(expired);
  });
});

describe("reaping on create (D7)", () => {
  it("reaps an already-expired token for the same identifier on the next create", async () => {
    const identifier = "player@example.com";
    const expired = aToken({
      identifier,
      token: "expired-token",
      expires: new Date("2020-01-01T00:00:00.000Z"),
    });
    const fresh = aToken({
      identifier,
      token: "fresh-token",
      expires: new Date("2099-06-01T00:00:00.000Z"),
    });

    await seedExpired(expired);
    await repository.create(fresh);

    expect(await repository.consume({ identifier, token: expired.token })).toBeNull();
    expect(await repository.consume({ identifier, token: fresh.token })).toEqual(fresh);
  });

  it("never reaps a still-live token for the same identifier (A6: a second request does not invalidate the first)", async () => {
    const identifier = "player@example.com";
    const first = aToken({
      identifier,
      token: "first-token",
      expires: new Date("2099-01-01T00:00:00.000Z"),
    });
    const second = aToken({
      identifier,
      token: "second-token",
      expires: new Date("2099-02-01T00:00:00.000Z"),
    });

    await repository.create(first);
    await repository.create(second);

    expect(await repository.consume({ identifier, token: first.token })).toEqual(first);
    expect(await repository.consume({ identifier, token: second.token })).toEqual(second);
  });
});
