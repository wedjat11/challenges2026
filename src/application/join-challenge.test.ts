import { describe, expect, it } from "vitest";

import { joinChallenge, type JoinChallengeInput } from "@/application/join-challenge";
import type { ChallengeRepository, StoredChallenge } from "@/domain/ports/challenge-repository";
import type { RiotAccount, RiotAccountRepository } from "@/domain/ports/riot-account-repository";

const WINDOW = {
  startsAt: new Date("2026-01-01T00:00:00.000Z"),
  endsAt: new Date("2026-01-08T00:00:00.000Z"),
};

const NOW = new Date("2026-01-04T00:00:00.000Z");

function aChallenge(overrides: Partial<StoredChallenge> = {}): StoredChallenge {
  return {
    id: "challenge-1",
    ownerId: "owner-1",
    game: "lol",
    title: "Play 3 games",
    rules: [{ target: 3, criteria: [] }],
    ...WINDOW,
    visibility: "public",
    createdAt: new Date("2025-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

/** In-memory stand-in for the adapter — records exactly what was written, nothing else. */
function fakeChallenges(opts: {
  challenges?: StoredChallenge[];
  participants?: string[];
}): ChallengeRepository & { joins: Array<{ challengeId: string; riotAccountId: string }> } {
  const byId = new Map((opts.challenges ?? []).map((challenge) => [challenge.id, challenge]));
  const participants = new Set(opts.participants ?? []);
  const joins: Array<{ challengeId: string; riotAccountId: string }> = [];
  return {
    joins,
    async create() {
      throw new Error("not used by joinChallenge");
    },
    async findById(id: string) {
      return byId.get(id) ?? null;
    },
    async join(challengeId: string, riotAccountId: string) {
      joins.push({ challengeId, riotAccountId });
      participants.add(riotAccountId);
    },
    async listParticipants() {
      return [...participants];
    },
    async saveProgress() {
      throw new Error("not used by joinChallenge");
    },
    async findProgress() {
      throw new Error("not used by joinChallenge");
    },
    async listActiveAt() {
      throw new Error("not used by joinChallenge");
    },
    async listActiveForAccount() {
      throw new Error("not used by joinChallenge");
    },
    async listPublic() {
      throw new Error("not used by joinChallenge");
    },
    async listProgressForChallenge() {
      throw new Error("not used by joinChallenge");
    },
  };
}

function aRiotAccount(overrides: Partial<RiotAccount> = {}): RiotAccount {
  return {
    id: "account-1",
    userId: "user-1",
    puuid: "puuid-1",
    gameName: "ThothMon",
    tagLine: "LAN1",
    platform: "la1",
    region: "americas",
    verified: false,
    createdAt: new Date("2025-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function fakeRiotAccounts(accounts: RiotAccount[]): RiotAccountRepository {
  return {
    async link() {
      throw new Error("not used by joinChallenge");
    },
    async listByUser() {
      throw new Error("not used by joinChallenge");
    },
    async findByPuuid() {
      throw new Error("not used by joinChallenge");
    },
    async findById(id: string) {
      return accounts.find((account) => account.id === id) ?? null;
    },
    async unlink() {
      throw new Error("not used by joinChallenge");
    },
  };
}

function baseInput(overrides: Partial<JoinChallengeInput> = {}): JoinChallengeInput {
  return {
    userId: "user-1",
    challengeId: "challenge-1",
    riotAccountId: "account-1",
    ...overrides,
  };
}

describe("joinChallenge", () => {
  it("joins, recording exactly one participant row", async () => {
    const challenges = fakeChallenges({ challenges: [aChallenge()] });
    const riotAccounts = fakeRiotAccounts([aRiotAccount({ id: "account-1", userId: "user-1" })]);
    const join = joinChallenge({ challenges, riotAccounts, now: () => NOW });

    const result = await join(baseInput());

    expect(result).toEqual({ kind: "joined" });
    expect(challenges.joins).toEqual([{ challengeId: "challenge-1", riotAccountId: "account-1" }]);
  });

  it("reports already_joined and adds no row on a second join", async () => {
    const challenges = fakeChallenges({
      challenges: [aChallenge()],
      participants: ["account-1"],
    });
    const riotAccounts = fakeRiotAccounts([aRiotAccount({ id: "account-1", userId: "user-1" })]);
    const join = joinChallenge({ challenges, riotAccounts, now: () => NOW });

    const result = await join(baseInput());

    expect(result).toEqual({ kind: "already_joined" });
    expect(challenges.joins).toEqual([]);
  });

  it("reports challenge_not_found for an unknown challenge", async () => {
    const challenges = fakeChallenges({ challenges: [] });
    const riotAccounts = fakeRiotAccounts([aRiotAccount({ id: "account-1", userId: "user-1" })]);
    const join = joinChallenge({ challenges, riotAccounts, now: () => NOW });

    const result = await join(baseInput({ challengeId: "unknown-challenge" }));

    expect(result).toEqual({ kind: "challenge_not_found" });
    expect(challenges.joins).toEqual([]);
  });

  it("refuses to join an ended challenge, creating no row", async () => {
    const challenges = fakeChallenges({
      challenges: [
        aChallenge({ startsAt: new Date("2025-12-01T00:00:00.000Z"), endsAt: new Date("2026-01-01T00:00:00.000Z") }),
      ],
    });
    const riotAccounts = fakeRiotAccounts([aRiotAccount({ id: "account-1", userId: "user-1" })]);
    const join = joinChallenge({ challenges, riotAccounts, now: () => NOW });

    const result = await join(baseInput());

    expect(result).toEqual({ kind: "challenge_ended" });
    expect(challenges.joins).toEqual([]);
  });

  it("allows joining an upcoming challenge", async () => {
    const challenges = fakeChallenges({
      challenges: [
        aChallenge({ startsAt: new Date("2026-02-01T00:00:00.000Z"), endsAt: new Date("2026-02-08T00:00:00.000Z") }),
      ],
    });
    const riotAccounts = fakeRiotAccounts([aRiotAccount({ id: "account-1", userId: "user-1" })]);
    const join = joinChallenge({ challenges, riotAccounts, now: () => NOW });

    const result = await join(baseInput());

    expect(result).toEqual({ kind: "joined" });
  });

  it("allows joining a live challenge", async () => {
    const challenges = fakeChallenges({ challenges: [aChallenge()] });
    const riotAccounts = fakeRiotAccounts([aRiotAccount({ id: "account-1", userId: "user-1" })]);
    const join = joinChallenge({ challenges, riotAccounts, now: () => NOW });

    const result = await join(baseInput());

    expect(result).toEqual({ kind: "joined" });
  });

  it("refuses a foreign account with no write", async () => {
    const challenges = fakeChallenges({ challenges: [aChallenge()] });
    const riotAccounts = fakeRiotAccounts([aRiotAccount({ id: "account-1", userId: "someone-else" })]);
    const join = joinChallenge({ challenges, riotAccounts, now: () => NOW });

    const result = await join(baseInput());

    expect(result).toEqual({ kind: "riot_account_not_owned" });
    expect(challenges.joins).toEqual([]);
  });

  it("refuses an unknown account with no write", async () => {
    const challenges = fakeChallenges({ challenges: [aChallenge()] });
    const riotAccounts = fakeRiotAccounts([]);
    const join = joinChallenge({ challenges, riotAccounts, now: () => NOW });

    const result = await join(baseInput({ riotAccountId: "unknown-account" }));

    expect(result).toEqual({ kind: "riot_account_not_owned" });
    expect(challenges.joins).toEqual([]);
  });
});
