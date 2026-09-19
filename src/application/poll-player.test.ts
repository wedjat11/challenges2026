import { describe, expect, it, vi } from "vitest";

import { pollPlayer } from "@/application/poll-player";
import {
  MAX_PAGES,
  MIN_IDLE_POLL_INTERVAL_MS,
  PAGE_SIZE,
  POLL_INTERVAL_CAP_MS,
  nextPollAfter,
} from "@/domain/polling";
import { evaluate } from "@/domain/progress";
import { aMatch } from "@/domain/match.fixture";
import type { MatchSummary } from "@/domain/match";
import type { ChallengeRepository, StoredChallenge } from "@/domain/ports/challenge-repository";
import type { ChallengeProgress } from "@/domain/progress";
import { MatchProviderError, type MatchProvider } from "@/domain/ports/match-provider";
import type { PollState, PollTarget, PollingRepository } from "@/domain/ports/polling-repository";
import type { Region } from "@/domain/riot-id";

const WINDOW = {
  startsAt: new Date("2026-09-14T00:00:00Z"),
  endsAt: new Date("2026-09-21T00:00:00Z"),
};

const NOW = new Date("2026-09-16T12:00:00Z");

const TARGET: PollTarget = { puuid: "puuid-1", riotAccountId: "account-1", platform: "la1" };

function aChallenge(overrides: Partial<StoredChallenge> = {}): StoredChallenge {
  return {
    id: "challenge-1",
    ownerId: "owner-1",
    game: "lol",
    title: "Play 3 games",
    rules: [{ target: 3, criteria: [] }],
    ...WINDOW,
    visibility: "unlisted",
    createdAt: new Date("2026-09-01T00:00:00Z"),
    ...overrides,
  };
}

/** Only `listActiveForAccount` and `saveProgress` are used by pollPlayer; everything else throws if hit. */
function fakeChallenges(active: StoredChallenge[]): ChallengeRepository & {
  savedProgress: Array<{ challengeId: string; riotAccountId: string; progress: ChallengeProgress }>;
} {
  const savedProgress: Array<{
    challengeId: string;
    riotAccountId: string;
    progress: ChallengeProgress;
  }> = [];
  return {
    savedProgress,
    async create(): Promise<void> {
      throw new Error("not used by pollPlayer");
    },
    async findById() {
      throw new Error("not used by pollPlayer");
    },
    async join() {
      throw new Error("not used by pollPlayer");
    },
    async listParticipants() {
      throw new Error("not used by pollPlayer");
    },
    async saveProgress(challengeId, riotAccountId, progress) {
      savedProgress.push({ challengeId, riotAccountId, progress });
    },
    async findProgress() {
      throw new Error("not used by pollPlayer");
    },
    async listActiveAt() {
      throw new Error("not used by pollPlayer");
    },
    async listActiveForAccount() {
      return active;
    },
    async listPublic() {
      throw new Error("not used by pollPlayer");
    },
    async listProgressForChallenge() {
      throw new Error("not used by pollPlayer");
    },
  };
}

function fakePolling(opts: {
  state: PollState | null;
  listCached?: PollingRepository["listCached"];
}): PollingRepository & { savedStates: PollState[]; cachedCalls: MatchSummary[][] } {
  const savedStates: PollState[] = [];
  const cachedCalls: MatchSummary[][] = [];
  return {
    savedStates,
    cachedCalls,
    async listDue() {
      throw new Error("not used by pollPlayer");
    },
    async getState() {
      return opts.state;
    },
    async saveState(state) {
      savedStates.push(state);
    },
    async cacheMatches(matches) {
      cachedCalls.push(matches);
    },
    async listCached(puuid, from, to) {
      return opts.listCached ? opts.listCached(puuid, from, to) : [];
    },
  };
}

function fakeMatchProvider(opts: {
  listMatchIds: MatchProvider["listMatchIds"];
  fetchMatch?: MatchProvider["fetchMatch"];
}): MatchProvider {
  return {
    async resolvePuuid() {
      throw new Error("not used by pollPlayer");
    },
    listMatchIds: opts.listMatchIds,
    fetchMatch: opts.fetchMatch ?? (async (matchId, puuid) => aMatch({ matchId, puuid })),
  };
}

