import { describe, expect, it } from "vitest";

import { aMatch } from "@/domain/match.fixture";
import { qualifies } from "@/domain/rule";

describe("won criterion", () => {
  it("accepts a won match", () => {
    expect(qualifies({ target: 1, criteria: [{ kind: "won" }] }, aMatch({ win: true }))).toBe(true);
  });

  it("rejects a lost match", () => {
    expect(qualifies({ target: 1, criteria: [{ kind: "won" }] }, aMatch({ win: false }))).toBe(
      false,
    );
  });
});

describe("champion criterion", () => {
  it("accepts the named champion", () => {
    const rule = { target: 1, criteria: [{ kind: "champion" as const, champion: "Lee Sin" }] };
    expect(qualifies(rule, aMatch({ champion: "Lee Sin" }))).toBe(true);
  });

  it("ignores case and surrounding space, because people type these by hand", () => {
    const rule = { target: 1, criteria: [{ kind: "champion" as const, champion: "  lee sin " }] };
    expect(qualifies(rule, aMatch({ champion: "Lee Sin" }))).toBe(true);
  });

  it("rejects a different champion", () => {
    const rule = { target: 1, criteria: [{ kind: "champion" as const, champion: "Yasuo" }] };
    expect(qualifies(rule, aMatch({ champion: "Lee Sin" }))).toBe(false);
  });
});

describe("role and queue criteria", () => {
  it("accepts a matching role", () => {
    const rule = { target: 1, criteria: [{ kind: "role" as const, role: "jungle" as const }] };
    expect(qualifies(rule, aMatch({ role: "jungle" }))).toBe(true);
  });

  it("rejects a different role", () => {
    const rule = { target: 1, criteria: [{ kind: "role" as const, role: "jungle" as const }] };
    expect(qualifies(rule, aMatch({ role: "support" }))).toBe(false);
  });

  it("accepts a matching queue", () => {
    const rule = {
      target: 1,
      criteria: [{ kind: "queue" as const, queue: "ranked-solo" as const }],
    };
    expect(qualifies(rule, aMatch({ queue: "ranked-solo" }))).toBe(true);
  });

  it("rejects a different queue", () => {
    const rule = {
      target: 1,
      criteria: [{ kind: "queue" as const, queue: "ranked-solo" as const }],
    };
    expect(qualifies(rule, aMatch({ queue: "aram" }))).toBe(false);
  });
});

describe("combining criteria", () => {
  // This is the whole reason criteria live inside a rule instead of being
  // separate rules: "win 10 ranked games as Jungle" is one goal with three
  // conditions, not three goals that thirty unrelated games could satisfy.
  const rankedJungleWin = {
    target: 10,
    criteria: [
      { kind: "won" as const },
      { kind: "queue" as const, queue: "ranked-solo" as const },
      { kind: "role" as const, role: "jungle" as const },
    ],
  };

  it("accepts a match satisfying every criterion", () => {
    expect(qualifies(rankedJungleWin, aMatch({ win: true, queue: "ranked-solo", role: "jungle" })))
      .toBe(true);
  });

  it("rejects a match that satisfies all but one", () => {
    expect(
      qualifies(rankedJungleWin, aMatch({ win: true, queue: "ranked-solo", role: "support" })),
    ).toBe(false);
    expect(
      qualifies(rankedJungleWin, aMatch({ win: false, queue: "ranked-solo", role: "jungle" })),
    ).toBe(false);
    expect(
      qualifies(rankedJungleWin, aMatch({ win: true, queue: "aram", role: "jungle" })),
    ).toBe(false);
  });

  it("accepts every match when there are no criteria", () => {
    // "Play 20 games", with no conditions on what kind.
    expect(qualifies({ target: 20, criteria: [] }, aMatch({ win: false, queue: "aram" }))).toBe(
      true,
    );
  });
});
