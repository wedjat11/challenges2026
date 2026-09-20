import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StatTile } from "@/components/ui/stat-tile";

/**
 * Static-render tests. `value`'s `tabular-nums` styling is identified
 * structurally via the semantic `<data value>` element it renders in,
 * never by asserting the literal `tabular-nums` class string (strict-tdd's
 * Implementation Detail Coupling Rule).
 */
describe("StatTile", () => {
  it("renders the label", () => {
    const html = renderToStaticMarkup(<StatTile label="Win 10 ranked games" value="7 / 10" />);

    expect(html).toContain("Win 10 ranked games");
  });

  it("renders value inside a <data> element, machine-readable via its value attribute", () => {
    const html = renderToStaticMarkup(<StatTile label="Play 20 games" value="12 / 20" />);

    expect(html).toMatch(/<data value="12 \/ 20"[^>]*>12 \/ 20<\/data>/);
  });

  it("renders hint text when supplied, and none when it is not", () => {
    const withHint = renderToStaticMarkup(
      <StatTile label="Play 20 games" value="12 / 20" hint="4 minutes ago" />,
    );
    const withoutHint = renderToStaticMarkup(<StatTile label="Play 20 games" value="12 / 20" />);

    expect(withHint).toContain("4 minutes ago");
    expect(withoutHint).not.toContain("4 minutes ago");
  });
});