describe("first poll, no prior state", () => {
  it("fetches every id Riot returns", async () => {
    const ids = ["LA1_3", "LA1_2", "LA1_1"];
    const fetchedIds: string[] = [];
    const provider = fakeMatchProvider({
      listMatchIds: async () => ids,
      fetchMatch: async (matchId, puuid) => {
        fetchedIds.push(matchId);
        return aMatch({ matchId, puuid, playedAt: WINDOW.startsAt });
      },
    });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: null });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    expect(fetchedIds).toEqual(ids);
    // Cached one at a time, right after each fetch — not batched at the end
    // of the loop. See "incremental, cache-aware fetching" below for what
    // this buys on a mid-poll failure.
    expect(polling.cachedCalls.map((call) => call.length)).toEqual([1, 1, 1]);
    expect(polling.cachedCalls.flatMap((call) => call.map((m) => m.matchId))).toEqual(ids);
    expect(result).toEqual({ kind: "polled", newMatches: 3, challengesUpdated: 1 });
  });

  it("asks the provider for matches from the earliest active challenge's start", async () => {
    const early = aChallenge({
      id: "challenge-early",
      startsAt: new Date("2026-09-10T00:00:00Z"),
      endsAt: WINDOW.endsAt,
    });
    const late = aChallenge({
      id: "challenge-late",
      startsAt: new Date("2026-09-15T00:00:00Z"),
      endsAt: WINDOW.endsAt,
    });
    let seenOptions: { count?: number; start?: number; startTime?: Date } | undefined;
    const provider = fakeMatchProvider({
      listMatchIds: async (_puuid, options) => {
        seenOptions = options;
        return [];
      },
    });
    const challenges = fakeChallenges([late, early]);
    const polling = fakePolling({ state: null });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    await poll(TARGET);

    expect(seenOptions).toEqual({ count: 20, start: 0, startTime: early.startsAt });
  });

  it("asks matchProviderFor for the match-v5 region matching the platform", async () => {
    const seenRegions: Region[] = [];
    const provider = fakeMatchProvider({ listMatchIds: async () => [] });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: null });
    const poll = pollPlayer({
      polling,
      challenges,
      matchProviderFor: (region) => {
        seenRegions.push(region);
        return provider;
      },
      now: () => NOW,
    });

    // oc1 is a SEA platform shard; match-v5 routes it to "sea" (unlike
    // account-v1, which routes it to "asia" — see accountRegionForPlatform).
    await poll({ ...TARGET, platform: "oc1" });

    expect(seenRegions).toEqual(["sea"]);
  });
});

describe("second poll, with prior state", () => {
  const priorState: PollState = {
    puuid: TARGET.puuid,
    lastMatchId: "LA1_2",
    lastPolledAt: new Date("2026-09-16T11:00:00Z"),
    nextPollAfter: new Date("2026-09-16T11:15:00Z"),
    failureCount: 0,
    // Same as aChallenge()'s default startsAt: this player's history is
    // already fully covered from the challenge's own start, so none of
    // these tests trigger a backfill.
    coveredFrom: WINDOW.startsAt,
  };

  it("fetches only ids newer than the last one seen", async () => {
    const ids = ["LA1_4", "LA1_3", "LA1_2", "LA1_1"];
    const fetchedIds: string[] = [];
    const provider = fakeMatchProvider({
      listMatchIds: async () => ids,
      fetchMatch: async (matchId, puuid) => {
        fetchedIds.push(matchId);
        return aMatch({ matchId, puuid, playedAt: WINDOW.startsAt });
      },
    });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: priorState });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    expect(fetchedIds).toEqual(["LA1_4", "LA1_3"]);
    expect(result).toEqual({ kind: "polled", newMatches: 2, challengesUpdated: 1 });
  });

  it("saves the newest id and schedules the next poll from the previous interval", async () => {
    const provider = fakeMatchProvider({ listMatchIds: async () => ["LA1_4", "LA1_3", "LA1_2"] });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: priorState });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    await poll(TARGET);

    // previousIntervalMs = priorState.nextPollAfter - priorState.lastPolledAt = 15 minutes;
    // new matches were found, so the schedule is 15 minutes regardless.
    expect(polling.savedStates).toEqual([
      {
        puuid: TARGET.puuid,
        lastMatchId: "LA1_4",
        lastPolledAt: NOW,
        nextPollAfter: nextPollAfter(NOW, {
          kind: "polled",
          newMatches: 2,
          previousIntervalMs: 15 * 60 * 1000,
        }),
        failureCount: 0,
        coveredFrom: WINDOW.startsAt,
      },
    ]);
  });

  it("keeps the previous lastMatchId when nothing new was found", async () => {
    const provider = fakeMatchProvider({ listMatchIds: async () => ["LA1_2", "LA1_1"] });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: priorState, listCached: async () => [] });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    expect(result).toEqual({ kind: "polled", newMatches: 0, challengesUpdated: 1 });
    expect(polling.savedStates[0]?.lastMatchId).toBe("LA1_2");
  });
});

