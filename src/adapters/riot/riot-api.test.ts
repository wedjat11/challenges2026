import { describe, expect, it, vi } from "vitest";

import { createRiotApi } from "@/adapters/riot/riot-api";
import { MatchProviderError } from "@/domain/ports/match-provider";

import rankedSolo from "./__fixtures__/match-ranked-solo.json";

const TRACKED = "PUUID-TRACKED-PLAYER-0000000000000000000000000000000000000000000000000000";

const CONFIG = { apiKey: "RGAPI-test-key", region: "americas", platform: "la1" } as const;

type Call = { url: string; headers: Record<string, string> };

/** Records requests and replays canned responses. No network, ever. */
function fakeFetch(responses: { status: number; body?: unknown; headers?: Record<string, string> }[]) {
  const calls: Call[] = [];
  const fetch = vi.fn(async (url: string, init?: { headers?: Record<string, string> }) => {
    calls.push({ url, headers: init?.headers ?? {} });
    const next = responses[Math.min(calls.length - 1, responses.length - 1)]!;
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      headers: { get: (name: string) => next.headers?.[name.toLowerCase()] ?? null },
      json: async () => next.body,
    };
  });
  return { fetch, calls };
}

describe("routing", () => {
  it("sends account-v1 to the regional host", async () => {
    const { fetch, calls } = fakeFetch([{ status: 200, body: { puuid: TRACKED } }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    await expect(api.resolvePuuid("ThothMon", "LAN")).resolves.toBe(TRACKED);
    expect(calls[0]?.url).toBe(
      "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/ThothMon/LAN",
    );
  });

  it("sends match-v5 to the regional host, not the platform one", async () => {
    const { fetch, calls } = fakeFetch([{ status: 200, body: ["LA1_1"] }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    await api.listMatchIds(TRACKED);
    expect(calls[0]?.url).toContain("https://americas.api.riotgames.com/lol/match/v5/");
    expect(calls[0]?.url).not.toContain("la1.api");
  });

  it("escapes a Riot ID containing spaces", async () => {
    const { fetch, calls } = fakeFetch([{ status: 200, body: { puuid: TRACKED } }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    await api.resolvePuuid("Thoth Mon", "LAN #1");
    expect(calls[0]?.url).toContain("/by-riot-id/Thoth%20Mon/LAN%20%231");
  });
});

describe("authentication", () => {
  it("sends the key as a header", async () => {
    const { fetch, calls } = fakeFetch([{ status: 200, body: { puuid: TRACKED } }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    await api.resolvePuuid("ThothMon", "LAN");
    expect(calls[0]?.headers["X-Riot-Token"]).toBe("RGAPI-test-key");
  });

  it("never puts the key in the URL", async () => {
    // A key in a query string ends up in logs, proxies and browser history.
    const { fetch, calls } = fakeFetch([{ status: 200, body: { puuid: TRACKED } }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    await api.resolvePuuid("ThothMon", "LAN");
    expect(calls[0]?.url).not.toContain("RGAPI");
  });
});

describe("incremental fetching", () => {
  it("asks only for matches after the given time", async () => {
    const { fetch, calls } = fakeFetch([{ status: 200, body: [] }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    await api.listMatchIds(TRACKED, { startTime: new Date("2026-09-16T00:00:00Z"), count: 5 });
    // Riot expects whole seconds, not milliseconds.
    expect(calls[0]?.url).toContain("startTime=1789516800");
    expect(calls[0]?.url).toContain("count=5");
  });

  it("omits startTime when none is given", async () => {
    const { fetch, calls } = fakeFetch([{ status: 200, body: [] }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    await api.listMatchIds(TRACKED);
    expect(calls[0]?.url).not.toContain("startTime");
  });
});

describe("fetching a match", () => {
  it("returns a domain summary, not Riot's payload", async () => {
    const { fetch } = fakeFetch([{ status: 200, body: rankedSolo }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    await expect(api.fetchMatch("LA1_1748677697", TRACKED)).resolves.toMatchObject({
      game: "lol",
      champion: "Camille",
      role: "top",
      queue: "ranked-solo",
    });
  });
});

describe("rate limiting", () => {
  it("waits the time Riot asks for, then retries", async () => {
    const sleep = vi.fn(async () => {});
    const { fetch } = fakeFetch([
      { status: 429, headers: { "retry-after": "3" } },
      { status: 200, body: { puuid: TRACKED } },
    ]);
    const api = createRiotApi({ ...CONFIG, fetch, sleep });

    await expect(api.resolvePuuid("ThothMon", "LAN")).resolves.toBe(TRACKED);
    expect(sleep).toHaveBeenCalledWith(3000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("gives up rather than retrying forever", async () => {
    const sleep = vi.fn(async () => {});
    const { fetch } = fakeFetch([{ status: 429, headers: { "retry-after": "1" } }]);
    const api = createRiotApi({ ...CONFIG, fetch, sleep, maxRetries: 2 });

    await expect(api.resolvePuuid("ThothMon", "LAN")).rejects.toThrow(/rate limit/i);
    expect(fetch).toHaveBeenCalledTimes(3); // the first try plus two retries
  });
});

describe("failures", () => {
  it("reports the status for an unknown Riot ID", async () => {
    const { fetch } = fakeFetch([{ status: 404 }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    await expect(api.resolvePuuid("Nobody", "XXXX")).rejects.toThrow(/404/);
  });

  it("does not retry a 404", async () => {
    const sleep = vi.fn(async () => {});
    const { fetch } = fakeFetch([{ status: 404 }]);
    const api = createRiotApi({ ...CONFIG, fetch, sleep });

    await expect(api.resolvePuuid("Nobody", "XXXX")).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("throws the port's MatchProviderError carrying the status, so callers can branch without parsing a message", async () => {
    const { fetch } = fakeFetch([{ status: 404 }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    const error = await api.resolvePuuid("Nobody", "XXXX").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MatchProviderError);
    expect(error).toMatchObject({ status: 404 });
  });

  it("never leaks the key in an error message", async () => {
    const { fetch } = fakeFetch([{ status: 403 }]);
    const api = createRiotApi({ ...CONFIG, fetch });

    await expect(api.resolvePuuid("ThothMon", "LAN")).rejects.toThrow(
      expect.not.stringContaining("RGAPI-test-key") as unknown as string,
    );
  });
});
