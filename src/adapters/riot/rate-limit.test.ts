import { describe, expect, it } from "vitest";

import { headroom, parseRateLimit, retryAfterMs } from "@/adapters/riot/rate-limit";

describe("parsing Riot's rate limit headers", () => {
  it("reads a single bucket", () => {
    expect(parseRateLimit("500:10")).toEqual([{ limit: 500, windowSeconds: 10 }]);
  });

  it("reads the several buckets a personal key carries", () => {
    // 20 requests per second AND 100 per two minutes. The second is the real
    // constraint: 0.83 req/s sustained, not 20.
    expect(parseRateLimit("20:1,100:120")).toEqual([
      { limit: 20, windowSeconds: 1 },
      { limit: 100, windowSeconds: 120 },
    ]);
  });

  it("tolerates spaces", () => {
    expect(parseRateLimit("20:1, 100:120")).toHaveLength(2);
  });

  it("returns nothing for a missing or unreadable header", () => {
    // Riot omits these on some responses. A missing header must not crash the
    // poller, and must not be read as "no limit".
    expect(parseRateLimit(undefined)).toEqual([]);
    expect(parseRateLimit("")).toEqual([]);
    expect(parseRateLimit("garbage")).toEqual([]);
    expect(parseRateLimit("20:")).toEqual([]);
  });
});

describe("headroom", () => {
  it("reports what is left in the tightest bucket", () => {
    // 3 of 20 used this second, 90 of 100 used this two minutes.
    // The two-minute bucket binds: 10 left, not 17.
    expect(headroom("20:1,100:120", "3:1,90:120")).toBe(10);
  });

  it("is zero when a bucket is exhausted", () => {
    expect(headroom("20:1,100:120", "20:1,50:120")).toBe(0);
  });

  it("never reports negative headroom", () => {
    expect(headroom("100:120", "120:120")).toBe(0);
  });

  it("assumes no headroom when the headers are missing", () => {
    // Guessing generously here would mean hammering Riot into a 429 ban.
    // Refusing to spend an unknown budget is the safe default.
    expect(headroom(undefined, undefined)).toBe(0);
  });

  it("ignores buckets the count header does not mention", () => {
    expect(headroom("20:1,100:120", "3:1")).toBe(17);
  });
});

describe("retry-after", () => {
  it("reads whole seconds into milliseconds", () => {
    expect(retryAfterMs("5")).toBe(5000);
  });

  it("falls back to one second when the header is missing or unreadable", () => {
    expect(retryAfterMs(undefined)).toBe(1000);
    expect(retryAfterMs("soon")).toBe(1000);
  });

  it("treats a zero or negative value as one second", () => {
    expect(retryAfterMs("0")).toBe(1000);
    expect(retryAfterMs("-3")).toBe(1000);
  });
});