describe("paging through new matches", () => {
  it("fetches every page of new matches until Riot returns a short page", async () => {
    const page0 = Array.from({ length: PAGE_SIZE }, (_, i) => `LA1_${45 - i}`); // 45..26
    const page1 = Array.from({ length: PAGE_SIZE }, (_, i) => `LA1_${25 - i}`); // 25..6
    const page2 = Array.from({ length: 5 }, (_, i) => `LA1_${5 - i}`); // 5..1, shorter than PAGE_SIZE
    const pages = [page0, page1, page2];
    const seenStarts: number[] = [];
    const fetchedIds: string[] = [];
    const provider = fakeMatchProvider({
      listMatchIds: async (_puuid, options) => {
        seenStarts.push(options?.start ?? 0);
        return pages[seenStarts.length - 1] ?? [];
      },
      fetchMatch: async (matchId, puuid) => {
        fetchedIds.push(matchId);
        return aMatch({ matchId, puuid, playedAt: WINDOW.startsAt });
      },
    });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: null }); // no prior state: every id is new
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    expect(seenStarts).toEqual([0, PAGE_SIZE, PAGE_SIZE * 2]);
    expect(fetchedIds).toEqual([...page0, ...page1, ...page2]);
    expect(result).toMatchObject({ kind: "polled", newMatches: 45 });
    expect(polling.savedStates[0]?.lastMatchId).toBe(page0[0]);
    // Every match fit inside MAX_PAGES: the pass reached a short page, so
    // coverage is exactly startTime, not merely "as far back as we got".
    expect(polling.savedStates[0]?.coveredFrom).toEqual(WINDOW.startsAt);
  });

  it("stops paging at the page containing the previously seen match id", async () => {
    const page0 = Array.from({ length: PAGE_SIZE }, (_, i) => `LA1_${45 - i}`); // 45..26
    const page1 = Array.from({ length: PAGE_SIZE }, (_, i) => `LA1_${25 - i}`); // 25..6, contains LA1_10
    const page2 = Array.from({ length: PAGE_SIZE }, (_, i) => `LA1_${5 - i}`); // must never be fetched
    const pages = [page0, page1, page2];
    const seenStarts: number[] = [];
    const fetchedIds: string[] = [];
    const provider = fakeMatchProvider({
      listMatchIds: async (_puuid, options) => {
        seenStarts.push(options?.start ?? 0);
        return pages[seenStarts.length - 1] ?? [];
      },
      fetchMatch: async (matchId, puuid) => {
        fetchedIds.push(matchId);
        return aMatch({ matchId, puuid, playedAt: WINDOW.startsAt });
      },
    });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({
      state: {
        puuid: TARGET.puuid,
        lastMatchId: "LA1_10",
        lastPolledAt: new Date("2026-09-16T11:00:00Z"),
        nextPollAfter: new Date("2026-09-16T11:15:00Z"),
        failureCount: 0,
        coveredFrom: WINDOW.startsAt,
      },
    });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    expect(seenStarts).toEqual([0, PAGE_SIZE]);
    // page0 in full (20), plus page1's prefix before LA1_10 (ids 25..11 = 15).
    expect(fetchedIds).toHaveLength(20 + 15);
    expect(result).toMatchObject({ kind: "polled", newMatches: 35 });
  });

  it("stops after MAX_PAGES pages even if the boundary was never found", async () => {
    const seenStarts: number[] = [];
    const fetchedIds: string[] = [];
    const provider = fakeMatchProvider({
      listMatchIds: async (_puuid, options) => {
        seenStarts.push(options?.start ?? 0);
        // Always a full, unbounded page: never shorter than PAGE_SIZE, and
        // never contains the (nonexistent) lastMatchId.
        return Array.from({ length: PAGE_SIZE }, (_, i) => `LA1_${seenStarts.length}_${i}`);
      },
      fetchMatch: async (matchId, puuid) => {
        fetchedIds.push(matchId);
        return aMatch({ matchId, puuid, playedAt: WINDOW.startsAt });
      },
    });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: null });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    await poll(TARGET);

    expect(seenStarts).toEqual([0, PAGE_SIZE, PAGE_SIZE * 2, PAGE_SIZE * 3, PAGE_SIZE * 4]);
    expect(seenStarts).toHaveLength(MAX_PAGES);
    expect(fetchedIds).toHaveLength(MAX_PAGES * PAGE_SIZE);
  });
});

