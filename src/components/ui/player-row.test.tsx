import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlayerRow } from "@/components/ui/player-row";

/**
 * Static-render tests, matching `card.test.tsx`/`challenge-card.test.tsx`:
 * no jsdom, assertions on rendered markup/text rather than Tailwind class
 * names (strict-tdd's Implementation Detail Coupling Rule). The divider
 * behaviour is asserted by element presence/absence (an `<hr>` the row
 * renders itself), not by checking for a `border-divider` class string.
 */
describe("PlayerRow", () => {
  it("renders the name", () => {
    const html = renderToStaticMarkup(<PlayerRow name="Riven#NA1" />);

    expect(html).toContain("Riven#NA1");
  });

  it("renders meta content when supplied, and none when it is not", () => {
    const withMeta = renderToStaticMarkup(<PlayerRow name="Riven#NA1" meta="LAN" />);
    const withoutMeta = renderToStaticMarkup(<PlayerRow name="Riven#NA1" />);

    expect(withMeta).toContain("LAN");
    expect(withoutMeta).not.toContain("LAN");
  });

  it("renders the right slot when supplied", () => {
    const html = renderToStaticMarkup(<PlayerRow name="Riven#NA1" right={<span>7 / 10</span>} />);

    expect(html).toContain("7 / 10");
  });

  it("renders a divider by default", () => {
    const html = renderToStaticMarkup(<PlayerRow name="Riven#NA1" />);

    expect(html.split("<hr").length - 1).toBe(1);
  });

  it("renders no divider when divider is set to false, for the last row in a list", () => {
    const html = renderToStaticMarkup(<PlayerRow name="Riven#NA1" divider={false} />);

    expect(html.split("<hr").length - 1).toBe(0);
  });
});
