import { beforeEach, describe, expect, it } from "vitest";

import { createEmailThrottleRepository } from "@/adapters/db/email-throttle-repository";
import { createTestDb } from "@/adapters/db/test-db";
import * as schema from "@/db/schema";
import type {
  EmailThrottleRepository,
  SendThrottleState,
} from "@/domain/ports/email-throttle-repository";

const aState = (overrides: Partial<SendThrottleState> = {}): SendThrottleState => ({
  lastSentAt: new Date("2026-06-01T00:00:00.000Z"),
  windowStartedAt: new Date("2026-06-01T00:00:00.000Z"),
  sentInWindow: 1,
  ...overrides,
});

let db: Awaited<ReturnType<typeof createTestDb>>;
let repository: EmailThrottleRepository;
beforeEach(async () => {
  db = await createTestDb();
  repository = createEmailThrottleRepository(db);
});

describe("find", () => {
  it("returns null for an identifier with no stored state", async () => {
    expect(await repository.find("nobody@example.com")).toBeNull();
  });
});

describe("save/find round trip", () => {
  it("returns exactly what was saved", async () => {
    const state = aState();
    await repository.save("player@example.com", state);

    expect(await repository.find("player@example.com")).toEqual(state);
  });
});

describe("save replaces rather than duplicates", () => {
  it("keeps exactly one row per identifier across repeated saves", async () => {
    await repository.save("player@example.com", aState({ sentInWindow: 1 }));
    const updated = aState({
      sentInWindow: 2,
      lastSentAt: new Date("2026-06-01T00:00:30.000Z"),
    });

    await repository.save("player@example.com", updated);

    expect(await repository.find("player@example.com")).toEqual(updated);

    const rows = await db.select().from(schema.authEmailThrottle);
    expect(rows).toHaveLength(1);
  });

  it("does not disturb a different identifier's row", async () => {
    await repository.save("one@example.com", aState({ sentInWindow: 1 }));
    await repository.save("two@example.com", aState({ sentInWindow: 3 }));

    await repository.save("one@example.com", aState({ sentInWindow: 2 }));

    expect(await repository.find("two@example.com")).toEqual(aState({ sentInWindow: 3 }));
    const rows = await db.select().from(schema.authEmailThrottle);
    expect(rows).toHaveLength(2);
  });
});
