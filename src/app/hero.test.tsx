import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Hero } from "@/app/hero";

/**
 * Static-render test for the landing page's testable presentational half.
 * `page.tsx` itself stays an untested thin root — it awaits `auth()`, which
 * `renderToStaticMarkup` cannot resolve, matching `site-header-body.test.tsx`'s
 * same documented reason.
 *
 * design-system: public landing and session-gated navigation. Signed out:
 * the marketing entry screen (`design/Login.dc.html`, "01 Principal").
 * Signed in: the existing app calls to action, unchanged except for the
 * removed inline `<AuthStatus />` (now owned by the header alone).
 */
describe("Hero — signed out", () => {
  it("renders the marketing headline, subtitle and note", () => {
    const html = renderToStaticMarkup(<Hero signedIn={false} />);

    expect(html).toContain("Your friends.");
    expect(html).toContain("Your rules.");
    expect(html).toContain("Your legend.");
    expect(html).toContain(
      "Create goal challenges with your friends and let match history",
    );
    expect(html).toContain("No new account. We use your Discord sign-in.");
  });

  it("renders a single primary Log in link to /login", () => {
    const html = renderToStaticMarkup(<Hero signedIn={false} />);

    expect(html).toContain('href="/login"');
    expect(html).toContain("Log in");
  });

  it("never renders the signed-in app calls to action", () => {
    const html = renderToStaticMarkup(<Hero signedIn={false} />);

    expect(html).not.toContain('href="/challenges/new"');
    expect(html).not.toContain('href="/challenges"');
    expect(html).not.toContain("Create a challenge");
    expect(html).not.toContain("Browse challenges");
  });
});

describe("Hero — signed in", () => {
  it("renders the app calls to action, unchanged", () => {
    const html = renderToStaticMarkup(<Hero signedIn={true} />);

    expect(html).toContain('href="/challenges/new"');
    expect(html).toContain("Create a challenge");
    expect(html).toContain('href="/challenges"');
    expect(html).toContain("Browse challenges");
  });

  it("never renders the marketing headline or a Log in link", () => {
    const html = renderToStaticMarkup(<Hero signedIn={true} />);

    expect(html).not.toContain("Your friends.");
    expect(html).not.toContain('href="/login"');
  });
});
