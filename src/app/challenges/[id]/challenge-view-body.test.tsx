import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChallengeViewBody } from "@/app/challenges/[id]/challenge-view-body";
import type { ChallengeState, ChallengeView } from "@/application/get-challenge-view";

/**
 * Static-render tests, matching `challenge-card.test.tsx`: no jsdom,
 * assertions on rendered markup/text (strict-tdd's Implementation Detail
 * Coupling Rule). `now` is injected so the freshness label's relative time
 * is deterministic rather than wall-clock dependent.
 */

const NOW = new Date("2026-09-19T12:00:00.000Z");

function view(overrides: Partial<ChallengeView> = {}): ChallengeView {
  return {
    id: "abc-123",
    ownerId: "user-1",
    title: "Ahri Gauntlet",
    startsAt: new Date("2026-09-01T00:00:00.000Z"),
    endsAt: new Date("2026-09-30T00:00:00.000Z"),
    visibility: "public",
    state: "live",
    rules: [{ target: 3, criteria: [{ kind: "won" }, { kind: "champion", champion: "Ahri" }] }],
    ruleText: ["Win 3 games as Ahri"],
    participants: [
      {
        riotAccountId: "acc-1",
        displayName: "Riven#NA1",
        platformLabel: "NA",
        rules: [{ current: 2, target: 3, completed: false }],
        lastCheckedAt: new Date("2026-09-19T11:56:00.000Z"),
      },
      {
        riotAccountId: "acc-2",
        displayName: "Ahri#EUW",
        platformLabel: "EUW",
        rules: [{ current: 0, target: 3, completed: false }],
        lastCheckedAt: null,
      },
    ],
    ...overrides,
  };
}

describe("ChallengeViewBody", () => {
  it("renders the title", () => {
    const html = renderToStaticMarkup(
      <ChallengeViewBody view={view()} shareUrl="/challenges/abc-123" now={NOW} />,
    );

    expect(html).toContain("Ahri Gauntlet");
  });

  it("renders a state badge whose markup differs across upcoming, live and ended", () => {
    const render = (state: ChallengeState) =>
      renderToStaticMarkup(
        <ChallengeViewBody view={view({ state })} shareUrl="/challenges/abc-123" now={NOW} />,
      );

    const upcoming = render("upcoming");
    const live = render("live");
    const ended = render("ended");

    expect(upcoming).not.toBe(live);
    expect(live).not.toBe(ended);
  });

  it("renders the state label text", () => {
    const html = renderToStaticMarkup(
      <ChallengeViewBody view={view({ state: "ended" })} shareUrl="/challenges/abc-123" now={NOW} />,
    );

    expect(html).toContain("Ended");
  });

  it("renders every rule sentence", () => {
    const html = renderToStaticMarkup(
      <ChallengeViewBody
        view={view({ ruleText: ["Win 3 games as Ahri", "Play 20 games"] })}
        shareUrl="/challenges/abc-123"
        now={NOW}
      />,
    );

    expect(html).toContain("Win 3 games as Ahri");
    expect(html).toContain("Play 20 games");
  });

  it("renders the exact share URL", () => {
    const html = renderToStaticMarkup(
      <ChallengeViewBody view={view()} shareUrl="/challenges/abc-123" now={NOW} />,
    );

    expect(html).toContain('value="/challenges/abc-123"');
  });

  it("lists every participant, not just one", () => {
    const html = renderToStaticMarkup(
      <ChallengeViewBody view={view()} shareUrl="/challenges/abc-123" now={NOW} />,
    );

    expect(html).toContain("Riven#NA1");
    expect(html).toContain("Ahri#EUW");
  });

  it("renders one StatTile per rule with current / target", () => {
    const html = renderToStaticMarkup(
      <ChallengeViewBody view={view()} shareUrl="/challenges/abc-123" now={NOW} />,
    );

    expect(html).toMatch(/<data value="2 \/ 3"[^>]*>2 \/ 3<\/data>/);
    expect(html).toMatch(/<data value="0 \/ 3"[^>]*>0 \/ 3<\/data>/);
  });

  it("shows the exact freshness label 'account last checked' for a polled participant", () => {
    const html = renderToStaticMarkup(
      <ChallengeViewBody view={view()} shareUrl="/challenges/abc-123" now={NOW} />,
    );

    expect(html).toContain("account last checked");
  });

  it("shows 'not checked yet' for a participant never polled", () => {
    const html = renderToStaticMarkup(
      <ChallengeViewBody view={view()} shareUrl="/challenges/abc-123" now={NOW} />,
    );

    expect(html).toContain("not checked yet");
  });

  it("renders an empty-participants state instead of an empty list", () => {
    const html = renderToStaticMarkup(
      <ChallengeViewBody
        view={view({ participants: [] })}
        shareUrl="/challenges/abc-123"
        now={NOW}
      />,
    );

    expect(html).toContain("No one has joined yet.");
  });

  it("renders no ranking, coin, tier or XP markup", () => {
    const html = renderToStaticMarkup(
      <ChallengeViewBody view={view()} shareUrl="/challenges/abc-123" now={NOW} />,
    );

    const lower = html.toLowerCase();
    expect(lower).not.toContain("coin");
    expect(lower).not.toContain("xp");
    expect(lower).not.toContain("tier");
    expect(lower).not.toContain("leaderboard");
  });

  it("mounts joinSlot content when supplied, and nothing extra when it is not", () => {
    const withJoin = renderToStaticMarkup(
      <ChallengeViewBody
        view={view()}
        shareUrl="/challenges/abc-123"
        now={NOW}
        joinSlot={<div>JOIN SLOT MARKER</div>}
      />,
    );
    const withoutJoin = renderToStaticMarkup(
      <ChallengeViewBody view={view()} shareUrl="/challenges/abc-123" now={NOW} />,
    );

    expect(withJoin).toContain("JOIN SLOT MARKER");
    expect(withoutJoin).not.toContain("JOIN SLOT MARKER");
  });
});
