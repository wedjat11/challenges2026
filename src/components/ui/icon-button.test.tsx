import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { IconButton } from "@/components/ui/icon-button";

describe("IconButton", () => {
  it("renders the required label as aria-label", () => {
    const html = renderToStaticMarkup(<IconButton icon="user" label="Account" />);

    expect(html).toContain('aria-label="Account"');
  });

  it("renders a different aria-label for a different label prop", () => {
    const html = renderToStaticMarkup(<IconButton icon="plus" label="Create challenge" />);

    expect(html).toContain('aria-label="Create challenge"');
  });

  it("renders the requested glyph's own path data", () => {
    const html = renderToStaticMarkup(<IconButton icon="plus" label="Create" />);

    expect(html).toContain('d="M5 12h14"');
  });

  it("renders different markup for the ghost and solid variants", () => {
    const ghost = renderToStaticMarkup(<IconButton icon="user" label="Account" variant="ghost" />);
    const solid = renderToStaticMarkup(<IconButton icon="user" label="Account" variant="solid" />);

    expect(ghost).not.toBe(solid);
  });

  it("renders a button element that spreads a disabled attribute", () => {
    const html = renderToStaticMarkup(<IconButton icon="user" label="Account" disabled />);

    expect(html).toContain("<button");
    expect(html).toContain("disabled=\"\"");
  });
});
