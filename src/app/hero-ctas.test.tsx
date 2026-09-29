import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeroCtas } from "@/app/hero-ctas";

/**
 * Static-render test for the landing page's testable presentational half.
 * `page.tsx` itself stays an untested thin root — it renders `<AuthStatus />`,
 * an async Server Component (`await auth()`), which `renderToStaticMarkup`
 * cannot resolve, matching `site-header.test.tsx`'s absence for the same
 * reason (see apply-progress.md's S1 evidence table).
 *
 * design-system: Design Tokens as CSS Custom Properties (the "Not open yet"
 * panel is replaced by real CTAs, per proposal.md's `/` screen mapping).
 */
describe("HeroCtas", () => {
  it("links to /challenges/new to create a challenge", () => {
    const html = renderToStaticMarkup(<HeroCtas />);

    expect(html).toContain('href="/challenges/new"');
    expect(html).toContain("Create a challenge");
  });

  it("links to /challenges to browse challenges", () => {
    const html = renderToStaticMarkup(<HeroCtas />);

    expect(html).toContain('href="/challenges"');
    expect(html).toContain("Browse challenges");
  });

  it("never renders the retired not-open-yet copy", () => {
    const html = renderToStaticMarkup(<HeroCtas />);

    expect(html).not.toContain("Not open yet");
    expect(html).not.toContain("Nothing can be created or joined yet");
  });
});
