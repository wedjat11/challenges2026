import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CopyLink } from "@/app/challenges/[id]/copy-link";

/**
 * Static-render only: `navigator.clipboard.writeText` and the "Copied"
 * confirmation are interaction behaviour, unreachable from
 * `renderToStaticMarkup` (no event dispatch, no jsdom). This covers the
 * readonly input's value and the copy button's accessible label only —
 * interaction is explicitly uncovered here, per this apply's phase brief.
 */
describe("CopyLink", () => {
  it("renders the exact URL as the readonly input's value", () => {
    const html = renderToStaticMarkup(<CopyLink url="/challenges/abc-123" />);

    expect(html).toContain('value="/challenges/abc-123"');
    expect(html).toContain("readOnly");
  });

  it("renders a copy control with an accessible label", () => {
    const html = renderToStaticMarkup(<CopyLink url="/challenges/abc-123" />);

    expect(html).toContain('aria-label="Copy link"');
  });

  it("renders a role=status region for the copy confirmation, empty before any interaction", () => {
    const html = renderToStaticMarkup(<CopyLink url="/challenges/abc-123" />);

    expect(html).toMatch(/role="status"[^>]*><\/span>/);
  });
});
