import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Icon } from "@/components/icons/icon";

describe("Icon", () => {
  it("renders aria-hidden when no title is supplied", () => {
    const html = renderToStaticMarkup(<Icon name="check" />);

    expect(html).toContain('aria-hidden="true"');
  });

  it("renders a <title> element and drops aria-hidden when a title is supplied", () => {
    const html = renderToStaticMarkup(<Icon name="check" title="Completed" />);

    expect(html).toContain("<title>Completed</title>");
    expect(html).not.toContain("aria-hidden");
  });

  it("renders the shared 24x24 viewBox with a currentColor stroke", () => {
    const html = renderToStaticMarkup(<Icon name="swords" />);

    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('stroke="currentColor"');
  });

  it("renders the glyph's own path data, distinct per icon name", () => {
    const check = renderToStaticMarkup(<Icon name="check" />);
    const cross = renderToStaticMarkup(<Icon name="x" />);

    expect(check).toContain('d="M20 6 9 17l-5-5"');
    expect(cross).toContain('d="M18 6 6 18"');
    expect(check).not.toBe(cross);
  });
});
