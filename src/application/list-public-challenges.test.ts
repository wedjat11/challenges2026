import { describe, expect, it } from "vitest";

import { DEFAULT_PUBLIC_LIMIT, listPublicChallenges } from "@/application/list-public-challenges";
import { rulesToSentences } from "@/domain/rule-text";
import type { ChallengeRepository, StoredChallenge } from "@/domain/ports/challenge-repository";

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

/** Only listPublic is used by listPublicChallenges; every other method throws if hit. */
function fakeChallenges(
  challenges: StoredChallenge[],
): ChallengeRepository & { listPublicCalls: Array<{ now: Date; limit: number }> } {
  const listPublicCalls: Array<{ now: Date; limit: number }> = [];
  return {
    listPublicCalls,
    async create() {
      throw new Error("not used by listPublicChallenges");
    },
    async findById() {
      throw new Error("not used by listPublicChallenges");
    },
    async join() {
      throw new Error("not used by listPublicChallenges");
    },
    async listParticipants() {
      throw new Error("not used by listPublicChallenges");
    },
    async saveProgress() {
      throw new Error("not used by listPublicChallenges");
    },
    async findProgress() {
      throw new Error("not used by listPublicChallenges");
    },
    async listActiveAt() {
      throw new Error("not used by listPublicChallenges");
    },
    async listActiveForAccount() {
      throw new Error("not used by listPublicChallenges");
    },
    async listPublic(now: Date, limit: number) {
      listPublicCalls.push({ now, limit });
      return challenges;
    },
    async listProgressForChallenge() {
      throw new Error("not used by listPublicChallenges");
    },
  };
}

describe("listPublicChallenges", () => {
  it("delegates now and limit to challenges.listPublic", async () => {
    const challenges = fakeChallenges([]);
    const list = listPublicChallenges({ challenges, now: () => NOW });

    await list(10);

    expect(challenges.listPublicCalls).toEqual([{ now: NOW, limit: 10 }]);
  });

  it("defaults limit to DEFAULT_PUBLIC_LIMIT when none is passed", async () => {
    const challenges = fakeChallenges([]);
    const list = listPublicChallenges({ challenges, now: () => NOW });

    await list();

    expect(challenges.listPublicCalls).toEqual([{ now: NOW, limit: DEFAULT_PUBLIC_LIMIT }]);
  });

  it("returns an empty array when listPublic finds nothing", async () => {
    const challenges = fakeChallenges([]);
    const list = listPublicChallenges({ challenges, now: () => NOW });

    const result = await list();

    expect(result).toEqual([]);
  });

  it("returns summaries carrying sentences from rulesToSentences", async () => {
    const rules = [{ target: 1, criteria: [{ kind: "won" as const }] }, { target: 20, criteria: [] }];
    const challenges = fakeChallenges([aChallenge({ rules })]);
    const list = listPublicChallenges({ challenges, now: () => NOW });

    const result = await list();

    expect(result).toEqual([
      {
        id: "challenge-1",
        title: "Play 3 games",
        startsAt: WINDOW.startsAt,
        endsAt: WINDOW.endsAt,
        state: "live",
        ruleText: rulesToSentences(rules),
      },
    ]);
  });
});
