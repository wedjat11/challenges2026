import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders its children text", () => {
    const html = renderToStaticMarkup(<Badge>Live</Badge>);

    expect(html).toContain("Live");
  });

  it("renders different markup for different tones", () => {
    const neutral = renderToStaticMarkup(<Badge tone="neutral">Status</Badge>);
    const win = renderToStaticMarkup(<Badge tone="win">Status</Badge>);
    const loss = renderToStaticMarkup(<Badge tone="loss">Status</Badge>);

    expect(neutral).not.toBe(win);
    expect(win).not.toBe(loss);
  });

  it("renders the requested glyph when icon is supplied, and none when it is not", () => {
    const withIcon = renderToStaticMarkup(<Badge icon="clock">Upcoming</Badge>);
    const withoutIcon = renderToStaticMarkup(<Badge>Upcoming</Badge>);

    expect(withIcon).toContain("<svg");
    expect(withoutIcon).not.toContain("<svg");
  });

  it("renders a dot indicator only when dot is true", () => {
    const withDot = renderToStaticMarkup(<Badge dot>Live</Badge>);
    const withoutDot = renderToStaticMarkup(<Badge>Live</Badge>);

    expect(withDot).not.toBe(withoutDot);
  });

  it("renders pill and non-pill shapes with different markup", () => {
    const pill = renderToStaticMarkup(<Badge pill>Live</Badge>);
    const notPill = renderToStaticMarkup(<Badge>Live</Badge>);

    expect(pill).not.toBe(notPill);
  });
});
