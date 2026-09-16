import { describe, expect, it } from "vitest";

import { QUEUES, ROLES, isQueue, isRole } from "@/domain/match";

describe("roles", () => {
  it("covers the five positions a LoL match assigns", () => {
    expect(ROLES).toEqual(["top", "jungle", "middle", "bottom", "support", "unknown"]);
  });

  it("accepts a known role", () => {
    expect(isRole("jungle")).toBe(true);
  });

  it("rejects an unknown string", () => {
    expect(isRole("JUNGLE")).toBe(false);
    expect(isRole("mid")).toBe(false);
    expect(isRole("")).toBe(false);
  });

  it("treats 'unknown' as a real role", () => {
    // Riot reports an empty position for remakes and for modes without roles,
    // so the domain needs a value for it rather than dropping the match.
    expect(isRole("unknown")).toBe(true);
  });
});

describe("queues", () => {
  it("names the queues challenges care about, with an escape hatch", () => {
    expect(QUEUES).toEqual([
      "ranked-solo",
      "ranked-flex",
      "normal-draft",
      "normal-blind",
      "aram",
      "other",
    ]);
  });

  it("accepts a known queue", () => {
    expect(isQueue("ranked-solo")).toBe(true);
  });

  it("rejects an unknown string", () => {
    expect(isQueue("ranked")).toBe(false);
    expect(isQueue("")).toBe(false);
  });
});
