import { describe, expect, it } from "vitest";

import { createChallenge, type CreateChallengeInput } from "@/application/create-challenge";
import type {
  ChallengeRepository,
  NewChallenge,
} from "@/domain/ports/challenge-repository";
import type { RiotAccount, RiotAccountRepository } from "@/domain/ports/riot-account-repository";

/** In-memory stand-in for the adapter — records exactly what was written, nothing else. */
function fakeChallenges(): ChallengeRepository & {
  created: NewChallenge[];
  joins: Array<{ challengeId: string; riotAccountId: string }>;
} {
  const created: NewChallenge[] = [];
  const joins: Array<{ challengeId: string; riotAccountId: string }> = [];
  return {
    created,
    joins,
    async create(challenge: NewChallenge): Promise<void> {
      created.push(challenge);
    },
    async findById() {
      throw new Error("not used by createChallenge");
    },
    async join(challengeId: string, riotAccountId: string): Promise<void> {
      joins.push({ challengeId, riotAccountId });
    },
    async listParticipants() {
      throw new Error("not used by createChallenge");
    },
    async saveProgress() {
      throw new Error("not used by createChallenge");
    },
    async findProgress() {
      throw new Error("not used by createChallenge");
    },
    async listActiveAt() {
      throw new Error("not used by createChallenge");
    },
    async listActiveForAccount() {
      throw new Error("not used by createChallenge");
    },
    async listPublic() {
      throw new Error("not used by createChallenge");
    },
    async listProgressForChallenge() {
      throw new Error("not used by createChallenge");
    },
  };
}