describe("incremental, cache-aware fetching", () => {
  it("caches each match right after fetching it, so a failure partway through keeps what was already fetched", async () => {
    const ids = ["LA1_3", "LA1_2", "LA1_1"];
    const fetchedIds: string[] = [];
    const provider = fakeMatchProvider({
      listMatchIds: async () => ids,
      fetchMatch: async (matchId, puuid) => {
        fetchedIds.push(matchId);
        if (matchId === "LA1_1") throw new MatchProviderError(500);
        return aMatch({ matchId, puuid, playedAt: WINDOW.startsAt });
      },
    });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: null });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    // Fetched in order and stopped at the failing id — the loop never moves
    // on to try caching before fetching the next one.
    expect(fetchedIds).toEqual(["LA1_3", "LA1_2", "LA1_1"]);
    // The first two are cached individually (finding A: no batched
    // cacheMatches at the end of the loop that a mid-way failure would
    // discard entirely).
    expect(polling.cachedCalls).toEqual([
      [expect.objectContaining({ matchId: "LA1_3" })],
      [expect.objectContaining({ matchId: "LA1_2" })],
    ]);
    expect(result).toEqual({ kind: "failed", cause: "provider", status: 500 });
  });

  it("skips ids already cached in [startTime, now], on every poll — not only during a backfill", async () => {
    const priorState: PollState = {
      puuid: TARGET.puuid,
      lastMatchId: "LA1_2",
      lastPolledAt: new Date("2026-09-16T11:00:00Z"),
      nextPollAfter: new Date("2026-09-16T11:15:00Z"),
      failureCount: 0,
      // Equal to the challenge's own startsAt: this poll does not need a
      // backward pass at all, yet the cache-aware skip still applies.
      coveredFrom: WINDOW.startsAt,
    };
    const fetchedIds: string[] = [];
    const provider = fakeMatchProvider({
      listMatchIds: async () => ["LA1_4", "LA1_3", "LA1_2"],
      fetchMatch: async (matchId, puuid) => {
        fetchedIds.push(matchId);
        return aMatch({ matchId, puuid, playedAt: WINDOW.startsAt });
      },
    });
    const challenges = fakeChallenges([aChallenge()]);
    const alreadyCached = [aMatch({ matchId: "LA1_3", puuid: TARGET.puuid, playedAt: WINDOW.startsAt })];
    const polling = fakePolling({
      state: priorState,
      listCached: async (_puuid, from, to) =>
        alreadyCached.filter((m) => m.playedAt >= from && m.playedAt <= to),
    });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    // LA1_4 and LA1_3 are both newer than lastMatchId ("LA1_2"), but LA1_3
    // is already cached, so only LA1_4 is actually fetched.
    expect(fetchedIds).toEqual(["LA1_4"]);
    expect(polling.cachedCalls).toEqual([[expect.objectContaining({ matchId: "LA1_4" })]]);
    expect(result).toEqual({ kind: "polled", newMatches: 1, challengesUpdated: 1 });
  });
});

describe("idle backoff measures elapsed time since the last poll", () => {
  it("doubles the elapsed time, not the stale lease left in nextPollAfter", async () => {
    const state: PollState = {
      puuid: TARGET.puuid,
      lastMatchId: "LA1_2",
      // enqueueDuePlayers overwrote nextPollAfter with the lease boundary
      // before this poll ran; if nextPollAfter's gap were still doubled,
      // this 30-minute lease value — not the 2h actually elapsed — is what
      // would get doubled.
      lastPolledAt: new Date("2026-09-16T10:00:00Z"),
      nextPollAfter: new Date("2026-09-16T10:30:00Z"),
      failureCount: 0,
      coveredFrom: WINDOW.startsAt,
    };
    const provider = fakeMatchProvider({ listMatchIds: async () => ["LA1_2", "LA1_1"] });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state, listCached: async () => [] });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    await poll(TARGET);

    // elapsed = NOW (12:00) - lastPolledAt (10:00) = 2h; idle doubles it.
    expect(polling.savedStates[0]?.nextPollAfter).toEqual(
      nextPollAfter(NOW, { kind: "polled", newMatches: 0, previousIntervalMs: 2 * 60 * 60 * 1000 }),
    );
  });

  it("floors at the minimum interval when the elapsed time was short", async () => {
    const state: PollState = {
      puuid: TARGET.puuid,
      lastMatchId: "LA1_2",
      lastPolledAt: new Date("2026-09-16T11:58:00Z"), // 2 minutes before NOW
      nextPollAfter: new Date("2026-09-16T12:13:00Z"),
      failureCount: 0,
      coveredFrom: WINDOW.startsAt,
    };
    const provider = fakeMatchProvider({ listMatchIds: async () => ["LA1_2", "LA1_1"] });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state, listCached: async () => [] });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    await poll(TARGET);

    expect(polling.savedStates[0]?.nextPollAfter).toEqual(
      new Date(NOW.getTime() + MIN_IDLE_POLL_INTERVAL_MS),
    );
  });

  it("caps at 6 hours when the player has been idle a long time", async () => {
    const state: PollState = {
      puuid: TARGET.puuid,
      lastMatchId: "LA1_2",
      lastPolledAt: new Date("2026-09-16T02:00:00Z"), // 10h before NOW
      nextPollAfter: new Date("2026-09-16T02:15:00Z"),
      failureCount: 0,
      coveredFrom: WINDOW.startsAt,
    };
    const provider = fakeMatchProvider({ listMatchIds: async () => ["LA1_2", "LA1_1"] });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state, listCached: async () => [] });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    await poll(TARGET);

    expect(polling.savedStates[0]?.nextPollAfter).toEqual(new Date(NOW.getTime() + POLL_INTERVAL_CAP_MS));
  });

  it("has nothing to double on the very first poll ever, so it starts at the floor", async () => {
    const provider = fakeMatchProvider({ listMatchIds: async () => [] });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: null });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    await poll(TARGET);

    expect(polling.savedStates[0]?.nextPollAfter).toEqual(
      new Date(NOW.getTime() + MIN_IDLE_POLL_INTERVAL_MS),
    );
  });
});

