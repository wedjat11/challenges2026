import { describe, expect, it } from "vitest";

import {
  FAILURE_BASE_INTERVAL_MS,
  LEASE_DURATION_MS,
  MIN_IDLE_POLL_INTERVAL_MS,
  NEW_MATCH_POLL_INTERVAL_MS,
  PAGE_SIZE,
  POLL_INTERVAL_CAP_MS,
  collectNewIds,
  idsNewerThan,
  leaseUntil,
  needsBackfill,
  nextCoveredFrom,
  nextPollAfter,
} from "@/domain/polling";

describe("idsNewerThan", () => {
  it("returns everything before the last seen id, ids being newest first", () => {
    const ids = ["LA1_5", "LA1_4", "LA1_3", "LA1_2", "LA1_1"];
    expect(idsNewerThan(ids, "LA1_3")).toEqual(["LA1_5", "LA1_4"]);
  });

  it("returns every id when there is no last seen id", () => {
    const ids = ["LA1_2", "LA1_1"];
    expect(idsNewerThan(ids, null)).toEqual(ids);
  });

  it("returns every id when the last seen id is not in the list", () => {
    // Either it fell outside the fetched page, or polling never saw it — in
    // both cases nothing here can safely be treated as already counted.
    const ids = ["LA1_9", "LA1_8"];
    expect(idsNewerThan(ids, "LA1_1")).toEqual(ids);
  });

  it("returns nothing when the last seen id is the newest one", () => {
    const ids = ["LA1_3", "LA1_2", "LA1_1"];
    expect(idsNewerThan(ids, "LA1_3")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const ids = ["LA1_2", "LA1_1"];
    idsNewerThan(ids, null);
    expect(ids).toEqual(["LA1_2", "LA1_1"]);
  });
});

describe("collectNewIds", () => {
  it("takes the ids before the boundary and stops when lastMatchId is found in the page", () => {
    const page = ["LA1_25", "LA1_24", "LA1_23", "LA1_10", "LA1_9"];
    expect(collectNewIds(page, "LA1_10")).toEqual({
      newIds: ["LA1_25", "LA1_24", "LA1_23"],
      done: true,
    });
  });

  it("takes the whole page and stops when Riot returns fewer than a full page", () => {
    const page = ["LA1_5", "LA1_4", "LA1_3"];
    expect(collectNewIds(page, "LA1_999")).toEqual({ newIds: page, done: true });
  });

  it("takes the whole page and keeps paging when the page is full and the boundary was not found", () => {
    const page = Array.from({ length: PAGE_SIZE }, (_, i) => `LA1_${PAGE_SIZE - i}`);
    expect(collectNewIds(page, "LA1_999")).toEqual({ newIds: page, done: false });
  });

  it("takes the whole first page and keeps paging when there is no lastMatchId yet and the page is full", () => {
    const page = Array.from({ length: PAGE_SIZE }, (_, i) => `LA1_${PAGE_SIZE - i}`);
    expect(collectNewIds(page, null)).toEqual({ newIds: page, done: false });
  });

  it("takes the whole page and stops when there is no lastMatchId and the page is short", () => {
    const page = ["LA1_2", "LA1_1"];
    expect(collectNewIds(page, null)).toEqual({ newIds: page, done: true });
  });
});

const now = new Date("2026-09-18T12:00:00Z");

describe("nextPollAfter — new matches", () => {
  it("schedules 15 minutes out, regardless of the previous interval", () => {
    const result = nextPollAfter(now, {
      kind: "polled",
      newMatches: 3,
      previousIntervalMs: POLL_INTERVAL_CAP_MS,
    });
    expect(result).toEqual(new Date(now.getTime() + NEW_MATCH_POLL_INTERVAL_MS));
  });
});

describe("nextPollAfter — idle", () => {
  it("starts at the floor when there is no previous interval", () => {
    const result = nextPollAfter(now, {
      kind: "polled",
      newMatches: 0,
      previousIntervalMs: null,
    });
    expect(result).toEqual(new Date(now.getTime() + MIN_IDLE_POLL_INTERVAL_MS));
  });

  it("doubles the previous interval", () => {
    const result = nextPollAfter(now, {
      kind: "polled",
      newMatches: 0,
      previousIntervalMs: 30 * 60 * 1000,
    });
    expect(result).toEqual(new Date(now.getTime() + 60 * 60 * 1000));
  });

  it("never drops below the floor even if the previous interval was shorter", () => {
    const result = nextPollAfter(now, {
      kind: "polled",
      newMatches: 0,
      previousIntervalMs: 60 * 1000,
    });
    expect(result).toEqual(new Date(now.getTime() + MIN_IDLE_POLL_INTERVAL_MS));
  });

  it("caps at 6 hours however long the idle streak", () => {
    const result = nextPollAfter(now, {
      kind: "polled",
      newMatches: 0,
      previousIntervalMs: 5 * 60 * 60 * 1000,
    });
    expect(result).toEqual(new Date(now.getTime() + POLL_INTERVAL_CAP_MS));
  });

  it("follows the documented growth sequence", () => {
    // 15 -> 30 -> 60 -> 120 -> 240 -> capped at 360 (6h), each minutes.
    const minutes = (n: number) => n * 60 * 1000;
    let previousIntervalMs: number | null = null;
    const observed: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const scheduled = nextPollAfter(now, { kind: "polled", newMatches: 0, previousIntervalMs });
      const intervalMs = scheduled.getTime() - now.getTime();
      observed.push(intervalMs / minutes(1));
      previousIntervalMs = intervalMs;
    }
    expect(observed).toEqual([15, 30, 60, 120, 240, 360]);
  });
});

