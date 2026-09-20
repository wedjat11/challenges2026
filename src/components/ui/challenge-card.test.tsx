import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChallengeCard } from "@/components/ui/challenge-card";

/**
 * Static-render tests, matching `card.test.tsx`/`badge.test.tsx`: no jsdom,
 * assertions on rendered markup/text rather than Tailwind class names
 * (strict-tdd's Implementation Detail Coupling Rule).
 */

describe("ChallengeCard", () => {
  const endsAt = new Date("2026-09-22T00:00:00.000Z");

  it("wraps the whole card in a single <a href> pointing at href", () => {
    const html = renderToStaticMarkup(
      <ul>
        <ChallengeCard
          href="/challenges/abc-123"
          title="Win as Ahri"
          state="live"
          ruleText={["Win 3 games as Ahri"]}
          endsAt={endsAt}
        />
      </ul>,
    );

    const anchorCount = html.split("<a ").length - 1;
    expect(anchorCount).toBe(1);
    expect(html).toContain('href="/challenges/abc-123"');

    // The title text must appear *after* the anchor opens, proving the
    // anchor wraps the card content rather than sitting beside it.
    const anchorIndex = html.indexOf("<a ");
    const titleIndex = html.indexOf("Win as Ahri");
    expect(titleIndex).toBeGreaterThan(anchorIndex);
  });

  it("renders the title", () => {
    const html = renderToStaticMarkup(
      <ul>
        <ChallengeCard
          href="/challenges/abc-123"
          title="Win as Ahri"
          state="live"
          ruleText={["Win 3 games as Ahri"]}
          endsAt={endsAt}
        />
      </ul>,
    );

    expect(html).toContain("Win as Ahri");
  });

  it("renders every sentence of ruleText", () => {
    const html = renderToStaticMarkup(
      <ul>
        <ChallengeCard
          href="/challenges/abc-123"
          title="Multi-rule challenge"
          state="live"
          ruleText={["Win 3 games as Ahri", "Play 20 games"]}
          endsAt={endsAt}
        />
      </ul>,
    );

    expect(html).toContain("Win 3 games as Ahri");
    expect(html).toContain("Play 20 games");
  });

  it("renders a state badge whose markup differs across upcoming, live and ended", () => {
    const render = (state: "upcoming" | "live" | "ended") =>
      renderToStaticMarkup(
        <ul>
          <ChallengeCard
            href="/challenges/abc-123"
            title="State check"
            state={state}
            ruleText={["Play 5 games"]}
            endsAt={endsAt}
          />
        </ul>,
      );

    const upcoming = render("upcoming");
    const live = render("live");
    const ended = render("ended");

    expect(upcoming).not.toBe(live);
    expect(live).not.toBe(ended);
    expect(upcoming).not.toBe(ended);
  });

  it("renders the badge's state-specific label text", () => {
    const html = renderToStaticMarkup(
      <ul>
        <ChallengeCard
          href="/challenges/abc-123"
          title="Label check"
          state="upcoming"
          ruleText={["Play 5 games"]}
          endsAt={endsAt}
        />
      </ul>,
    );

    expect(html).toContain("Upcoming");
  });

  it("renders the end time as a stable, locale-fixed <time> element", () => {
    const html = renderToStaticMarkup(
      <ul>
        <ChallengeCard
          href="/challenges/abc-123"
          title="Time check"
          state="live"
          ruleText={["Play 5 games"]}
          endsAt={endsAt}
        />
      </ul>,
    );

    expect(html).toContain('<time dateTime="2026-09-22T00:00:00.000Z"');
    // Fixed UTC/en-US formatting is deterministic regardless of the host's
    // local timezone or locale — this exact string must appear verbatim.
    expect(html).toContain("Sep 22, 2026");
  });

  it("adds the accent edge only when state is live", () => {
    const live = renderToStaticMarkup(
      <ul>
        <ChallengeCard
          href="/challenges/abc-123"
          title="Accent check"
          state="live"
          ruleText={["Play 5 games"]}
          endsAt={endsAt}
        />
      </ul>,
    );
    const upcoming = renderToStaticMarkup(
      <ul>
        <ChallengeCard
          href="/challenges/abc-123"
          title="Accent check"
          state="upcoming"
          ruleText={["Play 5 games"]}
          endsAt={endsAt}
        />
      </ul>,
    );
    const ended = renderToStaticMarkup(
      <ul>
        <ChallengeCard
          href="/challenges/abc-123"
          title="Accent check"
          state="ended"
          ruleText={["Play 5 games"]}
          endsAt={endsAt}
        />
      </ul>,
    );

    // `accentEdge` renders Card's `border-t-2 border-t-action-primary` pair
    // (semantic markup signal, not asserted as a literal class string here —
    // proven instead by markup distinctness against both non-live states).
    expect(live).not.toBe(upcoming);
    expect(live).not.toBe(ended);
  });

  it("applies accentEdge to the outer <li> only when state is live, isolated from the badge's own markup change", () => {
    // The full-document diff in the "accent edge only when state is live"
    // test above is also satisfied by the badge's label/tone changing across
    // states, so it does not actually prove accentEdge tracks `state`. This
    // test isolates the outer `<li ...>` opening tag only — nothing else on
    // the card touches that element's own attributes — so an equal opening
    // tag here can only mean accentEdge stopped varying with state.
    const openingLiTag = (state: "upcoming" | "live" | "ended") => {
      const html = renderToStaticMarkup(
        <ul>
          <ChallengeCard
            href="/challenges/abc-123"
            title="Accent isolation check"
            state={state}
            ruleText={["Play 5 games"]}
            endsAt={endsAt}
          />
        </ul>,
      );
      return html.match(/<li[^>]*>/)?.[0];
    };

    const live = openingLiTag("live");
    const upcoming = openingLiTag("upcoming");
    const ended = openingLiTag("ended");

    expect(live).not.toBe(upcoming);
    expect(live).not.toBe(ended);
  });

  it("renders exactly one <li> per card, with no nested interactive element besides the anchor", () => {
    const html = renderToStaticMarkup(
      <ul>
        <ChallengeCard
          href="/challenges/abc-123"
          title="Structure check"
          state="live"
          ruleText={["Play 5 games"]}
          endsAt={endsAt}
        />
      </ul>,
    );

    expect(html.split("<li").length - 1).toBe(1);
    expect(html).not.toContain("<button");
  });
});