describe("no active challenges", () => {
  it("reschedules 6 hours out without calling the provider", async () => {
    const challenges = fakeChallenges([]);
    let providerRequested = false;
    const polling = fakePolling({ state: null });
    const poll = pollPlayer({
      polling,
      challenges,
      matchProviderFor: () => {
        providerRequested = true;
        throw new Error("must not be called when there are no active challenges");
      },
      now: () => NOW,
    });

    const result = await poll(TARGET);

    expect(result).toEqual({ kind: "no_active_challenges" });
    expect(providerRequested).toBe(false);
    expect(polling.savedStates).toEqual([
      {
        puuid: TARGET.puuid,
        lastMatchId: null,
        lastPolledAt: NOW,
        nextPollAfter: new Date(NOW.getTime() + POLL_INTERVAL_CAP_MS),
        failureCount: 0,
        coveredFrom: null,
      },
    ]);
  });

  it("keeps whatever state already existed, only moving lastPolledAt and nextPollAfter", async () => {
    const challenges = fakeChallenges([]);
    const polling = fakePolling({
      state: {
        puuid: TARGET.puuid,
        lastMatchId: "LA1_9",
        lastPolledAt: new Date("2026-09-15T00:00:00Z"),
        nextPollAfter: new Date("2026-09-16T00:00:00Z"),
        failureCount: 2,
        coveredFrom: new Date("2026-09-10T00:00:00Z"),
      },
    });
    const poll = pollPlayer({
      polling,
      challenges,
      matchProviderFor: () => {
        throw new Error("must not be called");
      },
      now: () => NOW,
    });

    await poll(TARGET);

    expect(polling.savedStates).toEqual([
      {
        puuid: TARGET.puuid,
        lastMatchId: "LA1_9",
        lastPolledAt: NOW,
        nextPollAfter: new Date(NOW.getTime() + POLL_INTERVAL_CAP_MS),
        failureCount: 2,
        coveredFrom: new Date("2026-09-10T00:00:00Z"),
      },
    ]);
  });
});

describe("provider failure", () => {
  it("increments failureCount and backs off, without touching cached matches or progress", async () => {
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({
      state: {
        puuid: TARGET.puuid,
        lastMatchId: "LA1_2",
        lastPolledAt: new Date("2026-09-16T11:00:00Z"),
        nextPollAfter: new Date("2026-09-16T11:15:00Z"),
        failureCount: 1,
        coveredFrom: WINDOW.startsAt,
      },
    });
    const provider = fakeMatchProvider({
      listMatchIds: async () => {
        throw new MatchProviderError(500);
      },
    });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    expect(result).toEqual({ kind: "failed", cause: "provider", status: 500 });
    expect(polling.cachedCalls).toEqual([]);
    expect(challenges.savedProgress).toEqual([]);
    expect(polling.savedStates).toEqual([
      {
        puuid: TARGET.puuid,
        lastMatchId: "LA1_2",
        lastPolledAt: NOW,
        nextPollAfter: nextPollAfter(NOW, { kind: "failed", failureCount: 2 }),
        failureCount: 2,
        coveredFrom: WINDOW.startsAt,
      },
    ]);
  });

  it("fails a match fetch the same way it fails a list-ids call", async () => {
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: null });
    const provider = fakeMatchProvider({
      listMatchIds: async () => ["LA1_1"],
      fetchMatch: async () => {
        throw new MatchProviderError(429);
      },
    });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    expect(result).toEqual({ kind: "failed", cause: "provider", status: 429 });
  });
});

