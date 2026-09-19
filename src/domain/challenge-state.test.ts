import { describe, expect, it } from "vitest";

import { deriveChallengeState } from "@/domain/challenge-state";

const WINDOW = {
  startsAt: new Date("2026-01-01T00:00:00.000Z"),
  endsAt: new Date("2026-01-08T00:00:00.000Z"),
};

describe("deriveChallengeState", () => {
  it("reports 'upcoming' when now is before startsAt", () => {
    const now = new Date("2025-12-31T23:59:59.000Z");

    expect(deriveChallengeState(WINDOW, now)).toBe("upcoming");
  });

  it("reports 'live' when now equals startsAt (inclusive lower bound)", () => {
    expect(deriveChallengeState(WINDOW, WINDOW.startsAt)).toBe("live");
  });

  it("reports 'live' when now equals endsAt (inclusive upper bound)", () => {
    expect(deriveChallengeState(WINDOW, WINDOW.endsAt)).toBe("live");
  });

  it("reports 'ended' when now is after endsAt", () => {
    const now = new Date("2026-01-08T00:00:01.000Z");

    expect(deriveChallengeState(WINDOW, now)).toBe("ended");
  });
});
