import { describe, expect, it } from "vitest";

import { getChallengeView } from "@/application/get-challenge-view";
import { rulesToSentences } from "@/domain/rule-text";
import type {
  ChallengeRepository,
  ParticipantProgress,
  StoredChallenge,
} from "@/domain/ports/challenge-repository";
import type { PollState, PollingRepository } from "@/domain/ports/polling-repository";
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

/** Only findById/listParticipants/listProgressForChallenge are used by getChallengeView; everything else throws if hit. */
function fakeChallenges(opts: {
  challenges?: StoredChallenge[];
  participants?: string[];
  progress?: ParticipantProgress[];
}): ChallengeRepository {
  const byId = new Map((opts.challenges ?? []).map((challenge) => [challenge.id, challenge]));
  const participants = opts.participants ?? [];
  const progress = opts.progress ?? [];
  return {
    async create() {
      throw new Error("not used by getChallengeView");
    },
    async findById(id: string) {
      return byId.get(id) ?? null;
    },
    async join() {
      throw new Error("not used by getChallengeView");
    },
    async listParticipants() {
      return participants;
    },
    async saveProgress() {
      throw new Error("not used by getChallengeView");
    },
    async findProgress() {
      throw new Error("not used by getChallengeView");
    },
    async listActiveAt() {
      throw new Error("not used by getChallengeView");
    },
    async listActiveForAccount() {
      throw new Error("not used by getChallengeView");
    },
    async listPublic() {
      throw new Error("not used by getChallengeView");
    },
    async listProgressForChallenge() {
      return progress;
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
      throw new Error("not used by getChallengeView");
    },
    async listByUser() {
      throw new Error("not used by getChallengeView");
    },
    async findByPuuid() {
      throw new Error("not used by getChallengeView");
    },
    async findById(id: string) {
      return accounts.find((account) => account.id === id) ?? null;
    },
    async unlink() {
      throw new Error("not used by getChallengeView");
    },
  };
}

function fakePolling(states: Record<string, PollState | null>): PollingRepository {
  return {
    async listDue() {
      throw new Error("not used by getChallengeView");
    },
    async getState(puuid: string) {
      return states[puuid] ?? null;
    },
    async saveState() {
      throw new Error("not used by getChallengeView");
    },
    async cacheMatches() {
      throw new Error("not used by getChallengeView");
    },
    async listCached() {
      throw new Error("not used by getChallengeView");
    },
  };
}

function aPollState(overrides: Partial<PollState> = {}): PollState {
  return {
    puuid: "puuid-1",
    lastMatchId: null,
    lastPolledAt: null,
    nextPollAfter: null,
    failureCount: 0,
    coveredFrom: null,
    ...overrides,
  };
}

