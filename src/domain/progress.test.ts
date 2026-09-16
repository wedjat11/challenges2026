import { describe, expect, it } from "vitest";

import { aMatch } from "@/domain/match.fixture";
import type { Rule } from "@/domain/rule";
import { MINIMUM_COUNTED_DURATION_SECONDS, evaluate } from "@/domain/progress";

const WINDOW = {
  startsAt: new Date("2026-09-14T00:00:00Z"),
  endsAt: new Date("2026-09-21T00:00:00Z"),
};

const insideWindow = new Date("2026-09-16T12:00:00Z");

const playTen: Rule = { target: 10, criteria: [] };

const winTenRankedJungle: Rule = {
  target: 10,
  criteria: [
    { kind: "won" },
    { kind: "queue", queue: "ranked-solo" },
    { kind: "role", role: "jungle" },
  ],
};

function matches(count: number, overrides: Parameters<typeof aMatch>[0] = {}) {
  return Array.from({ length: count }, (_, index) =>
    aMatch({ matchId: `LA1_${index}`, playedAt: insideWindow, ...overrides }),
  );
}

describe("counting", () => {
  it("reports zero against an empty match list", () => {
    const progress = evaluate([playTen], [], WINDOW);
    expect(progress.rules[0]).toEqual({ current: 0, target: 10, completed: false });
    expect(progress.completed).toBe(false);
  });

  it("counts every match when a rule has no criteria", () => {
    expect(evaluate([playTen], matches(4), WINDOW).rules[0]?.current).toBe(4);
  });

  it("counts only matches meeting every criterion", () => {
    const played = [
      ...matches(3, { win: true, queue: "ranked-solo", role: "jungle" }),
      ...matches(2, { win: false, queue: "ranked-solo", role: "jungle" }).map((m) => ({
        ...m,
        matchId: `${m.matchId}-loss`,
      })),
    ];
    expect(evaluate([winTenRankedJungle], played, WINDOW).rules[0]?.current).toBe(3);
  });

  it("marks a rule complete once the target is reached", () => {
    const progress = evaluate([{ target: 3, criteria: [] }], matches(3), WINDOW);
    expect(progress.rules[0]?.completed).toBe(true);
    expect(progress.completed).toBe(true);
  });
});

describe("overshooting the target", () => {
  it("reports the true count rather than clamping it", () => {
    // 12/10 is honest. The UI can clamp a progress bar; the domain should not
    // quietly discard the fact that three extra games were played.
    const progress = evaluate([playTen], matches(12), WINDOW);
    expect(progress.rules[0]).toEqual({ current: 12, target: 10, completed: true });
  });
});

describe("the challenge window", () => {
  it("ignores matches played before it opens", () => {
    const early = matches(5, { playedAt: new Date("2026-09-13T23:59:59Z") });
    expect(evaluate([playTen], early, WINDOW).rules[0]?.current).toBe(0);
  });

  it("ignores matches played after it closes", () => {
    const late = matches(5, { playedAt: new Date("2026-09-21T00:00:01Z") });
    expect(evaluate([playTen], late, WINDOW).rules[0]?.current).toBe(0);
  });

  it("includes matches played exactly on either boundary", () => {
    const onEdges = [
      aMatch({ matchId: "start", playedAt: WINDOW.startsAt }),
      aMatch({ matchId: "end", playedAt: WINDOW.endsAt }),
    ];
    expect(evaluate([playTen], onEdges, WINDOW).rules[0]?.current).toBe(2);
  });
});

describe("remakes and very short games", () => {
  it("does not count a game that ended before the remake threshold", () => {
    // Without this, "play 20 games" is farmable by remaking twenty times.
    const remakes = matches(5, { durationSeconds: MINIMUM_COUNTED_DURATION_SECONDS - 1 });
    expect(evaluate([playTen], remakes, WINDOW).rules[0]?.current).toBe(0);
  });

  it("counts a game that lasted exactly the threshold", () => {
    const short = matches(2, { durationSeconds: MINIMUM_COUNTED_DURATION_SECONDS });
    expect(evaluate([playTen], short, WINDOW).rules[0]?.current).toBe(2);
  });
});

describe("duplicate matches", () => {
  it("counts a repeated match id only once", () => {
    // The match cache is shared across overlapping challenges, so the same
    // match can reach us twice. Counting it twice would complete a challenge
    // early, which is worse than the cost of guarding against it here.
    const duplicated = [aMatch({ matchId: "LA1_same" }), aMatch({ matchId: "LA1_same" })];
    expect(evaluate([playTen], duplicated, WINDOW).rules[0]?.current).toBe(1);
  });
});

describe("several rules", () => {
  it("evaluates each rule independently over the same matches", () => {
    const played = matches(4, { win: true, queue: "ranked-solo", role: "jungle" });
    const progress = evaluate([playTen, winTenRankedJungle], played, WINDOW);
    expect(progress.rules).toEqual([
      { current: 4, target: 10, completed: false },
      { current: 4, target: 10, completed: false },
    ]);
  });

  it("is complete only when every rule is", () => {
    const played = matches(3, { win: true, queue: "ranked-solo", role: "jungle" });
    const progress = evaluate(
      [
        { target: 3, criteria: [] },
        { target: 99, criteria: [] },
      ],
      played,
      WINDOW,
    );
    expect(progress.rules.map((r) => r.completed)).toEqual([true, false]);
    expect(progress.completed).toBe(false);
  });

  it("is complete when there are no rules at all", () => {
    expect(evaluate([], matches(1), WINDOW)).toEqual({ rules: [], completed: true });
  });
});