describe("unexpected failure", () => {
  it("backs off for a non-MatchProviderError from the provider, without leaking the message", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const challenges = fakeChallenges([aChallenge()]);
      const polling = fakePolling({ state: null });
      const provider = fakeMatchProvider({
        listMatchIds: async () => {
          throw new Error("some internal detail nobody outside should see");
        },
      });
      const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

      const result = await poll(TARGET);

      expect(result).toEqual({ kind: "failed", cause: "unexpected" });
      expect(errorSpy).toHaveBeenCalledWith("poll-player: unexpected failure", { puuid: TARGET.puuid });
      const loggedArgs = errorSpy.mock.calls[0];
      expect(JSON.stringify(loggedArgs)).not.toContain("internal detail");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("backs off when listCached throws, e.g. a corrupt cache row", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const priorState: PollState = {
        puuid: TARGET.puuid,
        lastMatchId: "LA1_2",
        lastPolledAt: new Date("2026-09-16T11:00:00Z"),
        nextPollAfter: new Date("2026-09-16T11:15:00Z"),
        failureCount: 0,
        coveredFrom: WINDOW.startsAt,
      };
      const challenges = fakeChallenges([aChallenge()]);
      const polling = fakePolling({
        state: priorState,
        listCached: async () => {
          throw new Error("corrupt cache row");
        },
      });
      const provider = fakeMatchProvider({ listMatchIds: async () => [] });
      const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

      const result = await poll(TARGET);

      expect(result).toEqual({ kind: "failed", cause: "unexpected" });
      expect(polling.savedStates).toEqual([
        {
          puuid: TARGET.puuid,
          lastMatchId: "LA1_2",
          lastPolledAt: NOW,
          nextPollAfter: nextPollAfter(NOW, { kind: "failed", failureCount: 1 }),
          failureCount: 1,
          coveredFrom: WINDOW.startsAt,
        },
      ]);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("backs off when listActiveForAccount throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const challenges: ChallengeRepository = {
        ...fakeChallenges([]),
        async listActiveForAccount() {
          throw new Error("db unavailable");
        },
      };
      const polling = fakePolling({ state: null });
      const poll = pollPlayer({
        polling,
        challenges,
        matchProviderFor: () => {
          throw new Error("must not be called");
        },
        now: () => NOW,
      });

      const result = await poll(TARGET);

      expect(result).toEqual({ kind: "failed", cause: "unexpected" });
      expect(polling.savedStates).toEqual([
        {
          puuid: TARGET.puuid,
          lastMatchId: null,
          lastPolledAt: NOW,
          nextPollAfter: nextPollAfter(NOW, { kind: "failed", failureCount: 1 }),
          failureCount: 1,
          coveredFrom: null,
        },
      ]);
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe("backfilling to an earlier startTime (coveredFrom)", () => {
  it("first poll sets coveredFrom to the earliest active challenge's start", async () => {
    const early = aChallenge({
      id: "challenge-early",
      startsAt: new Date("2026-09-10T00:00:00Z"),
      endsAt: WINDOW.endsAt,
    });
    const provider = fakeMatchProvider({ listMatchIds: async () => [] });
    const challenges = fakeChallenges([early]);
    const polling = fakePolling({ state: null });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    await poll(TARGET);

    expect(polling.savedStates[0]?.coveredFrom).toEqual(early.startsAt);
  });

  it("still stops the forward pass at lastMatchId, but runs a backward pass with endTime = the previous coveredFrom, lowering coverage", async () => {
    const previousCoveredFrom = new Date("2026-09-15T00:00:00Z");
    const priorState: PollState = {
      puuid: TARGET.puuid,
      lastMatchId: "LA1_20",
      lastPolledAt: new Date("2026-09-16T11:00:00Z"),
      nextPollAfter: new Date("2026-09-16T11:15:00Z"),
      failureCount: 0,
      coveredFrom: previousCoveredFrom,
    };
    // Joining this challenge moves startTime earlier than what was covered
    // so far (needsBackfill), triggering a backward pass — the forward
    // pass's own boundary (lastMatchId) is untouched by that.
    const early = aChallenge({
      id: "challenge-early",
      startsAt: new Date("2026-09-05T00:00:00Z"),
      endsAt: WINDOW.endsAt,
    });
    const forwardPage = ["LA1_25", "LA1_24", "LA1_20", "LA1_19"]; // contains the boundary
    const backwardPage = ["LA1_9", "LA1_8"]; // short: the backward pass completes in one page
    const seenOptions: Array<{ count?: number; start?: number; startTime?: Date; endTime?: Date }> = [];
    const fetchedIds: string[] = [];
    const provider = fakeMatchProvider({
      listMatchIds: async (_puuid, options) => {
        seenOptions.push(options ?? {});
        return options?.endTime ? backwardPage : forwardPage;
      },
      fetchMatch: async (matchId, puuid) => {
        fetchedIds.push(matchId);
        return aMatch({ matchId, puuid, playedAt: WINDOW.startsAt });
      },
    });
    const challenges = fakeChallenges([early]);
    const polling = fakePolling({ state: priorState, listCached: async () => [] });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    // Forward pass: stops before LA1_20 (the boundary), same as a normal
    // poll — it never pages past it, backfill or not.
    expect(fetchedIds).toEqual(expect.arrayContaining(["LA1_25", "LA1_24"]));
    expect(fetchedIds).not.toContain("LA1_19");
    // Backward pass: paged with startTime = the challenge's own start and
    // endTime = the coverage boundary that already existed.
    expect(seenOptions).toContainEqual(
      expect.objectContaining({ startTime: early.startsAt, endTime: previousCoveredFrom }),
    );
    expect(fetchedIds).toEqual(expect.arrayContaining(["LA1_9", "LA1_8"]));
    expect(result).toMatchObject({ kind: "polled", newMatches: 4 });
    // The backward pass completed (a short page), so coverage reaches all
    // the way to startTime — lower (earlier) than the previous coveredFrom.
    expect(polling.savedStates[0]?.coveredFrom).toEqual(early.startsAt);
  });

  it("resumes a truncated first-poll backfill on the next poll, via endTime, until coverage reaches startTime", async () => {
    const startTime = new Date("2026-08-01T00:00:00Z");
    const early = aChallenge({ id: "challenge-early", startsAt: startTime, endsAt: WINDOW.endsAt });
    const challenges = fakeChallenges([early]);

    // First poll ever: 5 full pages (MAX_PAGES * PAGE_SIZE = 100 ids), never
    // a short page, so the pass is truncated before reaching startTime.
    const pages = Array.from({ length: MAX_PAGES }, (_, page) =>
      Array.from({ length: PAGE_SIZE }, (_, i) => `LA1_${1000 - (page * PAGE_SIZE + i)}`),
    );
    const seenStarts: number[] = [];
    let cursor = 0;
    const BASE = new Date("2026-09-16T00:00:00Z");
    const provider1 = fakeMatchProvider({
      listMatchIds: async (_puuid, options) => {
        seenStarts.push(options?.start ?? 0);
        return pages[seenStarts.length - 1] ?? [];
      },
      fetchMatch: async (matchId, puuid) => {
        // Strictly decreasing playedAt, oldest for the last id fetched —
        // fetch order here runs newest to oldest, same as Riot's paging.
        const playedAt = new Date(BASE.getTime() - cursor * 60_000);
        cursor += 1;
        return aMatch({ matchId, puuid, playedAt });
      },
    });
    const polling1 = fakePolling({ state: null, listCached: async () => [] });
    const poll1 = pollPlayer({
      polling: polling1,
      challenges,
      matchProviderFor: () => provider1,
      now: () => NOW,
    });

    const result1 = await poll1(TARGET);

    expect(result1).toMatchObject({ kind: "polled", newMatches: MAX_PAGES * PAGE_SIZE });
    const coveredFromAfterPoll1 = polling1.savedStates[0]?.coveredFrom ?? null;
    // Truncated: coverage did not reach startTime, only as far as the
    // oldest match actually fetched (the 100th, cursor = 99).
    expect(coveredFromAfterPoll1).toEqual(new Date(BASE.getTime() - 99 * 60_000));
    expect(coveredFromAfterPoll1?.getTime()).toBeGreaterThan(startTime.getTime());

    // Second poll: resumes the backfill via endTime = coveredFromAfterPoll1.
    const remaining = Array.from({ length: 20 }, (_, i) => `LA1_R${i}`);
    const backwardCalls: Array<{ start?: number; startTime?: Date; endTime?: Date }> = [];
    const provider2 = fakeMatchProvider({
      listMatchIds: async (_puuid, options) => {
        if (options?.endTime) {
          backwardCalls.push(options);
          // First backward page is full (no boundary to stop it — endTime
          // bounds the pass, not a match id); the second, empty, ends it.
          return backwardCalls.length === 1 ? remaining : [];
        }
        // Forward pass: the newest id is unchanged since poll 1, so the
        // boundary is found immediately — nothing new from this pass.
        return pages[0]!;
      },
      fetchMatch: async (matchId, puuid) => aMatch({ matchId, puuid, playedAt: NOW }),
    });
    const priorState2: PollState = {
      puuid: TARGET.puuid,
      lastMatchId: pages[0]![0]!,
      lastPolledAt: NOW,
      nextPollAfter: NOW,
      failureCount: 0,
      coveredFrom: coveredFromAfterPoll1,
    };
    const polling2 = fakePolling({ state: priorState2, listCached: async () => [] });
    const poll2 = pollPlayer({
      polling: polling2,
      challenges,
      matchProviderFor: () => provider2,
      now: () => NOW,
    });

    const result2 = await poll2(TARGET);

    expect(backwardCalls).toHaveLength(2);
    expect(backwardCalls[0]).toMatchObject({ startTime, endTime: coveredFromAfterPoll1 });
    expect(result2).toMatchObject({ kind: "polled", newMatches: 20 });
    // The backward pass now completed (an empty second page): coverage
    // finally reaches all the way back to startTime.
    expect(polling2.savedStates[0]?.coveredFrom).toEqual(startTime);
  });

  it("a normal poll, with coverage already complete, never sends endTime", async () => {
    const priorState: PollState = {
      puuid: TARGET.puuid,
      lastMatchId: "LA1_2",
      lastPolledAt: new Date("2026-09-16T11:00:00Z"),
      nextPollAfter: new Date("2026-09-16T11:15:00Z"),
      failureCount: 0,
      coveredFrom: WINDOW.startsAt, // same as aChallenge()'s default startsAt: nothing to backfill
    };
    const seenOptions: Array<{ endTime?: Date }> = [];
    const provider = fakeMatchProvider({
      listMatchIds: async (_puuid, options) => {
        seenOptions.push(options ?? {});
        return ["LA1_4", "LA1_3", "LA1_2"];
      },
    });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: priorState });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    await poll(TARGET);

    expect(seenOptions.length).toBeGreaterThan(0);
    for (const options of seenOptions) expect(options.endTime).toBeUndefined();
  });

  it("still stops paging at lastMatchId when startTime is not earlier than coveredFrom", async () => {
    const priorState: PollState = {
      puuid: TARGET.puuid,
      lastMatchId: "LA1_2",
      lastPolledAt: new Date("2026-09-16T11:00:00Z"),
      nextPollAfter: new Date("2026-09-16T11:15:00Z"),
      failureCount: 0,
      coveredFrom: WINDOW.startsAt, // same as aChallenge()'s default startsAt
    };
    const ids = ["LA1_4", "LA1_3", "LA1_2", "LA1_1"];
    const fetchedIds: string[] = [];
    const provider = fakeMatchProvider({
      listMatchIds: async () => ids,
      fetchMatch: async (matchId, puuid) => {
        fetchedIds.push(matchId);
        return aMatch({ matchId, puuid, playedAt: WINDOW.startsAt });
      },
    });
    const challenges = fakeChallenges([aChallenge()]);
    const polling = fakePolling({ state: priorState });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    expect(fetchedIds).toEqual(["LA1_4", "LA1_3"]);
    expect(result).toEqual({ kind: "polled", newMatches: 2, challengesUpdated: 1 });
    expect(polling.savedStates[0]?.coveredFrom).toEqual(WINDOW.startsAt);
  });

  it("does not re-fetch ids already in the cache during a backfill", async () => {
    const priorState: PollState = {
      puuid: TARGET.puuid,
      lastMatchId: "LA1_5",
      lastPolledAt: new Date("2026-09-16T11:00:00Z"),
      nextPollAfter: new Date("2026-09-16T11:15:00Z"),
      failureCount: 0,
      coveredFrom: new Date("2026-09-15T00:00:00Z"),
    };
    const early = aChallenge({
      id: "challenge-early",
      startsAt: new Date("2026-09-05T00:00:00Z"),
      endsAt: WINDOW.endsAt,
    });
    const ids = ["LA1_7", "LA1_6", "LA1_5", "LA1_4"];
    // LA1_6 and LA1_5 are already cached from earlier, narrower polls —
    // paging past lastMatchId as a backfill would otherwise re-fetch them.
    const alreadyCached = [
      aMatch({ matchId: "LA1_6", puuid: TARGET.puuid, playedAt: WINDOW.startsAt }),
      aMatch({ matchId: "LA1_5", puuid: TARGET.puuid, playedAt: WINDOW.startsAt }),
    ];
    const fetchedIds: string[] = [];
    const provider = fakeMatchProvider({
      listMatchIds: async () => ids,
      fetchMatch: async (matchId, puuid) => {
        fetchedIds.push(matchId);
        return aMatch({ matchId, puuid, playedAt: WINDOW.startsAt });
      },
    });
    const challenges = fakeChallenges([early]);
    const polling = fakePolling({
      state: priorState,
      listCached: async (_puuid, from, to) =>
        alreadyCached.filter((m) => m.playedAt >= from && m.playedAt <= to),
    });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    await poll(TARGET);

    expect(fetchedIds).toEqual(["LA1_7", "LA1_4"]);
  });
});

describe("progress", () => {
  it("saves progress once per active challenge, matching what evaluate() computes", async () => {
    const winThree = aChallenge({
      id: "challenge-win",
      rules: [{ target: 3, criteria: [{ kind: "won" }] }],
    });
    const playOne = aChallenge({ id: "challenge-play", rules: [{ target: 1, criteria: [] }] });
    const cachedMatches = [
      aMatch({ matchId: "LA1_1", puuid: TARGET.puuid, win: true, playedAt: WINDOW.startsAt }),
      aMatch({ matchId: "LA1_2", puuid: TARGET.puuid, win: false, playedAt: WINDOW.startsAt }),
    ];
    const challenges = fakeChallenges([winThree, playOne]);
    const polling = fakePolling({ state: null, listCached: async () => cachedMatches });
    const provider = fakeMatchProvider({ listMatchIds: async () => [] });
    const poll = pollPlayer({ polling, challenges, matchProviderFor: () => provider, now: () => NOW });

    const result = await poll(TARGET);

    expect(result).toEqual({ kind: "polled", newMatches: 0, challengesUpdated: 2 });
    expect(challenges.savedProgress).toEqual([
      {
        challengeId: "challenge-win",
        riotAccountId: TARGET.riotAccountId,
        progress: evaluate(winThree.rules, cachedMatches, WINDOW),
      },
      {
        challengeId: "challenge-play",
        riotAccountId: TARGET.riotAccountId,
        progress: evaluate(playOne.rules, cachedMatches, WINDOW),
      },
    ]);
  });
});
