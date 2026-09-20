import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BrowseList } from "@/app/challenges/browse-list";
import type { ChallengeSummary } from "@/application/list-public-challenges";

/**
 * Static-render tests for the browse route's testable presentational
 * component, matching `login-panel.test.tsx`/`src/components/ui/*.test.tsx`.
 * `page.tsx` itself stays an untested thin root (imports `@/lib/db`, the
 * Cloudflare-bound adapters) — see design.md's other untested server pages
 * (`/challenges/new`, `/account`, `/login`) for the same pattern.
 *
 * challenge-discovery: Listing Scope, Ordering, Empty State, No
 * Gamification Chrome on the Browse List.
 */

function summary(overrides: Partial<ChallengeSummary> = {}): ChallengeSummary {
  return {
    id: "challenge-1",
    title: "Win as Ahri",
    startsAt: new Date("2026-09-18T00:00:00.000Z"),
    endsAt: new Date("2026-09-22T00:00:00.000Z"),
    state: "live",
    ruleText: ["Win 3 games as Ahri"],
    ...overrides,
  };
}

describe("BrowseList — with challenges", () => {
  it("renders a <ul> containing one <li> card per challenge", () => {
    const challenges = [
      summary({ id: "a", title: "Win as Ahri" }),
      summary({ id: "b", title: "Play 20 games", ruleText: ["Play 20 games"] }),
    ];
    const html = renderToStaticMarkup(<BrowseList challenges={challenges} />);

    expect(html).toContain("<ul");
    expect(html.split("<li").length - 1).toBe(2);
    expect(html).toContain("Win as Ahri");
    expect(html).toContain("Play 20 games");
  });

  it("links each card to its own challenge id", () => {
    const challenges = [summary({ id: "challenge-xyz" })];
    const html = renderToStaticMarkup(<BrowseList challenges={challenges} />);

    expect(html).toContain('href="/challenges/challenge-xyz"');
  });

  it("does not render the empty-state copy or CTA when challenges are present", () => {
    const html = renderToStaticMarkup(<BrowseList challenges={[summary()]} />);

    expect(html).not.toContain("No challenges are running right now.");
  });
});

describe("BrowseList — empty state", () => {
  it("renders the designed empty state with the exact copy and no error", () => {
    const html = renderToStaticMarkup(<BrowseList challenges={[]} />);

    expect(html).toContain("No challenges are running right now.");
    expect(html).not.toContain("<ul");
  });

  it("renders a primary call-to-action link to /challenges/new, not a nested button", () => {
    const html = renderToStaticMarkup(<BrowseList challenges={[]} />);

    expect(html).toContain('href="/challenges/new"');
    // The CTA must be a link, not a <button> nested inside an <a> (invalid
    // HTML and two competing interactive elements) — `buttonClassName`
    // exists precisely so this can be a styled `<a>` instead.
    expect(html).not.toContain("<button");
  });
});