describe("getChallengeView", () => {
  it("reports not_found for an unknown challenge id", async () => {
    const view = getChallengeView({
      challenges: fakeChallenges({ challenges: [] }),
      riotAccounts: fakeRiotAccounts([]),
      polling: fakePolling({}),
      now: () => NOW,
    });

    const result = await view("unknown-challenge");

    expect(result).toEqual({ kind: "not_found" });
  });

  it("computes state 'upcoming' when now is before startsAt", async () => {
    const view = getChallengeView({
      challenges: fakeChallenges({ challenges: [aChallenge()] }),
      riotAccounts: fakeRiotAccounts([]),
      polling: fakePolling({}),
      now: () => new Date("2025-12-31T23:59:59.000Z"),
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind === "found") expect(result.view.state).toBe("upcoming");
  });

  it("computes state 'live' when now equals startsAt", async () => {
    const view = getChallengeView({
      challenges: fakeChallenges({ challenges: [aChallenge()] }),
      riotAccounts: fakeRiotAccounts([]),
      polling: fakePolling({}),
      now: () => WINDOW.startsAt,
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind === "found") expect(result.view.state).toBe("live");
  });

  it("computes state 'live' when now equals endsAt", async () => {
    const view = getChallengeView({
      challenges: fakeChallenges({ challenges: [aChallenge()] }),
      riotAccounts: fakeRiotAccounts([]),
      polling: fakePolling({}),
      now: () => WINDOW.endsAt,
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind === "found") expect(result.view.state).toBe("live");
  });

  it("computes state 'ended' when now is after endsAt", async () => {
    const view = getChallengeView({
      challenges: fakeChallenges({ challenges: [aChallenge()] }),
      riotAccounts: fakeRiotAccounts([]),
      polling: fakePolling({}),
      now: () => new Date("2026-01-08T00:00:01.000Z"),
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind === "found") expect(result.view.state).toBe("ended");
  });

  it("lists every participant, not just one", async () => {
    const view = getChallengeView({
      challenges: fakeChallenges({
        challenges: [aChallenge()],
        participants: ["account-1", "account-2"],
        progress: [
          { riotAccountId: "account-1", rules: [{ current: 1, target: 3, completed: false }] },
          { riotAccountId: "account-2", rules: [{ current: 3, target: 3, completed: true }] },
        ],
      }),
      riotAccounts: fakeRiotAccounts([
        aRiotAccount({ id: "account-1", gameName: "Ahri", tagLine: "LAN1" }),
        aRiotAccount({ id: "account-2", gameName: "Zed", tagLine: "LAN2" }),
      ]),
      polling: fakePolling({}),
      now: () => NOW,
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind !== "found") return;
    const ids = result.view.participants.map((participant) => participant.riotAccountId);
    expect(ids).toEqual(["account-1", "account-2"]);
  });

  it("zero-fills progress for a participant with no stored progress rows", async () => {
    const view = getChallengeView({
      challenges: fakeChallenges({
        challenges: [aChallenge({ rules: [{ target: 3, criteria: [] }, { target: 5, criteria: [] }] })],
        participants: ["account-1"],
        progress: [],
      }),
      riotAccounts: fakeRiotAccounts([aRiotAccount({ id: "account-1" })]),
      polling: fakePolling({}),
      now: () => NOW,
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind !== "found") return;
    expect(result.view.participants[0]?.rules).toEqual([
      { current: 0, target: 3, completed: false },
      { current: 0, target: 5, completed: false },
    ]);
  });

  it("reports lastCheckedAt null when there is no poll state", async () => {
    const view = getChallengeView({
      challenges: fakeChallenges({
        challenges: [aChallenge()],
        participants: ["account-1"],
        progress: [],
      }),
      riotAccounts: fakeRiotAccounts([aRiotAccount({ id: "account-1", puuid: "puuid-1" })]),
      polling: fakePolling({}),
      now: () => NOW,
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind !== "found") return;
    expect(result.view.participants[0]?.lastCheckedAt).toBeNull();
  });

  it("reports lastCheckedAt from poll_state.last_polled_at when present", async () => {
    const lastPolledAt = new Date("2026-01-03T12:00:00.000Z");
    const view = getChallengeView({
      challenges: fakeChallenges({
        challenges: [aChallenge()],
        participants: ["account-1"],
        progress: [],
      }),
      riotAccounts: fakeRiotAccounts([aRiotAccount({ id: "account-1", puuid: "puuid-1" })]),
      polling: fakePolling({ "puuid-1": aPollState({ puuid: "puuid-1", lastPolledAt }) }),
      now: () => NOW,
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind !== "found") return;
    expect(result.view.participants[0]?.lastCheckedAt).toEqual(lastPolledAt);
  });

  it("renders ruleText from rulesToSentences", async () => {
    const rules = [{ target: 1, criteria: [{ kind: "won" as const }] }, { target: 20, criteria: [] }];
    const view = getChallengeView({
      challenges: fakeChallenges({ challenges: [aChallenge({ rules })] }),
      riotAccounts: fakeRiotAccounts([]),
      polling: fakePolling({}),
      now: () => NOW,
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind !== "found") return;
    expect(result.view.ruleText).toEqual(rulesToSentences(rules));
  });

  it("degrades to a placeholder when the Riot account row vanished after joining", async () => {
    const view = getChallengeView({
      challenges: fakeChallenges({
        challenges: [aChallenge({ rules: [{ target: 3, criteria: [] }] })],
        participants: ["account-ahri", "account-vanished"],
        progress: [],
      }),
      riotAccounts: fakeRiotAccounts([
        aRiotAccount({ id: "account-ahri", gameName: "Ahri", tagLine: "LAN1" }),
        // "account-vanished" is intentionally absent — simulates an unlinked Riot account.
      ]),
      polling: fakePolling({}),
      now: () => NOW,
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind !== "found") return;
    const vanished = result.view.participants.find(
      (participant) => participant.riotAccountId === "account-vanished",
    );
    expect(vanished).toEqual({
      riotAccountId: "account-vanished",
      displayName: "Unknown account",
      platformLabel: "Unknown",
      rules: [{ current: 0, target: 3, completed: false }],
      lastCheckedAt: null,
    });
    expect(result.view.participants.map((participant) => participant.displayName)).toEqual([
      "Ahri#LAN1",
      "Unknown account",
    ]);
  });

  it("sorts participants by lowercased displayName ascending", async () => {
    const view = getChallengeView({
      challenges: fakeChallenges({
        challenges: [aChallenge()],
        participants: ["account-zed", "account-ahri"],
        progress: [],
      }),
      riotAccounts: fakeRiotAccounts([
        aRiotAccount({ id: "account-zed", gameName: "zed", tagLine: "LAN1" }),
        aRiotAccount({ id: "account-ahri", gameName: "Ahri", tagLine: "LAN2" }),
      ]),
      polling: fakePolling({}),
      now: () => NOW,
    });

    const result = await view("challenge-1");

    expect(result.kind).toBe("found");
    if (result.kind !== "found") return;
    expect(result.view.participants.map((participant) => participant.displayName)).toEqual([
      "Ahri#LAN2",
      "zed#LAN1",
    ]);
  });
});
