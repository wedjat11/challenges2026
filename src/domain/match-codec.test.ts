import { describe, expect, it } from "vitest";

import { aMatch } from "@/domain/match.fixture";
import { parseMatchSummary, serialiseMatchSummary } from "@/domain/match-codec";

describe("round trip", () => {
  it("survives being written and read back", () => {
    const match = aMatch();
    expect(parseMatchSummary(serialiseMatchSummary(match))).toEqual(match);
  });

  it("keeps playedAt as a real Date, not the string it was stored as", () => {
    const match = aMatch({ playedAt: new Date("2026-09-16T08:30:00Z") });
    const roundTripped = parseMatchSummary(serialiseMatchSummary(match));
    expect(roundTripped.playedAt).toBeInstanceOf(Date);
    expect(roundTripped.playedAt).toEqual(match.playedAt);
  });
});

describe("rejecting what the database should never hold", () => {
  it("rejects a game it does not recognise", () => {
    // A row written by a future version tracking a game this app does not
    // handle yet must fail loudly, not be silently treated as League.
    expect(() =>
      parseMatchSummary(
        JSON.stringify({ ...aMatch(), game: "tft", playedAt: aMatch().playedAt.toISOString() }),
      ),
    ).toThrow();
  });

  it("rejects a role or queue outside the allowed set", () => {
    const base = { ...aMatch(), playedAt: aMatch().playedAt.toISOString() };
    expect(() => parseMatchSummary(JSON.stringify({ ...base, role: "mid" }))).toThrow();
    expect(() => parseMatchSummary(JSON.stringify({ ...base, queue: "ranked" }))).toThrow();
  });

  it("rejects an empty match id", () => {
    const base = { ...aMatch(), playedAt: aMatch().playedAt.toISOString() };
    expect(() => parseMatchSummary(JSON.stringify({ ...base, matchId: "" }))).toThrow();
  });

  it("rejects a negative duration", () => {
    const base = { ...aMatch(), playedAt: aMatch().playedAt.toISOString() };
    expect(() => parseMatchSummary(JSON.stringify({ ...base, durationSeconds: -1 }))).toThrow();
  });

  it("rejects malformed JSON rather than returning nothing", () => {
    expect(() => parseMatchSummary("not json")).toThrow();
    expect(() => parseMatchSummary('{"matchId":"x"}')).toThrow();
  });
});
