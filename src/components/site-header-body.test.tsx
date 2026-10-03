import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteHeaderBody } from "@/components/site-header-body";

/**
 * Static-render test for the header's testable presentational half.
 * `site-header.tsx` stays an untested thin root — it awaits `auth()`, which
 * `renderToStaticMarkup` cannot resolve, matching `hero.test.tsx`'s and
 * `create-form-body.test.tsx`'s same documented reason.
 *
 * design-system: Header Navigation (signed-in), public landing and
 * session-gated navigation (signed-out: wordmark + "Log in" only).
 */

const AUTH_SLOT_MARKER = "AUTH-SLOT-MARKER";

describe("SiteHeaderBody — wordmark", () => {
  it("always renders a link to / with the wordmark, signed out or in", () => {
    const signedOutHtml = renderToStaticMarkup(
      <SiteHeaderBody signedIn={false} authSlot={null} />,
    );
    const signedInHtml = renderToStaticMarkup(
      <SiteHeaderBody signedIn={true} authSlot={null} />,
    );

    expect(signedOutHtml).toContain('href="/"');
    expect(signedOutHtml).toContain("BECOME A LEGEND");
    expect(signedInHtml).toContain('href="/"');
    expect(signedInHtml).toContain("BECOME A LEGEND");
  });
});

describe("SiteHeaderBody — signed out", () => {
  it("renders no <nav> and no links to the app routes", () => {
    const html = renderToStaticMarkup(<SiteHeaderBody signedIn={false} authSlot={null} />);

    expect(html).not.toContain("<nav");
    expect(html).not.toContain('href="/challenges"');
    expect(html).not.toContain('href="/challenges/new"');
    expect(html).not.toContain('href="/account"');
  });

  it('renders a "Log in" link to /login', () => {
    const html = renderToStaticMarkup(<SiteHeaderBody signedIn={false} authSlot={null} />);

    expect(html).toContain('href="/login"');
    expect(html).toContain("Log in");
  });

  it("never renders the authSlot", () => {
    const html = renderToStaticMarkup(
      <SiteHeaderBody signedIn={false} authSlot={<span>{AUTH_SLOT_MARKER}</span>} />,
    );

    expect(html).not.toContain(AUTH_SLOT_MARKER);
  });
});

describe("SiteHeaderBody — signed in", () => {
  it("renders the three navigation links with an aria-label each", () => {
    const html = renderToStaticMarkup(<SiteHeaderBody signedIn={true} authSlot={null} />);

    expect(html).toContain("<nav");
    expect(html).toContain('href="/challenges"');
    expect(html).toContain('aria-label="Challenges"');
    expect(html).toContain('href="/challenges/new"');
    expect(html).toContain('aria-label="Create"');
    expect(html).toContain('href="/account"');
    expect(html).toContain('aria-label="Account"');
  });

  it("renders the provided authSlot and no Log in link", () => {
    const html = renderToStaticMarkup(
      <SiteHeaderBody signedIn={true} authSlot={<span>{AUTH_SLOT_MARKER}</span>} />,
    );

    expect(html).toContain(AUTH_SLOT_MARKER);
    expect(html).not.toContain("Log in");
  });
});
