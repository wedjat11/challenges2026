import { describe, expect, it } from "vitest";

import { QUEUE_LABELS, QUEUES, ROLE_LABELS, ROLES, isQueue, isRole } from "@/domain/match";

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

describe("ROLE_LABELS", () => {
  it("labels every role with a human-readable string, including 'unknown'", () => {
    expect(ROLE_LABELS).toEqual({
      top: "Top",
      jungle: "Jungle",
      middle: "Mid",
      bottom: "Bottom",
      support: "Support",
      unknown: "an unrecognized role",
    });
  });

  it("labels the role rule-text.ts's worked example depends on", () => {
    // design.md's worked example is "Win 10 ranked solo games in Jungle" —
    // this exact string is load-bearing for rule-text.ts's test.
    expect(ROLE_LABELS.jungle).toBe("Jungle");
  });
});

describe("QUEUE_LABELS", () => {
  it("labels every queue with the mid-sentence word form rule-text.ts uses", () => {
    expect(QUEUE_LABELS).toEqual({
      "ranked-solo": "ranked solo",
      "ranked-flex": "ranked flex",
      "normal-draft": "normal draft",
      "normal-blind": "normal blind",
      aram: "ARAM",
      other: "other",
    });
  });

  it("labels the queue rule-text.ts's worked example depends on", () => {
    expect(QUEUE_LABELS["ranked-solo"]).toBe("ranked solo");
  });
});