function aRiotAccount(overrides: Partial<RiotAccount> = {}): RiotAccount {
  return {
    id: "account-1",
    userId: "owner-1",
    puuid: "puuid-1",
    gameName: "ThothMon",
    tagLine: "LAN1",
    platform: "la1",
    region: "americas",
    verified: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function fakeRiotAccounts(accounts: RiotAccount[]): RiotAccountRepository {
  return {
    async link() {
      throw new Error("not used by createChallenge");
    },
    async listByUser() {
      throw new Error("not used by createChallenge");
    },
    async findByPuuid() {
      throw new Error("not used by createChallenge");
    },
    async findById(id: string) {
      return accounts.find((account) => account.id === id) ?? null;
    },
    async unlink() {
      throw new Error("not used by createChallenge");
    },
  };
}

const VALID_RULES_JSON = JSON.stringify([{ target: 10, criteria: [{ kind: "won" }] }]);

function baseInput(overrides: Partial<CreateChallengeInput> = {}): CreateChallengeInput {
  return {
    ownerId: "owner-1",
    title: "Win 10 games",
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2026-01-08T00:00:00.000Z",
    visibility: "public",
    rulesJson: VALID_RULES_JSON,
    joinAsRiotAccountId: null,
    ...overrides,
  };
}

describe("createChallenge", () => {
  it("stores exactly the submitted title, window, visibility and rules on a valid submission", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(baseInput());

    expect(result).toEqual({ kind: "created", id: "new-id-1" });
    expect(challenges.created).toEqual([
      {
        id: "new-id-1",
        ownerId: "owner-1",
        title: "Win 10 games",
        rules: [{ target: 10, criteria: [{ kind: "won" }] }],
        startsAt: new Date("2026-01-01T00:00:00.000Z"),
        endsAt: new Date("2026-01-08T00:00:00.000Z"),
        visibility: "public",
      },
    ]);
  });

  it("creates the challenge with zero participants when joinAsRiotAccountId is null", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(baseInput({ joinAsRiotAccountId: null }));

    expect(result).toEqual({ kind: "created", id: "new-id-1" });
    expect(challenges.joins).toEqual([]);
  });

  it("rejects a whitespace-only title, creating nothing", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(baseInput({ title: "   " }));

    expect(result).toEqual({ kind: "invalid_title" });
    expect(challenges.created).toEqual([]);
  });

  it("rejects endsAt equal to startsAt", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(
      baseInput({ startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-01-01T00:00:00.000Z" }),
    );

    expect(result).toEqual({ kind: "invalid_window", reason: "end_not_after_start" });
    expect(challenges.created).toEqual([]);
  });

  it("rejects endsAt before startsAt", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(
      baseInput({ startsAt: "2026-01-08T00:00:00.000Z", endsAt: "2026-01-01T00:00:00.000Z" }),
    );

    expect(result).toEqual({ kind: "invalid_window", reason: "end_not_after_start" });
    expect(challenges.created).toEqual([]);
  });

  it("rejects an unparseable date", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(baseInput({ startsAt: "not-a-date" }));

    expect(result).toEqual({ kind: "invalid_window", reason: "unparseable" });
    expect(challenges.created).toEqual([]);
  });

  it("rejects a visibility outside public/unlisted", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(baseInput({ visibility: "secret" }));

    expect(result).toEqual({ kind: "invalid_visibility" });
    expect(challenges.created).toEqual([]);
  });

  it("names the second rule when safeParseRules fails on it", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });
    const rulesJson = JSON.stringify([
      { target: 5, criteria: [] },
      { target: -1, criteria: [] },
    ]);

    const result = await create(baseInput({ rulesJson }));

    expect(result).toEqual({ kind: "invalid_rules", ruleIndex: 1, field: "target" });
    expect(challenges.created).toEqual([]);
  });

  it("rejects zero rules", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(baseInput({ rulesJson: "[]" }));

    expect(result.kind).toBe("invalid_rules");
    expect(challenges.created).toEqual([]);
  });

  it("rejects 6 rules as too_many_rules", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });
    const sixRules = Array.from({ length: 6 }, () => ({ target: 1, criteria: [] }));

    const result = await create(baseInput({ rulesJson: JSON.stringify(sixRules) }));

    expect(result).toEqual({ kind: "too_many_rules", limit: 5 });
    expect(challenges.created).toEqual([]);
  });

  it("rejects 5 criteria on one rule as too_many_criteria", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });
    const rulesJson = JSON.stringify([
      {
        target: 1,
        criteria: [
          { kind: "won" },
          { kind: "champion", champion: "Ahri" },
          { kind: "role", role: "jungle" },
          { kind: "queue", queue: "ranked-solo" },
          { kind: "won" },
        ],
      },
    ]);

    const result = await create(baseInput({ rulesJson }));

    expect(result).toEqual({ kind: "too_many_criteria", ruleIndex: 0, limit: 4 });
    expect(challenges.created).toEqual([]);
  });

  it("stores a participant when the owner opts to self-join with an owned account", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([aRiotAccount({ id: "account-1", userId: "owner-1" })]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(baseInput({ joinAsRiotAccountId: "account-1" }));

    expect(result).toEqual({ kind: "created", id: "new-id-1" });
    expect(challenges.joins).toEqual([{ challengeId: "new-id-1", riotAccountId: "account-1" }]);
  });

  it("refuses self-join with a foreign account, creating nothing", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([aRiotAccount({ id: "account-1", userId: "someone-else" })]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(baseInput({ joinAsRiotAccountId: "account-1" }));

    expect(result).toEqual({ kind: "riot_account_not_owned" });
    expect(challenges.created).toEqual([]);
    expect(challenges.joins).toEqual([]);
  });

  it("refuses self-join with an unknown account id, creating nothing", async () => {
    const challenges = fakeChallenges();
    const riotAccounts = fakeRiotAccounts([]);
    const create = createChallenge({ challenges, riotAccounts, newId: () => "new-id-1" });

    const result = await create(baseInput({ joinAsRiotAccountId: "unknown-account" }));

    expect(result).toEqual({ kind: "riot_account_not_owned" });
    expect(challenges.created).toEqual([]);
    expect(challenges.joins).toEqual([]);
  });
});
