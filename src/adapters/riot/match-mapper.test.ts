import { describe, expect, it } from "vitest";

import { toMatchSummary, toQueue, toRole } from "@/adapters/riot/match-mapper";

import rankedSolo from "./__fixtures__/match-ranked-solo.json";

const TRACKED = "PUUID-TRACKED-PLAYER-0000000000000000000000000000000000000000000000000000";
const OTHER = "PUUID-OTHER-PLAYER-000000000000000000000000000000000000000000000000000000";

describe("role mapping", () => {
  it("maps the positions Riot actually reports", () => {
    expect(toRole("TOP")).toBe("top");
    expect(toRole("JUNGLE")).toBe("jungle");
    expect(toRole("MIDDLE")).toBe("middle");
    expect(toRole("BOTTOM")).toBe("bottom");
    expect(toRole("UTILITY")).toBe("support");
  });

  it("falls back to unknown for an empty or unrecognised position", () => {
    // Riot sends "" for remakes and for modes without roles.
    expect(toRole("")).toBe("unknown");
    expect(toRole("AFK")).toBe("unknown");
  });
});

describe("queue mapping", () => {
  it("maps the queues challenges name", () => {
    expect(toQueue(420)).toBe("ranked-solo");
    expect(toQueue(440)).toBe("ranked-flex");
    expect(toQueue(400)).toBe("normal-draft");
    expect(toQueue(430)).toBe("normal-blind");
    expect(toQueue(450)).toBe("aram");
  });

  it("puts everything else in other rather than guessing", () => {
    expect(toQueue(1700)).toBe("other");
    expect(toQueue(0)).toBe("other");
  });
});

describe("mapping a real recorded match", () => {
  it("reduces Riot's payload to the fields a rule can ask about", () => {
    expect(toMatchSummary(rankedSolo, TRACKED)).toEqual({
      game: "lol",
      matchId: "LA1_1748677697",
      puuid: TRACKED,
      champion: "Camille",
      role: "top",
      queue: "ranked-solo",
      win: false,
      durationSeconds: 2524,
      playedAt: new Date(1789413441531),
    });
  });

  it("describes the requested player, not the first one in the lobby", () => {
    const summary = toMatchSummary(rankedSolo, OTHER);
    expect(summary.puuid).toBe(OTHER);
    expect(summary.champion).not.toBe("Camille");
  });

  it("uses teamPosition rather than lane", () => {
    // In this recorded match the tracked player has teamPosition TOP while
    // lane says JUNGLE. lane and role are unreliable legacy fields; reading
    // them would silently mis-score every role challenge.
    const participant = rankedSolo.info.participants[0];
    expect(participant?.lane).toBe("JUNGLE");
    expect(participant?.teamPosition).toBe("TOP");
    expect(toMatchSummary(rankedSolo, TRACKED).role).toBe("top");
  });

  it("refuses a puuid that did not play in the match", () => {
    expect(() => toMatchSummary(rankedSolo, "PUUID-NOBODY")).toThrow(/not a participant/i);
  });
});
