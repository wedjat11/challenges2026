import { afterEach, describe, expect, it, vi } from "vitest";

// Mocked so this file can assert *what* `matchProviderFor` passes to
// `createRiotApi` (specifically `maxRetries`) without making a real client or
// duplicating createRiotApi's own retry-behaviour tests, which already live
// in src/adapters/riot/riot-api.test.ts.
const createRiotApiMock = vi.fn((config: unknown) => {
  void config; // typed only so `toHaveBeenCalledWith` below can inspect it
  return { resolvePuuid: vi.fn(), listMatchIds: vi.fn(), fetchMatch: vi.fn() };
});
vi.mock("@/adapters/riot/riot-api", () => ({
  createRiotApi: (config: unknown) => createRiotApiMock(config),
}));

const { matchProviderFor } = await import("@/lib/riot");

afterEach(() => {
  vi.unstubAllEnvs();
  createRiotApiMock.mockClear();
});

describe("matchProviderFor", () => {
  it("throws a clear error when RIOT_API_KEY is empty", () => {
    vi.stubEnv("RIOT_API_KEY", "");

    expect(() => matchProviderFor("americas")).toThrow(/RIOT_API_KEY/);
  });

  it("returns a MatchProvider once the key is set", () => {
    vi.stubEnv("RIOT_API_KEY", "RGAPI-test-key");

    const provider = matchProviderFor("americas");

    expect(typeof provider.resolvePuuid).toBe("function");
    expect(typeof provider.listMatchIds).toBe("function");
    expect(typeof provider.fetchMatch).toBe("function");
  });

  it("disables retries, so a 429 surfaces as riot_unavailable immediately instead of stalling the request", () => {
    // This factory backs the interactive link-account server action — the
    // adapter's own default (3 retries, sleeping out Retry-After) would hold
    // that request open for tens of seconds. T11's polling pipeline builds
    // its own provider with retries, where waiting is fine.
    vi.stubEnv("RIOT_API_KEY", "RGAPI-test-key");

    matchProviderFor("americas");

    expect(createRiotApiMock).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "RGAPI-test-key", region: "americas", maxRetries: 0 }),
    );
  });
});