describe("nextPollAfter — failed", () => {
  it("waits the base interval after the first failure", () => {
    const result = nextPollAfter(now, { kind: "failed", failureCount: 1 });
    expect(result).toEqual(new Date(now.getTime() + FAILURE_BASE_INTERVAL_MS));
  });

  it("doubles per additional consecutive failure", () => {
    const result = nextPollAfter(now, { kind: "failed", failureCount: 3 });
    expect(result).toEqual(new Date(now.getTime() + FAILURE_BASE_INTERVAL_MS * 4));
  });

  it("caps at 6 hours however many failures in a row", () => {
    const result = nextPollAfter(now, { kind: "failed", failureCount: 20 });
    expect(result).toEqual(new Date(now.getTime() + POLL_INTERVAL_CAP_MS));
  });
});

describe("leaseUntil", () => {
  it("is 60 minutes out", () => {
    // Pinned explicitly, not just against the constant: a first poll or
    // backfill can now cost far more than the old 21-calls-per-player
    // assumption (see LEASE_DURATION_MS's doc comment), so this number is
    // load-bearing and a silent regression here should fail this test.
    expect(LEASE_DURATION_MS).toBe(60 * 60 * 1000);
    expect(leaseUntil(now)).toEqual(new Date(now.getTime() + LEASE_DURATION_MS));
  });
});

describe("needsBackfill", () => {
  it("is true when nothing has ever been fetched", () => {
    expect(needsBackfill(null, now)).toBe(true);
  });

  it("is true when startTime is earlier than what was already covered", () => {
    const coveredFrom = new Date("2026-09-15T00:00:00Z");
    const startTime = new Date("2026-09-10T00:00:00Z");
    expect(needsBackfill(coveredFrom, startTime)).toBe(true);
  });

  it("is false when startTime is exactly what was already covered", () => {
    const coveredFrom = new Date("2026-09-10T00:00:00Z");
    expect(needsBackfill(coveredFrom, coveredFrom)).toBe(false);
  });

  it("is false when startTime is later than what was already covered", () => {
    const coveredFrom = new Date("2026-09-10T00:00:00Z");
    const startTime = new Date("2026-09-15T00:00:00Z");
    expect(needsBackfill(coveredFrom, startTime)).toBe(false);
  });
});

describe("nextCoveredFrom", () => {
  const startTime = new Date("2026-09-10T00:00:00Z");

  it("reaches startTime when the backward pass completed", () => {
    const previous = new Date("2026-09-15T00:00:00Z");
    const result = nextCoveredFrom({
      completed: true,
      // Ignored when completed: a completed pass reached startTime itself,
      // regardless of what the oldest individual match happened to be.
      oldestFetchedAt: new Date("2026-09-12T00:00:00Z"),
      startTime,
      previous,
    });
    expect(result).toEqual(startTime);
  });

  it("advances only to the oldest match actually fetched when the pass was truncated", () => {
    const previous = new Date("2026-09-15T00:00:00Z");
    const oldestFetchedAt = new Date("2026-09-12T00:00:00Z"); // between startTime and previous
    const result = nextCoveredFrom({ completed: false, oldestFetchedAt, startTime, previous });
    expect(result).toEqual(oldestFetchedAt);
  });

  it("keeps the previous coverage when a truncated pass fetched nothing", () => {
    // Every id the pass paged through was already cached — see
    // poll-player.ts, which resolves oldestFetchedAt from the cache in that
    // case rather than passing null outright.
    const previous = new Date("2026-09-15T00:00:00Z");
    const result = nextCoveredFrom({ completed: false, oldestFetchedAt: null, startTime, previous });
    expect(result).toEqual(previous);
  });

  it("falls back to startTime when a truncated pass fetched nothing and there is no previous coverage", () => {
    const result = nextCoveredFrom({ completed: false, oldestFetchedAt: null, startTime, previous: null });
    expect(result).toEqual(startTime);
  });

  it("never regresses past previous coverage, as a safety net", () => {
    // Should never happen from a real pass — a completed pass only runs
    // when startTime is earlier than previous (see needsBackfill) — but the
    // pure function enforces the invariant itself rather than trusting
    // every caller to.
    const previous = new Date("2026-09-05T00:00:00Z"); // already deeper than startTime
    const result = nextCoveredFrom({ completed: true, oldestFetchedAt: null, startTime, previous });
    expect(result).toEqual(previous);
  });
});
