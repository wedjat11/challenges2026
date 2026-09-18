import { describe, expect, it } from "vitest";

import { enqueueDuePlayers } from "@/application/enqueue-due-players";
import { leaseUntil } from "@/domain/polling";
import type { MatchSummary } from "@/domain/match";
import type { PollMessage, PollQueue } from "@/domain/ports/poll-queue";
import type { PollState, PollTarget, PollingRepository } from "@/domain/ports/polling-repository";

const NOW = new Date("2026-09-16T12:00:00Z");

/** In-memory stand-in for the adapter: `listDue` is scripted per test, state lives in a Map. */
function fakePolling(listDue: PollingRepository["listDue"]): PollingRepository & {
  states: Map<string, PollState>;
} {
  const states = new Map<string, PollState>();
  return {
    states,
    listDue,
    async getState(puuid: string) {
      return states.get(puuid) ?? null;
    },
    async saveState(state: PollState) {
      states.set(state.puuid, state);
    },
    async cacheMatches(): Promise<void> {
      throw new Error("not used by enqueueDuePlayers");
    },
    async listCached(): Promise<MatchSummary[]> {
      throw new Error("not used by enqueueDuePlayers");
    },
  };
}

function fakeQueue(): PollQueue & { sent: PollMessage[][] } {
  const sent: PollMessage[][] = [];
  return {
    sent,
    async send(messages: PollMessage[]) {
      sent.push(messages);
    },
  };
}

const targets: PollTarget[] = [
  { puuid: "puuid-1", riotAccountId: "account-1", platform: "la1" },
  { puuid: "puuid-2", riotAccountId: "account-2", platform: "na1" },
];

describe("enqueueDuePlayers", () => {
  it("enqueues one message per due player", async () => {
    const polling = fakePolling(async () => targets);
    const queue = fakeQueue();

    const result = await enqueueDuePlayers({ polling, queue, now: () => NOW });

    expect(result).toEqual({ enqueued: 2 });
    expect(queue.sent).toEqual([
      [
        { kind: "poll-player", puuid: "puuid-1", riotAccountId: "account-1", platform: "la1" },
        { kind: "poll-player", puuid: "puuid-2", riotAccountId: "account-2", platform: "na1" },
      ],
    ]);
  });

  it("leases a player who had no prior state", async () => {
    const polling = fakePolling(async () => [targets[0]!]);
    const queue = fakeQueue();

    await enqueueDuePlayers({ polling, queue, now: () => NOW });

    expect(await polling.getState("puuid-1")).toEqual({
      puuid: "puuid-1",
      lastMatchId: null,
      lastPolledAt: null,
      nextPollAfter: leaseUntil(NOW),
      failureCount: 0,
      coveredFrom: null,
    });
  });

  it("keeps a leased player's other state fields, including coveredFrom, only pushing nextPollAfter out", async () => {
    const polling = fakePolling(async () => [targets[0]!]);
    polling.states.set("puuid-1", {
      puuid: "puuid-1",
      lastMatchId: "LA1_5",
      lastPolledAt: new Date("2026-09-16T10:00:00Z"),
      nextPollAfter: new Date("2026-09-16T11:00:00Z"),
      failureCount: 2,
      coveredFrom: new Date("2026-09-10T00:00:00Z"),
    });
    const queue = fakeQueue();

    await enqueueDuePlayers({ polling, queue, now: () => NOW });

    expect(await polling.getState("puuid-1")).toEqual({
      puuid: "puuid-1",
      lastMatchId: "LA1_5",
      lastPolledAt: new Date("2026-09-16T10:00:00Z"),
      nextPollAfter: leaseUntil(NOW),
      failureCount: 2,
      coveredFrom: new Date("2026-09-10T00:00:00Z"),
    });
  });

  it("sends nothing and enqueues nothing when no player is due", async () => {
    const polling = fakePolling(async () => []);
    const queue = fakeQueue();

    const result = await enqueueDuePlayers({ polling, queue, now: () => NOW });

    expect(result).toEqual({ enqueued: 0 });
    expect(queue.sent).toEqual([]);
  });

  it("defaults the batch size to 10", async () => {
    let seenLimit: number | undefined;
    const polling = fakePolling(async (_now, limit) => {
      seenLimit = limit;
      return [];
    });

    await enqueueDuePlayers({ polling, queue: fakeQueue(), now: () => NOW });

    expect(seenLimit).toBe(10);
  });

  it("passes an explicit batch size through to listDue", async () => {
    let seenLimit: number | undefined;
    const polling = fakePolling(async (_now, limit) => {
      seenLimit = limit;
      return [];
    });

    await enqueueDuePlayers({ polling, queue: fakeQueue(), now: () => NOW, batchSize: 5 });

    expect(seenLimit).toBe(5);
  });

  it("leaves players leased and propagates the error when queue.send rejects", async () => {
    // Intended behaviour, not a gap: the lease was already saved before
    // send() was called, so a failed send does not strand the player
    // unleased and re-enqueued next tick. It simply stays leased until the
    // lease expires on its own (LEASE_DURATION_MS, see polling.ts), and the
    // next cron tick retries it then — there is nothing else to compensate.
    const polling = fakePolling(async () => targets);
    const queue: PollQueue = {
      async send() {
        throw new Error("queue unavailable");
      },
    };

    await expect(enqueueDuePlayers({ polling, queue, now: () => NOW })).rejects.toThrow(
      "queue unavailable",
    );

    expect(await polling.getState("puuid-1")).toEqual({
      puuid: "puuid-1",
      lastMatchId: null,
      lastPolledAt: null,
      nextPollAfter: leaseUntil(NOW),
      failureCount: 0,
      coveredFrom: null,
    });
    expect(await polling.getState("puuid-2")).toEqual({
      puuid: "puuid-2",
      lastMatchId: null,
      lastPolledAt: null,
      nextPollAfter: leaseUntil(NOW),
      failureCount: 0,
      coveredFrom: null,
    });
  });
});
