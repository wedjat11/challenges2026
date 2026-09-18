import { beforeEach, describe, expect, it, vi } from "vitest";

import { linkRiotAccount } from "@/application/link-riot-account";
import type { MatchSummary } from "@/domain/match";
import { MatchProviderError, type MatchProvider } from "@/domain/ports/match-provider";
import type {
  LinkOutcome,
  NewRiotAccount,
  RiotAccount,
  RiotAccountRepository,
} from "@/domain/ports/riot-account-repository";
import { regionForPlatform, type AccountRegion } from "@/domain/riot-id";

/** In-memory stand-in for the adapter, keyed by puuid — no HTTP, no database. */
function fakeRiotAccounts(): RiotAccountRepository & { seed: RiotAccount[] } {
  const rows: RiotAccount[] = [];

  return {
    seed: rows,
    async link(account: NewRiotAccount): Promise<LinkOutcome> {
      const existing = rows.find((row) => row.puuid === account.puuid);
      if (existing) {
        if (existing.userId !== account.userId) return { kind: "claimed_by_other_user" };
        return { kind: "already_linked", account: existing };
      }

      const stored: RiotAccount = {
        ...account,
        // Derived here too, mirroring the real adapter: `NewRiotAccount` no
        // longer carries `region`, so this fake must compute the same value
        // the database adapter would derive from `platform` on insert.
        region: regionForPlatform(account.platform),
        id: `id-${rows.length + 1}`,
        verified: false,
        createdAt: new Date(),
      };
      rows.push(stored);
      return { kind: "linked", account: stored };
    },
    async listByUser(userId: string) {
      return rows.filter((row) => row.userId === userId);
    },
    async findByPuuid(puuid: string) {
      return rows.find((row) => row.puuid === puuid) ?? null;
    },
    async unlink(id: string, userId: string) {
      const index = rows.findIndex((row) => row.id === id && row.userId === userId);
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}

/** A MatchProvider whose resolvePuuid is scripted; the other two methods are unused here. */
function fakeMatchProvider(resolvePuuid: MatchProvider["resolvePuuid"]): MatchProvider {
  return {
    resolvePuuid,
    async listMatchIds(): Promise<string[]> {
      throw new Error("not used by linkRiotAccount");
    },
    async fetchMatch(): Promise<MatchSummary> {
      throw new Error("not used by linkRiotAccount");
    },
  };
}

const PUUID = "PUUID-0000000000000000000000000000000000000000000000000000000000000000";

let riotAccounts: ReturnType<typeof fakeRiotAccounts>;
let matchProviderFor: (region: AccountRegion) => MatchProvider;
let resolvedWith: { gameName: string; tagLine: string } | undefined;

beforeEach(() => {
  riotAccounts = fakeRiotAccounts();
  resolvedWith = undefined;
  matchProviderFor = () =>
    fakeMatchProvider(async (gameName, tagLine) => {
      resolvedWith = { gameName, tagLine };
      return PUUID;
    });
});

describe("linkRiotAccount", () => {
  it("links a valid Riot ID on a valid platform", async () => {
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });

    const result = await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "la1" });

    expect(result.kind).toBe("linked");
    if (result.kind !== "linked" && result.kind !== "already_linked") {
      throw new Error(`expected linked, got ${result.kind}`);
    }
    expect(result.account.puuid).toBe(PUUID);
    expect(result.account.gameName).toBe("ThothMon");
    expect(result.account.tagLine).toBe("LAN1");
    expect(result.account.platform).toBe("la1");
    expect(result.account.region).toBe("americas");
    expect(resolvedWith).toEqual({ gameName: "ThothMon", tagLine: "LAN1" });
  });

  it("returns already_linked when the same user links the same account again", async () => {
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });
    await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "la1" });

    const result = await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "la1" });

    expect(result.kind).toBe("already_linked");
  });

  it("returns claimed_by_other_user when a different user links the same account", async () => {
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });
    await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "la1" });

    const result = await link({ userId: "user-2", riotId: "ThothMon#LAN1", platform: "la1" });

    expect(result).toEqual({ kind: "claimed_by_other_user" });
  });

  it("returns invalid_riot_id with the parser's reason for a malformed Riot ID", async () => {
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });

    const result = await link({ userId: "user-1", riotId: "NoTagHere", platform: "la1" });

    expect(result).toEqual({ kind: "invalid_riot_id", reason: "missing_tag" });
  });

  it("returns invalid_platform for a platform outside the known list", async () => {
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });

    const result = await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "mars1" });

    expect(result).toEqual({ kind: "invalid_platform" });
  });

  it("returns not_found when Riot reports a 404 for the Riot ID", async () => {
    matchProviderFor = () =>
      fakeMatchProvider(async () => {
        throw new MatchProviderError(404);
      });
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });

    const result = await link({ userId: "user-1", riotId: "Nobody#XXXX", platform: "la1" });

    expect(result).toEqual({ kind: "not_found" });
  });

  it("returns riot_unavailable, with the status, for any other MatchProviderError", async () => {
    matchProviderFor = () =>
      fakeMatchProvider(async () => {
        throw new MatchProviderError(500);
      });
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });

    const result = await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "la1" });

    expect(result).toEqual({ kind: "riot_unavailable", status: 500 });
  });

  it("returns riot_unavailable without leaking the message for an unknown error", async () => {
    matchProviderFor = () =>
      fakeMatchProvider(async () => {
        throw new Error("some internal detail nobody outside should see");
      });
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });

    const result = await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "la1" });

    expect(result).toEqual({ kind: "riot_unavailable" });
  });

  it("returns riot_unavailable, with no status, when matchProviderFor itself throws", async () => {
    matchProviderFor = () => {
      throw new Error("RIOT_API_KEY is not set — cannot talk to Riot's API");
    };
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });

    const result = await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "la1" });

    expect(result).toEqual({ kind: "riot_unavailable" });
  });

  it("logs the status, never the error, on an unknown MatchProviderError", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      matchProviderFor = () =>
        fakeMatchProvider(async () => {
          throw new MatchProviderError(500);
        });
      const link = linkRiotAccount({ riotAccounts, matchProviderFor });

      await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "la1" });

      expect(errorSpy).toHaveBeenCalledWith("link-riot-account: match provider failed", {
        status: 500,
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("logs with no status for a non-MatchProviderError and never the error's message", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      matchProviderFor = () =>
        fakeMatchProvider(async () => {
          throw new Error("some internal detail nobody outside should see");
        });
      const link = linkRiotAccount({ riotAccounts, matchProviderFor });

      await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "la1" });

      expect(errorSpy).toHaveBeenCalledWith("link-riot-account: match provider failed", {
        status: undefined,
      });
      const loggedPayload = errorSpy.mock.calls[0]?.[1];
      expect(JSON.stringify(loggedPayload)).not.toContain("internal detail");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("asks matchProviderFor for the region that matches the chosen platform", async () => {
    const seenRegions: AccountRegion[] = [];
    matchProviderFor = (region) => {
      seenRegions.push(region);
      return fakeMatchProvider(async () => PUUID);
    };
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });

    await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "euw1" });

    expect(seenRegions).toEqual(["europe"]);
  });

  it("asks matchProviderFor for asia on a SEA platform, even though the stored account region is sea", async () => {
    const seenRegions: AccountRegion[] = [];
    matchProviderFor = (region) => {
      seenRegions.push(region);
      return fakeMatchProvider(async () => PUUID);
    };
    const link = linkRiotAccount({ riotAccounts, matchProviderFor });

    const result = await link({ userId: "user-1", riotId: "ThothMon#LAN1", platform: "oc1" });

    expect(seenRegions).toEqual(["asia"]);
    if (result.kind !== "linked" && result.kind !== "already_linked") {
      throw new Error(`expected linked, got ${result.kind}`);
    }
    expect(result.account.region).toBe("sea");
  });
});
