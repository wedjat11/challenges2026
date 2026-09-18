import { describe, expect, it } from "vitest";

import {
  accountRegionForPlatform,
  DEFAULT_PLATFORM,
  isPlatform,
  parseRiotId,
  PLATFORM_LABELS,
  PLATFORMS,
  regionForPlatform,
} from "@/domain/riot-id";

describe("parseRiotId", () => {
  it("splits a well-formed Riot ID into game name and tag line", () => {
    expect(parseRiotId("ThothMon#LAN1")).toEqual({
      ok: true,
      gameName: "ThothMon",
      tagLine: "LAN1",
    });
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(parseRiotId("  ThothMon#LAN1  ")).toEqual({
      ok: true,
      gameName: "ThothMon",
      tagLine: "LAN1",
    });
  });

  it("splits on the last '#', not the first", () => {
    // Riot IDs cannot contain '#' in practice, but the parser must still pick
    // a deterministic split rather than fail on an unexpected extra hash.
    expect(parseRiotId("Name#With#Hash#TAG1")).toEqual({
      ok: true,
      gameName: "Name#With#Hash",
      tagLine: "TAG1",
    });
  });

  it("preserves the casing the user typed", () => {
    expect(parseRiotId("thothMON#lan1")).toEqual({
      ok: true,
      gameName: "thothMON",
      tagLine: "lan1",
    });
  });

  it("accepts unicode letters and spaces in the game name", () => {
    expect(parseRiotId("召唤师名字#KR12")).toEqual({
      ok: true,
      gameName: "召唤师名字",
      tagLine: "KR12",
    });
    expect(parseRiotId("Thoth Mon#LAN1")).toEqual({
      ok: true,
      gameName: "Thoth Mon",
      tagLine: "LAN1",
    });
  });

  it("rejects a value with no '#'", () => {
    expect(parseRiotId("ThothMon")).toEqual({ ok: false, reason: "missing_tag" });
  });

  it("rejects a game name shorter than 3 characters", () => {
    expect(parseRiotId("Th#LAN1")).toEqual({ ok: false, reason: "game_name_length" });
  });

  it("rejects a game name longer than 16 characters", () => {
    expect(parseRiotId("ThisNameIsWayTooLong#LAN1")).toEqual({
      ok: false,
      reason: "game_name_length",
    });
  });

  it("counts an astral character as one code point, not two UTF-16 units", () => {
    // U+1D538 MATHEMATICAL DOUBLE-STRUCK CAPITAL A is a surrogate pair in
    // UTF-16 (length 2) but a single code point. "𝔸bcdefghijklmnop" is 16
    // code points — exactly at the max, so valid — but 17 UTF-16 units,
    // which a `.length`-based check would reject as too long.
    expect(parseRiotId("𝔸bcdefghijklmnop#LAN1")).toEqual({
      ok: true,
      gameName: "𝔸bcdefghijklmnop",
      tagLine: "LAN1",
    });
  });

  it("rejects a tag line shorter than 3 characters", () => {
    expect(parseRiotId("ThothMon#LA")).toEqual({ ok: false, reason: "tag_line_format" });
  });

  it("rejects a tag line longer than 5 characters", () => {
    expect(parseRiotId("ThothMon#LANLAN")).toEqual({ ok: false, reason: "tag_line_format" });
  });

  it("rejects a tag line with non-alphanumeric characters", () => {
    expect(parseRiotId("ThothMon#LA-1")).toEqual({ ok: false, reason: "tag_line_format" });
  });
});

describe("isPlatform", () => {
  it("accepts every platform in PLATFORMS", () => {
    for (const platform of PLATFORMS) {
      expect(isPlatform(platform)).toBe(true);
    }
  });

  it("rejects a string that is not a platform", () => {
    expect(isPlatform("mars1")).toBe(false);
  });
});

describe("regionForPlatform", () => {
  it("routes the Americas platforms", () => {
    expect(regionForPlatform("na1")).toBe("americas");
    expect(regionForPlatform("br1")).toBe("americas");
    expect(regionForPlatform("la1")).toBe("americas");
    expect(regionForPlatform("la2")).toBe("americas");
  });

  it("routes the Europe platforms", () => {
    expect(regionForPlatform("euw1")).toBe("europe");
    expect(regionForPlatform("eun1")).toBe("europe");
    expect(regionForPlatform("tr1")).toBe("europe");
    expect(regionForPlatform("ru")).toBe("europe");
    expect(regionForPlatform("me1")).toBe("europe");
  });

  it("routes the Asia platforms", () => {
    expect(regionForPlatform("kr")).toBe("asia");
    expect(regionForPlatform("jp1")).toBe("asia");
  });

  it("routes the SEA platforms", () => {
    expect(regionForPlatform("oc1")).toBe("sea");
    expect(regionForPlatform("ph2")).toBe("sea");
    expect(regionForPlatform("sg2")).toBe("sea");
    expect(regionForPlatform("th2")).toBe("sea");
    expect(regionForPlatform("tw2")).toBe("sea");
    expect(regionForPlatform("vn2")).toBe("sea");
  });
});

describe("accountRegionForPlatform", () => {
  it("routes the SEA platforms to asia, since account-v1 has no sea cluster", () => {
    expect(accountRegionForPlatform("oc1")).toBe("asia");
    expect(accountRegionForPlatform("ph2")).toBe("asia");
    expect(accountRegionForPlatform("sg2")).toBe("asia");
    expect(accountRegionForPlatform("th2")).toBe("asia");
    expect(accountRegionForPlatform("tw2")).toBe("asia");
    expect(accountRegionForPlatform("vn2")).toBe("asia");
  });

  it("matches regionForPlatform for every platform outside SEA", () => {
    expect(accountRegionForPlatform("la1")).toBe("americas");
    expect(accountRegionForPlatform("na1")).toBe("americas");
    expect(accountRegionForPlatform("euw1")).toBe("europe");
    expect(accountRegionForPlatform("kr")).toBe("asia");
  });
});

describe("DEFAULT_PLATFORM", () => {
  it("is a valid platform the form can pre-select", () => {
    expect(isPlatform(DEFAULT_PLATFORM)).toBe(true);
    expect(DEFAULT_PLATFORM).toBe("la1");
  });
});

describe("PLATFORM_LABELS", () => {
  it("has a human label for every platform", () => {
    for (const platform of PLATFORMS) {
      expect(PLATFORM_LABELS[platform]).toEqual(expect.any(String));
      expect(PLATFORM_LABELS[platform].length).toBeGreaterThan(0);
    }
  });

  it("labels the LAN and LAS shards the way players know them", () => {
    expect(PLATFORM_LABELS.la1).toBe("LAN");
    expect(PLATFORM_LABELS.la2).toBe("LAS");
  });
});
